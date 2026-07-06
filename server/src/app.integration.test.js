import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "./app.js";
import { prisma } from "./config/prisma.js";

describe("backend API", () => {
  beforeEach(async () => {
    await prisma.ticketEvent.deleteMany();
    await prisma.ticketNote.deleteMany();
    await prisma.suggestedStep.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
  });

  it("reports IA provider status without exposing secrets", async () => {
    const response = await request(app).get("/api/ai/status");

    expect(response.status).toBe(200);
    expect(["demo", "gemini"]).toContain(response.body.provider);
    expect(response.body.model).toEqual(expect.any(String));
    expect(response.body.demoMode).toEqual(expect.any(Boolean));
    expect(JSON.stringify(response.body)).not.toContain("GEMINI_API_KEY");
  });

  it("creates and lists categories", async () => {
    const createResponse = await request(app).post("/api/categories").send({
      name: "Red e Internet",
      description: "Problemas de conectividad y red",
      color: "#00A7A7",
      responsibleArea: "Soporte Tecnico",
      active: true
    });

    expect(createResponse.status).toBe(201);

    const listResponse = await request(app).get("/api/categories");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].name).toBe("Red e Internet");
  });

  it("creates a ticket with code, event and suggested steps", async () => {
    const category = await prisma.category.create({
      data: {
        name: "Accesos y usuarios",
        description: "Altas, bloqueos y permisos",
        color: "#18A058",
        responsibleArea: "Mesa de ayuda"
      }
    });

    const response = await request(app).post("/api/tickets").send({
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
    expect(response.body.data.code).toMatch(/^HD-\d{4}$/);
    expect(response.body.data.suggestedSteps).toHaveLength(2);
    expect(response.body.data.events[0].type).toBe("created");
  });

  it("links ticket category from AI analysis when categoryId is omitted", async () => {
    await prisma.category.create({
      data: {
        name: "Red e Internet",
        description: "Conectividad",
        color: "#00A7A7",
        responsibleArea: "Infraestructura"
      }
    });

    const response = await request(app).post("/api/tickets").send({
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
    const createResponse = await request(app).post("/api/tickets").send({
      title: "No tengo internet",
      description: "No tengo conexion a internet en mi computadora desde esta manana.",
      requesterName: "Juan Diaz",
      requesterArea: "Administracion",
      sourceChannel: "whatsapp",
      impact: "high",
      urgency: "high"
    });

    const ticketId = createResponse.body.data.id;

    const listResponse = await request(app).get("/api/tickets?status=open&search=internet");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const statusResponse = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .send({ status: "in_progress" });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.status).toBe("in_progress");
  });

  it("returns dashboard metrics", async () => {
    await request(app).post("/api/tickets").send({
      title: "Impresora no responde",
      description: "La impresora de administracion no responde al enviar documentos.",
      requesterName: "Maria Ruiz",
      requesterArea: "Administracion",
      sourceChannel: "presencial",
      impact: "medium",
      urgency: "medium"
    });

    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data.metrics.totalTickets).toBe(1);
    expect(response.body.data.metrics.openTickets).toBe(1);
    expect(response.body.data.recentTickets).toHaveLength(1);
  });
});
