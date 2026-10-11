import request from 'supertest';
import { beforeEach, describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import { app } from './app.js';
import { prisma } from './config/prisma.js';
import { env } from './config/env.js';
assert.equal(process.env.NODE_ENV, 'test');
assert.match(process.env.DATABASE_URL ?? '', /^file:.*helpdesk-test-/);
const origin = 'http://localhost:3001';
const validTicket = { title: 'Acceso bloqueado', description: 'Mi usuario de prueba no puede ingresar al sistema.',
  requesterName: 'Persona ficticia', requesterArea: 'Demo', sourceChannel: 'email', impact: 'medium', urgency: 'high' };
async function visitor() {
  const client = request.agent(app);
  const response = await client.post('/api/demo/session').set('Origin', origin);
  expect(response.status).toBe(200);
  return client;
}
describe('isolated database demo', () => {
  beforeEach(async () => { await prisma.sandbox.deleteMany(); await prisma.demoBudget.deleteMany(); });
  it('requires a server session and protects cookie-based mutations from other origins', async () => {
    expect((await request(app).get('/api/tickets')).status).toBe(401);
    expect((await request(app).post('/api/demo/session').set('Origin', 'https://other.example')).status).toBe(403);
    const client = await visitor();
    expect((await client.post('/api/tickets').send(validTicket)).status).toBe(403);
    expect((await client.post('/api/tickets').set('Origin', 'https://other.example').send(validTicket)).status).toBe(403);
  });
  it('persists records, scopes lists and dashboard, and blocks all cross-visitor object mutations', async () => {
    const owner = await visitor(); const other = await visitor();
    const category = await owner.post('/api/categories').set('Origin', origin).send({
      name: 'Categoría ficticia', description: 'Solo para prueba', color: '#00A7A7', responsibleArea: 'Demo' });
    expect(category.status).toBe(201);
    const created = await owner.post('/api/tickets').set('Origin', origin).send({ ...validTicket, categoryId: category.body.data.id });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    await prisma.$disconnect(); // A new DB connection still retrieves the same persisted row.
    expect((await owner.get(`/api/tickets/${id}`)).body.data.title).toBe(validTicket.title);
    const ownerTickets = (await owner.get('/api/tickets')).body.data;
    const otherTickets = (await other.get('/api/tickets')).body.data;
    expect(ownerTickets).toHaveLength(4);
    expect(otherTickets).toHaveLength(3);
    expect(otherTickets.some(ticket => ticket.id === id)).toBe(false);
    expect(new Set([...ownerTickets, ...otherTickets].map(ticket => ticket.code)).size).toBe(7);
    expect((await other.get('/api/categories')).body.data).toHaveLength(3);
    expect((await other.get('/api/dashboard')).body.data.metrics.totalTickets).toBe(3);
    expect((await other.get(`/api/tickets/${id}`)).status).toBe(404);
    expect((await other.patch(`/api/tickets/${id}/status`).set('Origin', origin).send({ status: 'resolved' })).status).toBe(404);
    expect((await other.post(`/api/tickets/${id}/notes`).set('Origin', origin).send({ content: 'foreign note' })).status).toBe(404);
    expect((await other.post('/api/tickets').set('Origin', origin).send({ ...validTicket, categoryId: category.body.data.id })).status).toBe(404);
    expect((await other.patch(`/api/categories/${category.body.data.id}`).set('Origin', origin).send({
      name: 'Otra categoría', description: 'Solo para prueba', color: '#00A7A7', responsibleArea: 'Demo' })).status).toBe(404);
    expect((await owner.get(`/api/tickets/${id}`)).body.data.status).toBe('open');
    expect((await owner.patch(`/api/tickets/${id}/status`).set('Origin', origin).send({ status: 'resolved' })).status).toBe(200);
  });
  it('creates three fictional tickets once per sandbox and keeps the starter data on session refresh', async () => {
    const client = await visitor();
    const tickets = (await client.get('/api/tickets')).body.data;
    expect(tickets).toHaveLength(3);
    expect(tickets.every(ticket => ticket.requesterName === 'Persona de prueba')).toBe(true);
    expect((await client.get('/api/categories')).body.data).toHaveLength(3);
    expect((await client.post('/api/demo/session').set('Origin', origin)).status).toBe(200);
    expect((await client.get('/api/tickets')).body.data).toHaveLength(3);
  });
  it('uses HttpOnly cookies, stores only token hashes and expires sessions', async () => {
    const response = await request(app).post('/api/demo/session').set('Origin', origin);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Strict');
    const token = cookie.split(';')[0].split('=')[1];
    const session = await prisma.sandbox.findFirst();
    expect(session.id).not.toBe(token);
    await prisma.sandbox.update({ where: { id: session.id }, data: { expiresAt: new Date(0) } });
    expect((await request(app).get('/api/tickets').set('Cookie', cookie.split(';')[0])).status).toBe(401);
  });
  it('enforces database-backed mutation, request and daily allocation ceilings', async () => {
    const client = await visitor(); const session = await prisma.sandbox.findFirst();
    await prisma.sandbox.update({ where: { id: session.id }, data: { mutations: 80 } });
    expect((await client.post('/api/tickets').set('Origin', origin).send(validTicket)).status).toBe(429);
    await prisma.sandbox.update({ where: { id: session.id }, data: { requests: 250 } });
    expect((await client.get('/api/tickets')).status).toBe(429);
    await prisma.demoBudget.updateMany({ data: { sessions: 100 } });
    expect((await request(app).post('/api/demo/session').set('Origin', origin)).status).toBe(429);
  });
  it('shares a persistent daily Gemini analysis ceiling across visitors without charging rejected sessions', async () => {
    const first = await visitor(); const second = await visitor();
    const previousProvider = env.aiProvider;
    const previousLimit = process.env.GEMINI_DAILY_ANALYSIS_LIMIT;
    env.aiProvider = 'gemini';
    process.env.GEMINI_DAILY_ANALYSIS_LIMIT = '1';
    try {
      expect((await first.post('/api/ai/analyze').set('Origin', origin).send(validTicket)).status).toBe(200);
      await prisma.$disconnect();
      expect((await second.post('/api/tickets/analyze').set('Origin', origin).send(validTicket)).status).toBe(429);
      const budget = await prisma.demoBudget.findFirst();
      expect(budget.analyses).toBe(1);
      const sessions = await prisma.sandbox.findMany();
      expect(sessions.reduce((total, session) => total + session.analyses, 0)).toBe(1);
      expect(sessions.reduce((total, session) => total + session.requests, 0)).toBe(1);
    } finally {
      env.aiProvider = previousProvider;
      if (previousLimit === undefined) delete process.env.GEMINI_DAILY_ANALYSIS_LIMIT;
      else process.env.GEMINI_DAILY_ANALYSIS_LIMIT = previousLimit;
    }
  });
});
