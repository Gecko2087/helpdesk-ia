import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

const context = new AsyncLocalStorage();
const cookieName = 'helpdesk_sandbox';
const lifetime = 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, secure: env.nodeEnv === 'production',
  sameSite: 'strict', path: '/api', maxAge: lifetime };
const defaultDailyGeminiLimit = 20;
class DailyGeminiLimitReached extends Error {}

const starterCategories = [
  { name: 'Accesos y usuarios', description: 'Bloqueos, altas y permisos de prueba.', color: '#C99700', responsibleArea: 'Mesa de ayuda' },
  { name: 'Red e Internet', description: 'Conectividad y red de prueba.', color: '#00A7A7', responsibleArea: 'Infraestructura' },
  { name: 'Impresoras', description: 'Equipos y colas de impresión de prueba.', color: '#E56B2F', responsibleArea: 'Soporte técnico' },
];

const starterTickets = [
  {
    category: 'Accesos y usuarios', title: 'Acceso bloqueado al CRM de prueba',
    description: 'El usuario ficticio no puede ingresar al CRM de prueba después de varios intentos fallidos.',
    requesterArea: 'Ventas', sourceChannel: 'email', status: 'open', priority: 'high', impact: 'medium', urgency: 'high',
    aiStatus: 'demo', aiProvider: 'demo', aiConfidence: 'medium',
    summary: 'Un acceso de prueba figura bloqueado. Análisis ilustrativo por reglas.',
    possibleCause: 'Podría haberse activado el bloqueo por intentos fallidos.',
    responsibleArea: 'Mesa de ayuda',
    suggestedReply: 'Vamos a validar el estado del acceso de prueba y los pasos de desbloqueo.',
    suggestedSteps: ['Verificar el estado de la cuenta ficticia', 'Revisar el procedimiento de desbloqueo'],
  },
  {
    category: 'Red e Internet', title: 'Conexión WiFi intermitente en oficina ficticia',
    description: 'La conexión WiFi de la oficina ficticia se corta varias veces durante la jornada de prueba.',
    requesterArea: 'Administración', sourceChannel: 'whatsapp', status: 'in_progress', priority: 'high', impact: 'high', urgency: 'medium',
    aiStatus: 'not_analyzed', suggestedSteps: ['Comparar con otro equipo ficticio', 'Revisar la conexión de prueba'],
  },
  {
    category: 'Impresoras', title: 'Impresora de prueba no responde',
    description: 'La impresora de prueba no recibe trabajos desde el equipo ficticio de administración.',
    requesterArea: 'Administración', sourceChannel: 'presencial', status: 'resolved', priority: 'medium', impact: 'medium', urgency: 'medium',
    aiStatus: 'not_analyzed', suggestedSteps: ['Revisar la cola de impresión de prueba', 'Comprobar conexión del equipo ficticio'],
  },
];

async function createStarterData(tx, sandboxId) {
  const categoryIds = new Map();
  for (const category of starterCategories) {
    const created = await tx.category.create({ data: { ...category, sandboxId } });
    categoryIds.set(category.name, created.id);
  }
  for (const { category, suggestedSteps, ...ticket } of starterTickets) {
    await tx.ticket.create({ data: {
      ...ticket, sandboxId, categoryId: categoryIds.get(category),
      code: 'HD-' + randomBytes(16).toString('hex').toUpperCase(),
      requesterName: 'Persona de prueba',
      suggestedSteps: { create: suggestedSteps.map((text, index) => ({ order: index + 1, text })) },
      events: { create: [{ type: 'created', description: 'Ticket ficticio inicial.' }] },
    } });
  }
}

function dailyGeminiLimit() {
  const configured = process.env.GEMINI_DAILY_ANALYSIS_LIMIT;
  if (configured === undefined) return defaultDailyGeminiLimit;
  const limit = Number(configured);
  return /^\d+$/.test(configured) && Number.isSafeInteger(limit) ? limit : defaultDailyGeminiLimit;
}

