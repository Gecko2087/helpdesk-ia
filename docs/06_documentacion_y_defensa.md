# 06 - Documentación y defensa

## README final

El README del repositorio debe incluir:

- Nombre del proyecto.
- Descripción breve.
- Problema que resuelve.
- Usuarios destinatarios.
- Funcionalidades.
- Tecnologías utilizadas.
- Arquitectura general.
- Variables de entorno.
- Instalación local.
- Scripts.
- Uso de Gemini API.
- Modo demo.
- Capturas de pantalla.
- Enlace de despliegue.
- Mejoras futuras.

## Memoria de desarrollo

Crear `docs/memoria-desarrollo.md`.

Extensión sugerida: una a tres páginas.

### Estructura

#### 1. Problema

Explicar que las áreas IT reciben solicitudes por distintos canales y muchas veces sin información suficiente. Esto dificulta priorizar, responder y hacer seguimiento.

#### 2. Solución

Presentar HelpDesk IA como una herramienta para registrar tickets, analizarlos con IA y obtener una primera clasificación técnica.

#### 3. Decisiones funcionales

Mencionar:

- Se eligió un flujo simple para facilitar la demo.
- Se agregaron casos de ejemplo.
- Se priorizó el análisis de texto en lugar de archivos.
- Se incluyó modo demo para evitar dependencia total de Gemini.

#### 4. Decisiones técnicas

Mencionar:

- React por la interfaz dinámica.
- Express por el backend.
- Prisma y SQLite por simplicidad y persistencia.
- Zod por validaciones.
- Gemini API como integración externa.
- Recharts para métricas visuales.

#### 5. Uso de IA

Explicar dos usos:

- IA como copiloto de desarrollo.
- IA como funcionalidad del producto.

Ejemplos:

- Definir alcance.
- Generar estructura inicial.
- Crear prompt para clasificación de tickets.
- Corregir errores.
- Mejorar textos de interfaz.
- Documentar decisiones.

#### 6. Uso responsable

Indicar:

- La IA asiste, no reemplaza al técnico.
- La prioridad sugerida debe poder revisarse.
- La respuesta puede requerir validación humana.
- No se deben cargar datos sensibles reales en una demo pública.

#### 7. Límites y mejoras futuras

Ideas:

- Login y roles.
- Integración con WhatsApp o email.
- Adjuntos.
- SLAs configurables.
- Reportes por área.
- Exportación a Excel/PDF.
- Base de conocimiento.
- Sugerencias basadas en tickets históricos.

## Archivo de prompts

Crear `docs/prompts-ia.md` con tabla:

| Etapa | Prompt | Resultado | Ajuste humano |
|---|---|---|---|
| Ideación | Definir proyecto HelpDesk IA | Se obtuvo alcance MVP | Se eligió soporte IT por contexto real |
| Diseño | Crear UI premium para helpdesk | Se definió estética command desk | Se ajustó paleta y layout |
| Backend | Crear endpoints y modelo Prisma | Se generó estructura API | Se revisaron validaciones |
| Gemini | Crear prompt de clasificación | Se obtuvo JSON estructurado | Se normalizaron respuestas |
| Documentación | Crear memoria y defensa | Se generó borrador | Se adaptó a experiencia propia |

## Guion de defensa

Duración sugerida: 5 a 7 minutos.

### 1. Apertura

"Mi proyecto se llama HelpDesk IA. Es una aplicación web para registrar y analizar tickets de soporte técnico usando inteligencia artificial."

### 2. Problema

"En un área IT, muchas solicitudes llegan por canales distintos y con poca información. Eso hace difícil priorizar, responder y mantener seguimiento."

### 3. Solución

"La app centraliza los tickets y usa IA para sugerir categoría, prioridad, resumen, posible causa, pasos de resolución y una respuesta para el usuario."

### 4. Demo

Mostrar:

1. Dashboard.
2. Estado de IA.
3. Nuevo ticket.
4. Caso rápido.
5. Análisis con IA.
6. Resultado editable.
7. Guardado.
8. Historial.
9. Detalle.
10. Categorías.

### 5. Técnica

"La aplicación está hecha con React y Vite en el frontend, Node y Express en el backend, Prisma con SQLite para datos, Zod para validaciones y Gemini API para el análisis inteligente."

### 6. IA

"La IA se usa como integración del producto y también como asistencia durante el desarrollo. Aun así, el sistema mantiene un modo demo y permite revisar los resultados, porque la IA puede equivocarse."

### 7. Cierre

"El proyecto resuelve un problema concreto, tiene un flujo demostrable, guarda datos, integra una API externa y puede evolucionar hacia una mesa de ayuda real con usuarios, SLA e integraciones."

## Capturas recomendadas

Incluir en README:

- Dashboard.
- Nuevo ticket con caso de ejemplo.
- Resultado de análisis IA.
- Listado de tickets.
- Detalle de ticket.
- Configuración IA.

## Entrega final

Entregar:

- Repositorio.
- Link desplegado.
- README.
- Memoria.
- Prompts IA.
- Guion de defensa.
- Capturas.
