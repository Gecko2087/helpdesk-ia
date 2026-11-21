import { analyzeTicket, normalizeAiAnalysis } from '../server/src/services/ai.service.js';
import { calculatePriority } from '../server/src/utils/calculatePriority.js';
import { categorySchema } from '../server/src/validators/category.validator.js';
import { createTicketSchema, analyzeTicketSchema, addTicketNoteSchema, updateTicketStatusSchema, reviewPrioritySchema } from '../server/src/validators/ticket.validator.js';

const json = (data, status = 200, headers = {}) => Response.json(data, {
  status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
});
const error = (message, status) => json({ error: message }, status);
const one = (db, sql, ...values) => db.prepare(sql).bind(...values).first();
const all = async (db, sql, ...values) => (await db.prepare(sql).bind(...values).all()).results;
const digest = async token => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2, '0')).join('');
const random = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const timestamp = () => new Date().toISOString();

async function startSession(db, existing) {
  if (existing) return sessionResponse(existing.expiresAt);
  const now = timestamp();
  const date = now.slice(0, 10);
  const quota = await one(db, 'INSERT INTO DemoBudget(id,sessions) VALUES (?,1) ON CONFLICT(id) DO UPDATE SET sessions=sessions+1 WHERE sessions<100 RETURNING sessions', date);
  if (!quota) return error('La demo alcanzó su cupo diario.', 429);
  const token = random();
  const id = await digest(token);
  const expiry = new Date(Date.now() + 3600000).toISOString();
  const examples = [
    ['Accesos y usuarios', 'Acceso bloqueado al CRM de prueba', 'open', '#C99700'],
    ['Red e Internet', 'Conexión WiFi intermitente en oficina ficticia', 'in_progress', '#00A7A7'],
    ['Impresoras', 'Impresora de prueba no responde', 'resolved', '#E56B2F'],
  ];
  const batch = [db.prepare('INSERT INTO Sandbox(id,expiresAt) VALUES (?,?)').bind(id, expiry)];
  for (const [category, title, status, color] of examples) {
    const code = 'HD-' + random().slice(0, 32).toUpperCase();
    batch.push(
      db.prepare('INSERT INTO Category(sandboxId,name,description,color,responsibleArea,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)').bind(id, category, 'Categoría de prueba.', color, 'Mesa de ayuda', now, now),
      db.prepare(`INSERT INTO Ticket(sandboxId,code,title,description,requesterName,requesterArea,sourceChannel,status,priority,impact,urgency,categoryId,createdAt,updatedAt)
        SELECT ?,?,?,?,'Persona de prueba','Administración','email',?,'medium','medium','medium',id,?,? FROM Category WHERE sandboxId=? AND name=?`).bind(id, code, title, title + '. Ejemplo para explorar el flujo de soporte.', status, now, now, id, category),
      db.prepare("INSERT INTO TicketEvent(ticketId,type,description,createdAt) SELECT id,'created','Ticket ficticio inicial.',? FROM Ticket WHERE code=?").bind(now, code),
      db.prepare("INSERT INTO SuggestedStep(ticketId,\"order\",text) SELECT id,1,'Verificar el incidente de prueba.' FROM Ticket WHERE code=?").bind(code),
    );
  }
  await db.batch(batch);
  return sessionResponse(expiry, token);
}

function sessionResponse(expiresAt, token) {
  const headers = token ? { 'Set-Cookie': 'helpdesk_sandbox=' + token + '; Path=/api; Max-Age=3600; HttpOnly; Secure; SameSite=Strict' } : {};
  return json({ expiresAt, mode: 'isolated-database', limits: { requests: 250, mutations: 80, analyses: 10 } }, 200, headers);
}

async function parse(request, schema) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let size = 0;
  let content = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 24576) { await reader.cancel(); return null; }
    content += decoder.decode(value, { stream: true });
  }
  try { return schema.safeParse(JSON.parse(content + decoder.decode())).data ?? null; }
  catch { return null; }
}

async function categories(db, owner) {
  return (await all(db, 'SELECT * FROM Category WHERE sandboxId=? ORDER BY name', owner)).map(row => ({ ...row, active: Boolean(row.active) }));
}

