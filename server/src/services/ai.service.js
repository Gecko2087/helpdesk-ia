import { env } from "../config/env.js";
import { calculatePriority } from "../utils/calculatePriority.js";

const allowedCategories = [
  "Red e Internet",
  "Hardware",
  "Software",
  "Accesos y usuarios",
  "Impresoras",
  "Correo electronico",
  "CRM o sistema interno",
  "Seguridad",
  "Otro"
];

export function getAiStatus() {
  return {
    provider: env.aiProvider,
    model: env.geminiModel,
    demoMode: env.aiProvider !== "gemini"
  };
}

export async function analyzeTicket(ticket, options = {}) {
  const provider = options.provider ?? env.aiProvider;
  const apiKey = options.apiKey ?? env.geminiApiKey;
  const model = options.model ?? env.geminiModel;

  if (provider !== "gemini" || !apiKey) {
    return analyzeTicketDemo(ticket);
  }

  try {
    const generateContent = options.generateContent ?? requestGeminiContent;
    const response = await generateContent({
      apiKey,
      model,
      prompt: buildGeminiPrompt(ticket)
    });
    const rawText = typeof response === "string" ? response : response.text;
    const parsed = parseGeminiJson(rawText);

    return normalizeAiAnalysis(
      {
        ...parsed,
        provider: "gemini"
      },
      ticket
    );
  } catch (error) {
    if (env.nodeEnv === "development") {
      console.warn(`Analisis Gemini no disponible, usando modo demo: ${error.message}`);
    }

    return {
      ...analyzeTicketDemo(ticket),
      warning: buildGeminiFallbackWarning(error)
    };
  }
}

export function buildGeminiPrompt(ticket) {
  return `Actua como analista de mesa de ayuda IT.
Tu tarea es analizar un ticket de soporte tecnico y devolver una respuesta util para priorizarlo y asistir su resolucion.

Debes responder unicamente con JSON valido. No agregues markdown, comentarios ni texto fuera del JSON.

Categorias permitidas:
- Red e Internet
- Hardware
- Software
- Accesos y usuarios
- Impresoras
- Correo electronico
- CRM o sistema interno
- Seguridad
- Otro

Prioridades permitidas:
- critical
- high
- medium
- low

Impacto permitido:
- high
- medium
- low

Urgencia permitida:
- high
- medium
- low

Confianza permitida:
- high
- medium
- low

Ticket:
Titulo: ${ticket.title}
Descripcion: ${ticket.description}
Solicitante: ${ticket.requesterName ?? "No informado"}
Area: ${ticket.requesterArea}
Canal: ${ticket.sourceChannel}
Impacto inicial: ${ticket.impact ?? "medium"}
Urgencia inicial: ${ticket.urgency ?? "medium"}

Devuelve este JSON:
{
  "category": "una categoria permitida",
  "priority": "critical | high | medium | low",
  "impact": "high | medium | low",
  "urgency": "high | medium | low",
  "confidence": "high | medium | low",
  "summary": "resumen breve del problema",
  "possibleCause": "posible causa tecnica",
  "responsibleArea": "area sugerida",
  "suggestedSteps": ["paso 1", "paso 2", "paso 3"],
  "suggestedReply": "respuesta clara para enviar al usuario",
  "missingInfo": ["dato faltante si corresponde"]
}`;
}

export function parseGeminiJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("La respuesta de IA no tuvo el formato esperado.");
  }

  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}

