import { describe, expect, it, vi } from "vitest";

import { analyzeTicket, buildGeminiPrompt, normalizeAiAnalysis, parseGeminiJson } from "./ai.service.js";

describe("normalizeAiAnalysis", () => {
  it("normalizes invalid AI values and fills safe defaults", () => {
    const analysis = normalizeAiAnalysis({
      category: "Categoria inexistente",
      priority: "urgent",
      impact: "medium",
      urgency: "high",
      confidence: "certain",
      suggestedSteps: [],
      suggestedReply: ""
    });

    expect(analysis).toMatchObject({
      category: "Otro",
      priority: "high",
      impact: "medium",
      urgency: "high",
      confidence: "medium"
    });
    expect(analysis.suggestedSteps.length).toBeGreaterThan(0);
    expect(analysis.suggestedReply.length).toBeGreaterThan(0);
  });
});

describe("Gemini analysis service", () => {
  const ticket = {
    title: "No tengo internet",
    description: "No tengo conexion a internet en mi computadora desde esta manana.",
    requesterName: "Juan Perez",
    requesterArea: "Administracion",
    sourceChannel: "whatsapp",
    impact: "high",
    urgency: "medium"
  };

  it("builds a prompt that requires valid JSON and includes ticket data", () => {
    const prompt = buildGeminiPrompt(ticket);

    expect(prompt).toContain("Debes responder unicamente con JSON valido");
    expect(prompt).toContain("Titulo: No tengo internet");
    expect(prompt).toContain("Area: Administracion");
    expect(prompt).toContain("Prioridades permitidas");
  });

  it("parses raw Gemini JSON text", () => {
    const parsed = parseGeminiJson('{"category":"Red e Internet","priority":"high"}');

    expect(parsed).toMatchObject({
      category: "Red e Internet",
      priority: "high"
    });
  });

  it("uses Gemini provider when a key is configured", async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: '{"category":"Red e Internet","priority":"high","impact":"high","urgency":"medium","confidence":"high","summary":"Sin conexion","possibleCause":"Falla de red","responsibleArea":"Infraestructura","suggestedSteps":["Revisar WiFi"],"suggestedReply":"Vamos a revisar la conexion.","missingInfo":[]}'
    });

    const analysis = await analyzeTicket(ticket, {
      provider: "gemini",
      apiKey: "test-key",
      model: "gemini-test",
      generateContent
    });

    expect(generateContent).toHaveBeenCalledOnce();
    expect(analysis).toMatchObject({
      provider: "gemini",
      category: "Red e Internet",
      priority: "high",
      confidence: "high"
    });
  });

  it("passes the configured model to the Gemini request", async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: '{"category":"Red e Internet","priority":"high","impact":"high","urgency":"medium","confidence":"high","summary":"Sin conexion","possibleCause":"Falla de red","responsibleArea":"Infraestructura","suggestedSteps":["Revisar WiFi"],"suggestedReply":"Vamos a revisar la conexion.","missingInfo":[]}'
    });

    await analyzeTicket(ticket, {
      provider: "gemini",
      apiKey: "test-key",
      model: "modelo-desde-env",
      generateContent
    });

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "modelo-desde-env"
      })
    );
  });

  it("falls back to demo when Gemini is configured without API key", async () => {
    const generateContent = vi.fn();

    const analysis = await analyzeTicket(ticket, {
      provider: "gemini",
      apiKey: "",
      model: "gemini-test",
      generateContent
    });

    expect(generateContent).not.toHaveBeenCalled();
    expect(analysis.provider).toBe("demo");
    expect(analysis.category).toBe("Red e Internet");
  });

  it("falls back to demo when Gemini returns invalid JSON", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "no es json" });

    const analysis = await analyzeTicket(ticket, {
      provider: "gemini",
      apiKey: "test-key",
      model: "gemini-test",
      generateContent
    });

    expect(analysis.provider).toBe("demo");
    expect(analysis.warning).toContain("formato esperado");
  });

  it("falls back to demo with a controlled warning when Gemini model is unavailable", async () => {
    const generateContent = vi.fn().mockRejectedValue(
      new Error("Modelo Gemini no disponible: modelo-preview-invalido. Revisar GEMINI_MODEL.")
    );

    const analysis = await analyzeTicket(ticket, {
      provider: "gemini",
      apiKey: "test-key",
      model: "modelo-preview-invalido",
      generateContent
    });

    expect(analysis.provider).toBe("demo");
    expect(analysis.warning).toContain("modelo configurado no esta disponible");
  });
});