async function tickets(db, owner, query = new URLSearchParams()) {
  const filters = ['sandboxId=?'];
  const values = [owner];
  for (const field of ['status', 'priority', 'categoryId']) {
    if (!query.get(field)) continue;
    filters.push(field + '=?');
    values.push(query.get(field));
  }
  if (query.get('search')) {
    filters.push('(instr(lower(title),?)>0 OR instr(lower(description),?)>0 OR instr(lower(requesterName),?)>0)');
    values.push(...Array(3).fill(query.get('search').toLowerCase()));
  }
  const order = { priority: 'priority DESC', status: 'status ASC' }[query.get('sortBy')] || 'createdAt DESC';
  const [rows, groups] = await Promise.all([all(db, 'SELECT * FROM Ticket WHERE ' + filters.join(' AND ') + ' ORDER BY ' + order, ...values), categories(db, owner)]);
  const byId = new Map(groups.map(row => [row.id, row]));
  return rows.map(row => ({ ...row, category: byId.get(row.categoryId) ?? null }));
}

async function ticketDetail(db, owner, id) {
  const row = await one(db, 'SELECT * FROM Ticket WHERE sandboxId=? AND id=?', owner, id);
  if (!row) return null;
  const [groups, suggestedSteps, notes, events] = await Promise.all([
    categories(db, owner),
    all(db, 'SELECT * FROM SuggestedStep WHERE ticketId=? ORDER BY "order"', id),
    all(db, 'SELECT * FROM TicketNote WHERE ticketId=? ORDER BY createdAt DESC,id DESC', id),
    all(db, 'SELECT * FROM TicketEvent WHERE ticketId=? ORDER BY createdAt,id', id),
  ]);
  return { ...row, canReviewPriority: true, category: groups.find(group => group.id === row.categoryId) ?? null, suggestedSteps, notes, events };
}

async function reviewPriority(db, owner, id, input) {
  const { impact, urgency, reason } = input;
  const priority = calculatePriority(impact, urgency);
  const now = timestamp();
  await db.batch([
    db.prepare(`INSERT INTO TicketEvent(ticketId,type,description,createdAt)
      SELECT id,'priority_reviewed','Triaje revisado (' || priority || ' → ' || ? || '). ' || ?,?
      FROM Ticket WHERE id=? AND sandboxId=? AND (impact != ? OR urgency != ?)`)
      .bind(priority, reason, now, id, owner, impact, urgency),
    db.prepare('UPDATE Ticket SET impact=?,urgency=?,priority=?,updatedAt=? WHERE id=? AND sandboxId=? AND (impact != ? OR urgency != ?)')
      .bind(impact, urgency, priority, now, id, owner, impact, urgency),
  ]);
  const data = await ticketDetail(db, owner, id);
  return data ? json({ data }) : error('Ticket no encontrado.', 404);
}