export function analyzeTicketDemo(ticket) {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();
  const impact = ticket.impact ?? "medium";
  const urgency = ticket.urgency ?? (text.includes("urgente") ? "high" : "medium");

  const category = detectCategory(text);
  const priority = text.includes("caido") || text.includes("produccion")
    ? "critical"
    : text.includes("no puedo trabajar") || text.includes("bloqueado") || text.includes("sin internet")
      ? "high"
      : calculatePriority(impact, urgency);

  return normalizeAiAnalysis({
    provider: "demo",
    category,
    priority,
    impact,
    urgency,
    confidence: "medium",
    summary: `Solicitud relacionada con ${category.toLowerCase()}.`,
    possibleCause: "Se requiere validacion tecnica inicial para confirmar la causa.",
    responsibleArea: category === "CRM o sistema interno" ? "Aplicaciones" : "Mesa de ayuda",
    suggestedSteps: [
      "Confirmar alcance del incidente con el solicitante.",
      "Reproducir o verificar el problema reportado.",
      "Registrar evidencia y escalar si no se resuelve en primera linea."
    ],
    suggestedReply: "Hola, recibimos tu solicitud y vamos a revisarla para darte una respuesta lo antes posible.",
    missingInfo: []
  });
}

async function requestGeminiContent({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    const message = body || response.statusText;
    const modelUnavailable = response.status === 404 || /not found|not supported|model/i.test(message);

    if (modelUnavailable) {
      throw new Error(`El modelo Gemini configurado no esta disponible: ${model}. Revisar GEMINI_MODEL.`);
    }

    throw new Error("No se pudo analizar el ticket con Gemini. Podes intentar nuevamente o usar modo demo.");
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") ?? "";

  return { text };
}

export function normalizeAiAnalysis(analysis = {}, defaults = {}) {
  const impact = normalizeLevel(analysis.impact, normalizeLevel(defaults.impact, "medium"));
  const urgency = normalizeLevel(analysis.urgency, normalizeLevel(defaults.urgency, "medium"));
  const priority = ["critical", "high", "medium", "low"].includes(analysis.priority)
    ? analysis.priority
    : calculatePriority(impact, urgency);
  const suggestedSteps = Array.isArray(analysis.suggestedSteps) && analysis.suggestedSteps.length > 0
    ? analysis.suggestedSteps.filter(Boolean)
    : ["Confirmar informacion del ticket.", "Verificar el alcance del problema.", "Registrar acciones realizadas."];

  return {
    provider: analysis.provider ?? getAiStatus().provider,
    category: allowedCategories.includes(analysis.category) ? analysis.category : "Otro",
    priority,
    impact,
    urgency,
    confidence: normalizeLevel(analysis.confidence, "medium"),
    summary: analysis.summary || "Ticket pendiente de resumen tecnico.",
    possibleCause: analysis.possibleCause || "Se requiere revision inicial para determinar la causa.",
    responsibleArea: analysis.responsibleArea || "Mesa de ayuda",
    suggestedSteps,
    suggestedReply:
      analysis.suggestedReply || "Hola, recibimos tu solicitud y vamos a revisarla para darte una respuesta.",
    missingInfo: Array.isArray(analysis.missingInfo) ? analysis.missingInfo : []
  };
}

function detectCategory(text) {
  if (/(internet|red|wifi|conexion|conexión|cable)/.test(text)) return "Red e Internet";
  if (/(impresora|imprimir|toner)/.test(text)) return "Impresoras";
  if (/(crm|sistema|error 500|neotel)/.test(text)) return "CRM o sistema interno";
  if (/(usuario|contrasena|contraseña|acceso|bloqueado)/.test(text)) return "Accesos y usuarios";
  if (/(correo|mail|outlook)/.test(text)) return "Correo electronico";
  if (/(lenta|disco|memoria|cpu|pc)/.test(text)) return "Hardware";
  if (/(virus|phishing|seguridad)/.test(text)) return "Seguridad";
  return "Otro";
}

function normalizeLevel(value, fallback) {
  return ["low", "medium", "high"].includes(value) ? value : fallback;
}

function buildGeminiFallbackWarning(error) {
  const message = error?.message ?? "";

  if (/modelo gemini|modelo configurado|model/i.test(message)) {
    return "El modelo configurado no esta disponible. Se uso modo demo; revisa GEMINI_MODEL en el backend.";
  }

  if (/formato esperado|json/i.test(message)) {
    return "La respuesta de IA no tuvo el formato esperado. Se uso modo demo.";
  }

  return "No se pudo analizar el ticket con Gemini. Se uso modo demo.";
}