export function sandboxId() {
  const id = context.getStore()?.id;
  if (!id) throw new Error('Sandbox context required');
  return id;
}

export async function sandboxMiddleware(req, res, next) {
  try {
    res.set('Cache-Control', 'private, no-store');
    // Cookie-based mutations require an exact configured origin, including first setup.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== env.clientUrl) {
      return res.status(403).json({ error: 'Origen no permitido' });
    }
    const token = req.headers.cookie?.split(';').map(part => part.trim())
      .find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    let sandbox = /^[a-f0-9]{64}$/.test(token ?? '')
      ? await prisma.sandbox.findUnique({ where: { id: hash(token) } }) : null;
    const now = new Date();
    if (sandbox?.expiresAt <= now) sandbox = null;
    if (req.path === '/demo/session' && req.method === 'POST') {
      if (!sandbox) {
        // Database-backed daily ceiling works across stateless/serverless instances.
        const budgetId = now.toISOString().slice(0, 10);
        const newToken = randomBytes(32).toString('hex');
        sandbox = await prisma.$transaction(async tx => {
          await tx.demoBudget.upsert({ where: { id: budgetId }, create: { id: budgetId }, update: {} });
          const slot = await tx.demoBudget.updateMany({ where: { id: budgetId, sessions: { lt: 100 } },
            data: { sessions: { increment: 1 } } });
          if (!slot.count) return null;
          await tx.sandbox.deleteMany({ where: { expiresAt: { lt: now } } });
          const created = await tx.sandbox.create({ data: { id: hash(newToken), expiresAt: new Date(now.getTime() + lifetime) } });
          await createStarterData(tx, created.id);
          return created;
        });
        if (!sandbox) return res.status(429).json({ error: 'La demo alcanzó su cupo diario. Volvé mañana.' });
        res.cookie(cookieName, newToken, cookieOptions);
      }
      return res.json({ expiresAt: sandbox.expiresAt, mode: 'isolated-database', limits: { requests: 250, mutations: 80, analyses: 10 } });
    }
    if (!sandbox) return res.status(401).json({ error: 'Iniciá tu espacio de prueba para continuar' });
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const analysis = mutation && ['/tickets/analyze', '/ai/analyze'].includes(req.path);
    const sessionWhere = {
      id: sandbox.id, expiresAt: { gt: now }, requests: { lt: 250 },
      ...(mutation ? { mutations: { lt: 80 } } : {}),
      ...(analysis ? { analyses: { lt: 10 } } : {}),
    };
    const sessionData = { requests: { increment: 1 },
      ...(mutation ? { mutations: { increment: 1 } } : {}),
      ...(analysis ? { analyses: { increment: 1 } } : {}),
    };
    let allowed;
    if (analysis && env.aiProvider === 'gemini') {
      const budgetId = now.toISOString().slice(0, 10);
      try {
        allowed = await prisma.$transaction(async tx => {
          const sessionSlot = await tx.sandbox.updateMany({ where: sessionWhere, data: sessionData });
          if (!sessionSlot.count) return sessionSlot;
          await tx.demoBudget.upsert({ where: { id: budgetId }, create: { id: budgetId }, update: {} });
          const globalSlot = await tx.demoBudget.updateMany({
            where: { id: budgetId, analyses: { lt: dailyGeminiLimit() } },
            data: { analyses: { increment: 1 } },
          });
          if (!globalSlot.count) throw new DailyGeminiLimitReached();
          return sessionSlot;
        });
      } catch (error) {
        if (error instanceof DailyGeminiLimitReached) {
          return res.status(429).json({ error: 'La demo alcanzó su cupo diario de análisis. Volvé mañana.' });
        }
        throw error;
      }
    } else {
      allowed = await prisma.sandbox.updateMany({ where: sessionWhere, data: sessionData });
    }
    if (!allowed.count) return res.status(429).json({ error: 'Límite de este espacio de prueba alcanzado' });
    return context.run({ id: sandbox.id }, () => next());
  } catch (error) { return next(error); }
}
function hash(token) { return createHash('sha256').update(token).digest('hex'); }
