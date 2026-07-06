# 05 - Instrucciones para Codex

Usar estos prompts en orden. Pegar cada bloque en Codex dentro del repositorio del proyecto.

## Prompt 1 - Crear estructura inicial

```txt
Quiero construir mi trabajo final para la materia Desarrollo de Aplicaciones Web con IA.

Proyecto: HelpDesk IA.

Lee todos los archivos de la carpeta docs antes de implementar.
Prestá atención especial a docs/08_ajustes_segun_clases.md porque contiene criterios vistos en clase.

Necesito una aplicación full stack con:
- React + Vite.
- TailwindCSS.
- lucide-react.
- Recharts.
- Node.js + Express.
- Prisma + SQLite.
- Zod.
- Gemini API desde backend.
- Modo demo si no hay GEMINI_API_KEY.

Primera etapa:
- Crear estructura de monorepo.
- Configurar package.json raíz.
- Configurar backend con /api/health.
- Configurar frontend con AppShell básico.
- Crear variables .env.example.
- Dejar scripts de desarrollo funcionando.

No implementes todas las funcionalidades todavía. Priorizá una base ordenada.
```

## Prompt 2 - Base de datos y backend

```txt
Implementa el backend de HelpDesk IA según docs/02_especificacion_tecnica.md.

Necesito:
- Schema Prisma con Ticket, Category, SuggestedStep, TicketNote y TicketEvent.
- Seed con categorías iniciales y algunos tickets demo.
- Validaciones con Zod.
- Manejo de errores centralizado.
- Endpoints:
  - GET /api/health
  - GET /api/dashboard
  - GET /api/tickets
  - GET /api/tickets/:id
  - POST /api/tickets/analyze
  - POST /api/tickets
  - PATCH /api/tickets/:id/status
  - POST /api/tickets/:id/notes
  - GET /api/categories
  - POST /api/categories
  - PUT /api/categories/:id
  - GET /api/ai/status

También implementá helper calculatePriority(impact, urgency).
Al final ejecutá migración, seed y verificá que el backend arranque.
```

## Prompt 3 - Integración con Gemini y modo demo

```txt
Implementa el servicio de análisis IA según docs/04_integracion_gemini.md.

Requisitos:
- El frontend nunca debe llamar directo a Gemini.
- El backend debe usar AI_PROVIDER y GEMINI_API_KEY.
- Si falta GEMINI_API_KEY, usar modo demo automáticamente.
- Si Gemini devuelve JSON inválido, manejar el error sin romper la app.
- Normalizar category, priority, impact, urgency y confidence.
- POST /api/tickets/analyze debe devolver un análisis estructurado sin guardar el ticket.
- POST /api/tickets debe guardar ticket + análisis + pasos sugeridos + evento inicial.

Agregá logs mínimos útiles en desarrollo, sin imprimir API keys.
```

## Prompt 4 - Diseño premium base

```txt
Implementa el sistema visual según docs/03_diseno_premium.md.

La app debe verse como una herramienta IT premium, no como un dashboard genérico.

Requisitos:
- Primera pantalla: dashboard funcional, no landing page.
- Sidebar grafito.
- Fondo claro cálido.
- Acentos verde técnico y cian.
- Radio máximo 8px.
- Sin tarjetas anidadas.
- Estados loading, error y empty.
- Componentes reutilizables:
  - AppShell
  - Sidebar
  - Topbar
  - MetricTile
  - PriorityBadge
  - StatusBadge
  - CategoryPill
  - AiStatusIndicator
  - CommandButton
  - LoadingState
  - ErrorState
  - EmptyState

Usar lucide-react para iconos.
Mantener una UI densa, clara y responsive.
```

## Prompt 5 - Frontend funcional

```txt
Implementa las pantallas principales de HelpDesk IA:
- Dashboard.
- Nuevo ticket.
- Tickets.
- Detalle de ticket.
- Categorías.
- Configuración IA.

Flujo principal obligatorio:
Nuevo ticket -> cargar caso de ejemplo -> analizar con IA -> revisar resultado -> guardar ticket -> verlo en historial -> abrir detalle.

Requisitos:
- Consumir endpoints reales del backend.
- Mostrar estado IA en header.
- Agregar casos rápidos: Internet, CRM, Impresora, Usuario nuevo, PC lenta, Email.
- Permitir editar resultado del análisis antes de guardar.
- Tabla de tickets con filtros.
- Dashboard con métricas y gráficos Recharts.
- Responsive básico.
```

## Prompt 6 - Pulido de experiencia

```txt
Revisa la app como si fueras evaluador del trabajo final.

Mejorá:
- Consistencia visual.
- Mensajes de error.
- Textos de interfaz.
- Validaciones.
- Estados vacíos.
- Accesibilidad básica con labels y foco visible.
- Responsive mobile.
- Flujo de demo para que sea rápido y claro.

No agregues funcionalidades grandes. La prioridad es que parezca terminada, premium y defendible.
Ejecutá build/lint si existen y corregí errores.
```

## Prompt 7 - Documentación final

```txt
Genera la documentación final del TP.

Crear o completar:
- README.md con descripción, funcionalidades, tecnologías, instalación, variables de entorno, uso, despliegue y capturas sugeridas.
- docs/memoria-desarrollo.md de 1 a 3 páginas.
- docs/prompts-ia.md con prompts usados y decisiones humanas.
- docs/guion-defensa.md para presentación oral de 5 a 7 minutos.

La documentación debe sonar como un trabajo propio de estudiante/desarrollador, no como texto genérico.
Incluir una sección de uso responsable de IA y limitaciones.
```

## Prompt 8 - Preparar despliegue

```txt
Prepará el proyecto para despliegue.

Objetivo:
- Poder desplegar en Render o Railway.
- Backend sirviendo la app React compilada, o instrucciones claras para frontend y backend separados.
- .env.example completo.
- README con pasos de despliegue.
- Validar que npm run build funcione.
- Validar que el servidor pueda iniciar en modo producción.
- Documentar si se usa SQLite solo para demo/local y cómo migrar a PostgreSQL para producción.

Importante:
- El modo demo debe funcionar aunque no exista GEMINI_API_KEY.
- No exponer claves.
- Documentar cómo configurar Gemini API.
```

## Prompt 9 - Revisión contra el enunciado

```txt
Compará el proyecto final contra el enunciado del trabajo final.

Revisá si cumple:
- Definición del problema y usuarios.
- Interfaz web funcional.
- Lógica de negocio.
- Manejo de datos.
- Integración o automatización.
- Uso documentado de IA.
- Despliegue.
- README, memoria y defensa.

Generá una lista de pendientes y corregí todo lo que sea razonable corregir ahora.
```

## Prompt 10 - Ajustes según clases

```txt
Releé docs/08_ajustes_segun_clases.md y verificá que el proyecto lo cumpla.

Revisá especialmente:
- Requisitos funcionales codificados como RF.
- Requisitos no funcionales codificados como RNF.
- Criterios de aceptación verificables.
- Pruebas manuales documentadas.
- Build local antes de despliegue.
- README con comandos claros.
- Base de datos apta para producción o explicación de migración a PostgreSQL.
- Evidencia del uso de IA como copiloto, no como reemplazo del criterio propio.

Corregí lo que falte y dejá una lista final de verificación.
```
