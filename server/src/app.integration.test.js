import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import assert from 'node:assert/strict';

import { app } from "./app.js";
import { prisma } from "./config/prisma.js";

assert.equal(process.env.NODE_ENV, 'test');
assert.match(process.env.DATABASE_URL ?? '', /^file:.*helpdesk-test-/);
let client;

describe("backend API", () => {
  beforeEach(async () => {
    await prisma.ticketEvent.deleteMany();
    await prisma.ticketNote.deleteMany();
    await prisma.suggestedStep.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.sandbox.deleteMany();
    await prisma.demoBudget.deleteMany();
    client = request.agent(app);
    await client.post('/api/demo/session').set('Origin', 'http://localhost:3001');
  });

  it("allows credentialed requests only from configured development origins", async () => {
    const allowed = await request(app).options('/api/tickets')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'POST');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const other = await request(app).options('/api/tickets')
      .set('Origin', 'https://other.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it("reports IA provider status without exposing secrets", async () => {
    const response = await client.get("/api/ai/status");

    expect(response.status).toBe(200);
    expect(["demo", "gemini"]).toContain(response.body.provider);
    expect(response.body.model).toEqual(expect.any(String));
    expect(response.body.demoMode).toEqual(expect.any(Boolean));
    expect(JSON.stringify(response.body)).not.toContain("GEMINI_API_KEY");
  });

  it("creates and lists categories", async () => {
    const createResponse = await client.post("/api/categories").set('Origin', 'http://localhost:3001').send({
      name: "Hardware",
      description: "Equipos de prueba",
      color: "#00A7A7",
      responsibleArea: "Soporte Tecnico",
      active: true
    });

    expect(createResponse.status).toBe(201);

    const listResponse = await client.get("/api/categories");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(4);
    expect(listResponse.body.data.some(category => category.name === "Hardware")).toBe(true);
  });

  it("creates a ticket with code, event and suggested steps", async () => {
    const category = await prisma.category.findFirst({ where: { name: "Accesos y usuarios" } });

    const response = await client.post("/api/tickets").set('Origin', 'http://localhost:3001').send({
      title: "Usuario bloqueado en CRM",
      description: "No puedo ingresar al CRM porque el sistema indica usuario bloqueado.",
      requesterName: "Ana Gomez",
      requesterArea: "Comercial",
      sourceChannel: "email",
      impact: "medium",
      urgency: "high",
      categoryId: category.id,
      analysis: {
        priority: "critical",
        confidence: "medium",
        summary: "Usuario bloqueado en CRM.",
        possibleCause: "Bloqueo por intentos fallidos.",
        responsibleArea: "Mesa de ayuda",
        suggestedReply: "Vamos a revisar el bloqueo del usuario.",
        suggestedSteps: ["Validar identidad", "Desbloquear usuario"]
      }
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      priority: "high",
      status: "open"
    });
    expect(["analyzed", "demo"]).toContain(response.body.data.aiStatus);
    expect(response.body.data.code).toMatch(/^HD-[A-F0-9]{32}$/);
    expect(response.body.data.suggestedSteps).toHaveLength(2);
    expect(response.body.data.events[0].type).toBe("created");
  });

  it("links ticket category from AI analysis when categoryId is omitted", async () => {
    const response = await client.post("/api/tickets").set('Origin', 'http://localhost:3001').send({
      title: "No tengo internet",
      description: "No tengo conexion a internet en mi computadora desde esta manana.",
      requesterName: "Juan Diaz",
      requesterArea: "Administracion",
      sourceChannel: "whatsapp",
      impact: "high",
      urgency: "medium",
      analysis: {
        provider: "demo",
        category: "Red e Internet",
        priority: "high",
        impact: "high",
        urgency: "medium",
        confidence: "medium",
        summary: "Sin conexion.",
        possibleCause: "Falla de red.",
        responsibleArea: "Infraestructura",
        suggestedReply: "Vamos a revisar la conexion.",
        suggestedSteps: ["Verificar red"]
      }
    });

    expect(response.status).toBe(201);
    expect(response.body.data.category.name).toBe("Red e Internet");
  });

  it("filters tickets and updates ticket status", async () => {
    const createResponse = await client.post("/api/tickets").set('Origin', 'http://localhost:3001').send({
      title: "No tengo internet",
      description: "No tengo conexion a internet en mi computadora desde esta manana.",
      requesterName: "Juan Diaz",
      requesterArea: "Administracion",
      sourceChannel: "whatsapp",
      impact: "high",
      urgency: "high"
    });

    const ticketId = createResponse.body.data.id;

    const listResponse = await client.get("/api/tickets?status=open&search=internet");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const statusResponse = await client
      .patch(`/api/tickets/${ticketId}/status`)
      .set('Origin', 'http://localhost:3001')
      .send({ status: "in_progress" });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.status).toBe("in_progress");
  });

  it("returns dashboard metrics", async () => {
    await client.post("/api/tickets").set('Origin', 'http://localhost:3001').send({
      title: "Impresora no responde",
      description: "La impresora de administracion no responde al enviar documentos.",
      requesterName: "Maria Ruiz",
      requesterArea: "Administracion",
      sourceChannel: "presencial",
      impact: "medium",
      urgency: "medium"
    });

    const response = await client.get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data.metrics.totalTickets).toBe(4);
    expect(response.body.data.metrics.openTickets).toBe(2);
    expect(response.body.data.recentTickets).toHaveLength(4);
  });
});