async function createTicket(db, owner, input) {
  const analysis = input.analysis ? normalizeAiAnalysis(input.analysis, input) : null;
  const category = input.categoryId
    ? await one(db, 'SELECT id FROM Category WHERE sandboxId=? AND id=?', owner, input.categoryId)
    : analysis && await one(db, 'SELECT id FROM Category WHERE sandboxId=? AND name=?', owner, analysis.category);
  if (input.categoryId && !category) return error('Categoría no encontrada.', 404);
  const impact = analysis?.impact ?? input.impact;
  const urgency = analysis?.urgency ?? input.urgency;
  const code = 'HD-' + random().slice(0, 32).toUpperCase();
  const now = timestamp();
  const steps = analysis?.suggestedSteps?.length ? analysis.suggestedSteps : ['Registrar información inicial', 'Asignar responsable', 'Contactar al solicitante'];
  await db.batch([
    db.prepare(`INSERT INTO Ticket(sandboxId,code,title,description,requesterName,requesterArea,sourceChannel,priority,impact,urgency,categoryId,aiStatus,aiProvider,aiConfidence,summary,possibleCause,responsibleArea,suggestedReply,createdAt,updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(owner, code, input.title, input.description, input.requesterName, input.requesterArea, input.sourceChannel, calculatePriority(impact, urgency), impact, urgency, category?.id ?? null, analysis ? (analysis.provider === 'gemini' ? 'analyzed' : 'demo') : 'not_analyzed', analysis?.provider ?? null, analysis?.confidence ?? null, analysis?.summary ?? null, analysis?.possibleCause ?? null, analysis?.responsibleArea ?? null, analysis?.suggestedReply ?? null, now, now),
    ...steps.map((step, index) => db.prepare('INSERT INTO SuggestedStep(ticketId,"order",text) SELECT id,?,? FROM Ticket WHERE code=?').bind(index + 1, step, code)),
    db.prepare("INSERT INTO TicketEvent(ticketId,type,description,createdAt) SELECT id,'created','Ticket creado.',? FROM Ticket WHERE code=?").bind(now, code),
  ]);
  const row = await one(db, 'SELECT id FROM Ticket WHERE code=? AND sandboxId=?', code, owner);
  return json({ data: await ticketDetail(db, owner, row.id) }, 201);
}

function dashboard(rows) {
  const counts = key => [...rows.reduce((map, row) => {
    const value = key(row);
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map())].map(([name, count]) => ({ name, count }));
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  return {
    metrics: {
      totalTickets: rows.length,
      openTickets: rows.filter(row => row.status === 'open').length,
      inProgressTickets: rows.filter(row => row.status === 'in_progress').length,
      resolvedTickets: rows.filter(row => row.status === 'resolved').length,
      averagePriority: rows.length ? Number((rows.reduce((sum, row) => sum + (scores[row.priority] ?? 0), 0) / rows.length).toFixed(1)) : 0,
      analyzedTickets: rows.filter(row => ['analyzed','demo'].includes(row.aiStatus)).length,
    },
    byCategory: counts(row => row.category?.name ?? 'Sin categoría'),
    byPriority: counts(row => row.priority),
    recentTickets: rows.slice(0, 5),
    dailyRisks: rows.filter(row => ['critical','high'].includes(row.priority)).slice(0, 5),
  };
}

async function route(request, env, url, owner, isAnalysis, model) {
  const db = env.DB;
  const method = request.method;
  const path = url.pathname.replace(/\/$/, '');
  if (isAnalysis) {
    const input = await parse(request, analyzeTicketSchema);
    if (!input) return error('Datos inválidos.', 400);
    const provider = env.GEMINI_API_KEY ? 'gemini' : 'demo';
    if (provider === 'gemini') {
      const quota = await one(db, 'INSERT INTO DemoBudget(id,analyses) VALUES (?,1) ON CONFLICT(id) DO UPDATE SET analyses=analyses+1 WHERE analyses<20 RETURNING analyses', timestamp().slice(0, 10));
      if (!quota) return error('La demo alcanzó su cupo diario de análisis.', 429);
    }
    return json({ data: await analyzeTicket(input, { provider, model, apiKey: env.GEMINI_API_KEY || '' }) });
  }
  if (path === '/api/ai/status' && method === 'GET') return json({ provider: env.GEMINI_API_KEY ? 'gemini' : 'demo', model, demoMode: !env.GEMINI_API_KEY });
  if (path === '/api/dashboard' && method === 'GET') return json({ data: dashboard(await tickets(db, owner)) });
  if (path === '/api/tickets' && method === 'GET') {
    if ([...url.searchParams.values()].some(value => value.length > 160)) return error('Filtro inválido.', 400);
    return json({ data: await tickets(db, owner, url.searchParams) });
  }
  if (path === '/api/tickets' && method === 'POST') {
    const input = await parse(request, createTicketSchema);
    return input ? createTicket(db, owner, input) : error('Datos inválidos.', 400);
  }
  const ticket = path.match(/^\/api\/tickets\/(\d+)(?:\/(status|notes|priority))?$/);
  if (ticket) {
    const id = Number(ticket[1]);
    const part = ticket[2];
    if (!part && method === 'GET') {
      const data = await ticketDetail(db, owner, id);
      return data ? json({ data }) : error('Ticket no encontrado.', 404);
    }
    if (part === 'priority' && method === 'PATCH') {
      const input = await parse(request, reviewPrioritySchema);
      return input ? reviewPriority(db, owner, id, input) : error('Datos inválidos.', 400);
    }
    if ((part === 'notes' && method === 'POST') || (part === 'status' && method === 'PATCH')) {
      const notes = part === 'notes';
      const input = await parse(request, notes ? addTicketNoteSchema : updateTicketStatusSchema);
      if (!input) return error('Datos inválidos.', 400);
      if (!await one(db, 'SELECT id FROM Ticket WHERE sandboxId=? AND id=?', owner, id)) return error('Ticket no encontrado.', 404);
      const now = timestamp();
      await db.batch([
        notes
          ? db.prepare('INSERT INTO TicketNote(ticketId,content,createdAt) SELECT id,?,? FROM Ticket WHERE id=? AND sandboxId=?').bind(input.content, now, id, owner)
          : db.prepare('UPDATE Ticket SET status=?,updatedAt=? WHERE id=? AND sandboxId=?').bind(input.status, now, id, owner),
        db.prepare('INSERT INTO TicketEvent(ticketId,type,description,createdAt) SELECT id,?,?,? FROM Ticket WHERE id=? AND sandboxId=?').bind(notes ? 'note_added' : 'status_changed', notes ? 'Nota interna agregada.' : 'Estado actualizado a ' + input.status + '.', now, id, owner),
      ]);
      return json({ data: await ticketDetail(db, owner, id) }, notes ? 201 : 200);
    }
  }
  if (path === '/api/categories' && method === 'GET') return json({ data: await categories(db, owner) });
  const category = path.match(/^\/api\/categories\/(\d+)$/);
  if ((path === '/api/categories' && method === 'POST') || (category && method === 'PUT')) {
    const input = await parse(request, categorySchema);
    if (!input) return error('Datos inválidos.', 400);
    const { name, description, color, responsibleArea, active } = input;
    const now = timestamp();
    const values = [name, description, color, responsibleArea];
    const row = category
      ? await one(db, 'UPDATE OR IGNORE Category SET name=?,description=?,color=?,responsibleArea=?,active=coalesce(?,active),updatedAt=? WHERE sandboxId=? AND id=? RETURNING *', ...values, active == null ? null : Number(active), now, owner, Number(category[1]))
      : await one(db, 'INSERT OR IGNORE INTO Category(name,description,color,responsibleArea,active,updatedAt,createdAt,sandboxId) VALUES (?,?,?,?,?,?,?,?) RETURNING *', ...values, Number(active ?? true), now, now, owner);
    return row ? json({ data: { ...row, active: Boolean(row.active) } }, category ? 200 : 201) : error('Categoría inexistente o duplicada.', 409);
  }
  return error('Ruta de API no encontrada.', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    try {
      if (path === '/api/health' && request.method === 'GET') {
        await one(env.DB, 'SELECT id FROM Sandbox LIMIT 1');
        return json({ status: 'ok', service: 'helpdesk-ia' });
      }
      if (mutation && request.headers.get('Origin') !== url.origin) return error('Origen no permitido.', 403);
      const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)helpdesk_sandbox=([a-f0-9]{64})(?:;|$)/)?.[1];
      const owner = token ? await digest(token) : null;
      const session = owner && await one(env.DB, 'SELECT expiresAt FROM Sandbox WHERE id=? AND expiresAt>?', owner, timestamp());
      if (path === '/api/demo/session' && request.method === 'POST') return await startSession(env.DB, session);
      if (!session) return error('Iniciá tu espacio de prueba para continuar.', 401);
      const analysis = request.method === 'POST' && ['/api/tickets/analyze','/api/ai/analyze'].includes(path);
      const slot = await one(env.DB, `UPDATE Sandbox SET requests=requests+1, mutations=mutations+?, analyses=analyses+?
        WHERE id=? AND expiresAt>? AND requests<250 AND mutations+?<=80 AND analyses+?<=10 RETURNING id`,
      Number(mutation), Number(analysis), owner, timestamp(), Number(mutation), Number(analysis));
      if (!slot) return error('Límite de este espacio de prueba alcanzado.', 429);
      return await route(request, env, url, owner, analysis, model);
    } catch {
      return error('El servicio no está disponible.', 503);
    }
  },
  async scheduled(_event, env) {
    const now = timestamp();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM Sandbox WHERE expiresAt<=?').bind(now),
      env.DB.prepare('DELETE FROM DemoBudget WHERE id<?').bind(now.slice(0, 10)),
    ]);
  },
};
