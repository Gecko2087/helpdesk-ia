# 00 - Contexto y alcance

## Nombre del proyecto

HelpDesk IA

## Descripción breve

Aplicación web para gestionar tickets de soporte técnico con asistencia de inteligencia artificial. El sistema permite cargar solicitudes internas, analizarlas con Gemini, asignar categoría y prioridad, sugerir pasos de resolución y generar una respuesta clara para el usuario solicitante.

## Problema

En un área IT, muchas solicitudes llegan sin estructura: mensajes incompletos, problemas mal descriptos, urgencias mezcladas con pedidos simples y falta de seguimiento. Esto dificulta priorizar, responder rápido y mantener un registro confiable.

## Necesidad concreta

Se necesita una herramienta simple que permita registrar solicitudes, ordenarlas y obtener una primera asistencia automática para acelerar el diagnóstico y la respuesta.

## Usuarios destinatarios

- Responsable IT.
- Técnico de soporte.
- Supervisor o encargado de área.
- Empleado que solicita ayuda técnica.

## Objetivo general

Desarrollar una aplicación web funcional que ayude a organizar tickets de soporte técnico y use IA para clasificarlos, priorizarlos y sugerir respuestas.

## Objetivos específicos

- Registrar tickets con título, descripción, solicitante, área y canal de origen.
- Analizar tickets con Gemini API.
- Clasificar automáticamente por categoría.
- Asignar prioridad según impacto y urgencia.
- Sugerir pasos de solución.
- Generar una respuesta para enviar al usuario.
- Guardar el historial de tickets.
- Visualizar métricas generales en un dashboard.
- Documentar cómo se usó IA durante el desarrollo.

## Alcance mínimo viable

La primera versión debe incluir:

- Dashboard con métricas.
- Formulario de nuevo ticket.
- Casos de ejemplo para demo rápida.
- Análisis con Gemini o fallback demo.
- Listado de tickets.
- Vista de detalle.
- Cambio de estado del ticket.
- Gestión básica de categorías.
- README, memoria y guion de defensa.
- Despliegue o instrucciones claras de ejecución.

## Fuera de alcance

- Chat en tiempo real.
- Sistema completo de usuarios y permisos.
- Integración real con WhatsApp, email o Active Directory.
- Adjuntos de archivos.
- SLA avanzado con calendarios laborales.
- Notificaciones push.

## Criterios de éxito

La app se considera lista si permite demostrar este flujo:

1. El usuario abre el enlace desplegado.
2. Ve un dashboard profesional.
3. Crea un ticket desde cero o usa un caso de ejemplo.
4. Ejecuta análisis con IA.
5. Recibe categoría, prioridad, resumen, pasos sugeridos y respuesta.
6. Guarda el ticket.
7. Lo encuentra en el historial.
8. Explica cómo funciona la lógica de negocio y la integración con Gemini.

## Casos de ejemplo para demo

- "No tengo internet en mi computadora desde esta mañana."
- "No puedo ingresar al CRM, me dice usuario bloqueado."
- "La impresora de administración no responde."
- "Necesito crear un usuario nuevo para una persona que ingresa mañana."
- "La PC está muy lenta y se congela al abrir Excel."
- "No me llegan los correos desde ayer."
- "El sistema de tickets muestra error 500 al guardar un caso."
