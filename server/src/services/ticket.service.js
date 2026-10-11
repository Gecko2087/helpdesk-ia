import { prisma } from "../config/prisma.js";
import { normalizeAiAnalysis } from "./ai.service.js";
import { calculatePriority } from "../utils/calculatePriority.js";
import { sandboxId } from '../middleware/sandbox.js';
import { randomBytes } from 'node:crypto';

const includeTicketRelations = {
  category: true,
  suggestedSteps: { orderBy: { order: "asc" } },
  notes: { orderBy: { createdAt: "desc" } },
  events: { orderBy: { createdAt: "asc" } }
};

export async function listTickets(query) {
  const where = buildTicketWhere(query);
  const orderBy = buildTicketOrder(query.sortBy);

  return prisma.ticket.findMany({
    where,
    include: { category: true },
    orderBy
  });
}

export function getTicketById(id) {
  return prisma.ticket.findUnique({
    where: { id, sandboxId: sandboxId() },
    include: includeTicketRelations
  });
}

export async function createTicket(data) {
  const nextCode = await getNextTicketCode();
  const analysis = data.analysis ? normalizeAiAnalysis(data.analysis, data) : null;
  const categoryId = data.categoryId ?? (analysis ? await resolveCategoryId(analysis.category) : undefined);
  if (categoryId !== undefined) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, sandboxId: sandboxId() } });
    if (!category) throw Object.assign(new Error('Category not found'), { code: 'P2025' });
  }
  const impact = analysis?.impact ?? data.impact;
  const urgency = analysis?.urgency ?? data.urgency;
  const priority = calculatePriority(impact, urgency);
  const suggestedSteps = analysis?.suggestedSteps?.length
    ? analysis.suggestedSteps
    : ["Registrar informacion inicial", "Asignar responsable", "Contactar al solicitante"];

  const ticket = await prisma.ticket.create({
    data: {
      sandboxId: sandboxId(),
      code: nextCode,
      title: data.title,
      description: data.description,
      requesterName: data.requesterName,
      requesterArea: data.requesterArea,
      sourceChannel: data.sourceChannel,
      impact,
      urgency,
      priority,
      categoryId,
      aiStatus: analysis ? (analysis.provider === "demo" ? "demo" : "analyzed") : "not_analyzed",
      aiProvider: analysis?.provider ?? null,
      aiConfidence: normalizeConfidence(analysis?.confidence),
      summary: analysis?.summary,
      possibleCause: analysis?.possibleCause,
      responsibleArea: analysis?.responsibleArea,
      suggestedReply: analysis?.suggestedReply,
      suggestedSteps: {
        create: suggestedSteps.map((text, index) => ({ order: index + 1, text }))
      },
      events: {
        create: [{ type: "created", description: "Ticket creado." }]
      }
    },
    include: includeTicketRelations
  });

  return ticket;
}

export function updateTicketStatus(id, status) {
  return prisma.ticket.update({
    where: { id, sandboxId: sandboxId() },
    data: {
      status,
      events: {
        create: {
          type: "status_changed",
          description: `Estado actualizado a ${status}.`
        }
      }
    },
    include: includeTicketRelations
  });
}

export function addTicketNote(id, content) {
  return prisma.ticket.update({
    where: { id, sandboxId: sandboxId() },
    data: {
      notes: {
        create: { content }
      },
      events: {
        create: {
          type: "note_added",
          description: "Nota interna agregada."
        }
      }
    },
    include: includeTicketRelations
  });
}

async function resolveCategoryId(categoryName) {
  const category = await prisma.category.findFirst({ where: { name: categoryName, sandboxId: sandboxId() } });

  if (category) return category.id;

  const fallback = await prisma.category.findFirst({ where: { name: "Otro", sandboxId: sandboxId() } });
  return fallback?.id;
}

async function getNextTicketCode() {
  // Random 128-bit identifier avoids read-last/increment races between visitors.
  return 'HD-' + randomBytes(16).toString('hex').toUpperCase();
}

function buildTicketWhere(query) {
  const where = { sandboxId: sandboxId() };

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.categoryId) where.categoryId = Number(query.categoryId);
  if (query.search) {
    where.OR = [
      { title: { contains: query.search } },
      { description: { contains: query.search } },
      { requesterName: { contains: query.search } }
    ];
  }

  return where;
}

function buildTicketOrder(sortBy) {
  if (sortBy === "priority") return { priority: "desc" };
  if (sortBy === "status") return { status: "asc" };
  return { createdAt: "desc" };
}

function normalizeConfidence(confidence) {
  return ["low", "medium", "high"].includes(confidence) ? confidence : null;
}
