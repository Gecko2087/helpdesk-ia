import { prisma } from "../config/prisma.js";
import { normalizeAiAnalysis } from "./ai.service.js";
import { calculatePriority } from "../utils/calculatePriority.js";
import { formatTicketCode } from "../utils/ticketCode.js";

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
    where: { id },
    include: includeTicketRelations
  });
}

export async function createTicket(data) {
  const nextCode = await getNextTicketCode();
  const analysis = data.analysis ? normalizeAiAnalysis(data.analysis, data) : null;
  const categoryId = data.categoryId ?? (analysis ? await resolveCategoryId(analysis.category) : undefined);
  const impact = analysis?.impact ?? data.impact;
  const urgency = analysis?.urgency ?? data.urgency;
  const priority = calculatePriority(impact, urgency);
  const suggestedSteps = analysis?.suggestedSteps?.length
    ? analysis.suggestedSteps
    : ["Registrar informacion inicial", "Asignar responsable", "Contactar al solicitante"];

  const ticket = await prisma.ticket.create({
    data: {
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
    where: { id },
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
    where: { id },
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
  const category = await prisma.category.findUnique({ where: { name: categoryName } });

  if (category) return category.id;

  const fallback = await prisma.category.findUnique({ where: { name: "Otro" } });
  return fallback?.id;
}

async function getNextTicketCode() {
  const latest = await prisma.ticket.findFirst({
    orderBy: { id: "desc" },
    select: { code: true }
  });
  const latestNumber = latest?.code ? Number(latest.code.replace("HD-", "")) : 0;

  return formatTicketCode(Number.isFinite(latestNumber) ? latestNumber + 1 : 1);
}

function buildTicketWhere(query) {
  const where = {};

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
