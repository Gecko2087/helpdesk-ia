# HelpDesk IA - Instrucciones para Codex

## Proyecto

**HelpDesk IA** es una aplicación web inteligente para registrar, clasificar, priorizar y asistir la resolución de tickets de soporte técnico usando Gemini API.

El proyecto está pensado para una defensa simple y sólida: el profesor no necesita subir archivos ni preparar datos. Puede elegir un caso de ejemplo, presionar **Analizar con IA** y ver cómo la aplicación categoriza el problema, asigna prioridad, sugiere pasos de solución y genera una respuesta para el usuario.

## Objetivo del TP

Crear una aplicación web funcional, publicada y defendible que demuestre:

- Interfaz web navegable y responsive.
- Lógica de negocio real.
- Manejo de datos persistentes.
- Integración con una API de inteligencia artificial.
- Automatización útil para un proceso cotidiano.
- Documentación del proceso de desarrollo con IA.
- Despliegue accesible mediante un enlace público.

## Idea principal

En muchas áreas IT, los pedidos llegan desordenados por WhatsApp, email, llamadas o comentarios informales. HelpDesk IA centraliza esos pedidos en tickets y usa IA para ayudar a:

- Detectar la categoría del incidente.
- Estimar prioridad e impacto.
- Resumir el problema.
- Sugerir pasos técnicos.
- Proponer una respuesta clara para el usuario.
- Registrar historial y métricas.

## Archivos incluidos

- `00_contexto_y_alcance.md`: problema, usuarios, alcance y criterios de éxito.
- `01_especificacion_funcional.md`: pantallas, flujos, reglas y datos.
- `02_especificacion_tecnica.md`: stack, arquitectura, modelo de datos y endpoints.
- `03_diseno_premium.md`: dirección visual para una app premium, única y no genérica.
- `04_integracion_gemini.md`: prompt de Gemini, contrato JSON y fallback demo.
- `05_instrucciones_para_codex.md`: prompts listos para construir el proyecto por etapas.
- `06_documentacion_y_defensa.md`: README final, memoria, prompts y guion oral.
- `07_checklist_final.md`: checklist de entrega, despliegue y defensa.
- `08_ajustes_segun_clases.md`: refuerzos tomados de las clases: RF/RNF, criterios de aceptación, pruebas, despliegue y base en producción.

## Stack recomendado

- Frontend: React + Vite.
- Estilos: TailwindCSS.
- Iconos: lucide-react.
- Gráficos: Recharts.
- Backend: Node.js + Express.
- Base de datos: SQLite con Prisma para desarrollo. Para despliegue, preferir PostgreSQL si el hosting no conserva SQLite.
- Validaciones: Zod.
- IA: Gemini API desde backend.
- Despliegue: Render, Railway o similar.

## Decisión importante

La aplicación debe tener **modo demo sin Gemini**. Si falta la API key o falla el cupo gratuito, el sistema debe seguir funcionando con respuestas simuladas. Esto evita que la defensa dependa completamente de un servicio externo.

## Flujo principal para defensa

1. Abrir dashboard.
2. Crear un ticket o seleccionar un caso de ejemplo.
3. Presionar **Analizar con IA**.
4. Ver categoría, prioridad, resumen, pasos sugeridos y respuesta automática.
5. Guardar el ticket.
6. Consultar el ticket desde el historial.
7. Mostrar métricas y documentación del uso de IA.
