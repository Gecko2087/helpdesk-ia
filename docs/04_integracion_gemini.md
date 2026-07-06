# 04 - Integración con Gemini

## Objetivo

Usar Gemini API para analizar tickets de soporte técnico y devolver una respuesta estructurada que la aplicación pueda guardar y mostrar.

## Regla principal

La API de Gemini se consume exclusivamente desde el backend.

Nunca exponer `GEMINI_API_KEY` en el frontend.

## Modelo recomendado

Usar un modelo rápido y económico para pruebas:

```env
GEMINI_MODEL="gemini-2.5-flash-lite"
```

Si ese modelo no está disponible, permitir cambiarlo desde variable de entorno.

## Proveedores soportados

El backend debe soportar:

- `gemini`: usa Gemini API.
- `demo`: usa análisis simulado.

Variable:

```env
AI_PROVIDER="gemini"
```

Si `AI_PROVIDER=gemini` pero falta `GEMINI_API_KEY`, pasar automáticamente a modo demo.

## Contrato JSON esperado

Gemini debe devolver únicamente JSON válido:

```json
{
  "category": "Red e Internet",
  "priority": "high",
  "impact": "high",
  "urgency": "medium",
  "confidence": "medium",
  "summary": "El usuario informa que no tiene conexión a internet en su equipo desde la mañana.",
  "possibleCause": "Puede tratarse de un problema de conectividad local, cableado, WiFi o configuración de red.",
  "responsibleArea": "Soporte Técnico",
  "suggestedSteps": [
    "Verificar si otros equipos del área tienen internet.",
    "Revisar conexión física o WiFi del equipo.",
    "Ejecutar diagnóstico de red.",
    "Reiniciar adaptador de red si corresponde."
  ],
  "suggestedReply": "Hola, vamos a revisar tu conexión. Primero verificaremos si el problema afecta solo a tu equipo o al área completa.",
  "missingInfo": [
    "No se indica si otros equipos tienen el mismo problema."
  ]
}
```

## Prompt base

```txt
Actúa como analista de mesa de ayuda IT.
Tu tarea es analizar un ticket de soporte técnico y devolver una respuesta útil para priorizarlo y asistir su resolución.

Debes responder únicamente con JSON válido. No agregues markdown, comentarios ni texto fuera del JSON.

Categorías permitidas:
- Red e Internet
- Hardware
- Software
- Accesos y usuarios
- Impresoras
- Correo electrónico
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
Título: {{title}}
Descripción: {{description}}
Solicitante: {{requesterName}}
Área: {{requesterArea}}
Canal: {{sourceChannel}}
Impacto inicial: {{impact}}
Urgencia inicial: {{urgency}}

Devuelve este JSON:
{
  "category": "una categoría permitida",
  "priority": "critical | high | medium | low",
  "impact": "high | medium | low",
  "urgency": "high | medium | low",
  "confidence": "high | medium | low",
  "summary": "resumen breve del problema",
  "possibleCause": "posible causa técnica",
  "responsibleArea": "área sugerida",
  "suggestedSteps": ["paso 1", "paso 2", "paso 3"],
  "suggestedReply": "respuesta clara para enviar al usuario",
  "missingInfo": ["dato faltante si corresponde"]
}
```

## Normalización obligatoria

El backend debe validar y normalizar la respuesta:

- Si la categoría no existe, usar `Otro`.
- Si prioridad no es válida, calcularla con impacto y urgencia.
- Si faltan pasos, crear pasos genéricos.
- Si falta respuesta sugerida, generar una respuesta básica.
- Si el JSON es inválido, devolver error controlado o usar fallback demo.

## Modo demo

El modo demo debe analizar palabras clave:

| Palabras clave | Categoría |
|---|---|
| internet, red, wifi, conexión, cable | Red e Internet |
| impresora, imprimir, toner | Impresoras |
| crm, sistema, error 500, neotel | CRM o sistema interno |
| usuario, contraseña, acceso, bloqueado | Accesos y usuarios |
| correo, mail, outlook | Correo electrónico |
| lenta, disco, memoria, cpu, pc | Hardware |
| virus, phishing, seguridad | Seguridad |

Prioridad demo:

- Crítica si contiene: "no funciona toda el área", "caído", "urgente", "producción".
- Alta si contiene: "no puedo trabajar", "bloqueado", "sin internet".
- Media para errores que afectan a una persona.
- Baja para solicitudes administrativas.

## Mensajes de error

Ejemplos:

- "No se pudo analizar el ticket con Gemini. Podés intentar nuevamente o usar modo demo."
- "La respuesta de IA no tuvo el formato esperado."
- "Falta configurar GEMINI_API_KEY en el backend."

## Documentación del uso de IA

En `docs/prompts-ia.md`, registrar:

- Prompt usado para analizar tickets.
- Prompt usado para generar componentes.
- Prompt usado para depurar errores.
- Ajustes humanos realizados.
- Limitaciones detectadas.
