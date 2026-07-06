# 02 - Especificación técnica

## Stack

Usar:

- React + Vite.
- TailwindCSS.
- lucide-react.
- Recharts.
- Node.js + Express.
- Prisma.
- SQLite para desarrollo local.
- PostgreSQL para despliegue si la plataforma no garantiza persistencia de SQLite.
- Zod.
- Gemini API desde backend.

## Estructura sugerida

```txt
helpdesk-ia/
  README.md
  package.json
  .env.example
  docs/
    memoria-desarrollo.md
    prompts-ia.md
    guion-defensa.md
  server/
    package.json
    prisma/
      schema.prisma
      seed.js
    src/
      app.js
      server.js
      config/
      routes/
      controllers/
      services/
      repositories/
      validators/
      utils/
  client/
    package.json
    index.html
    src/
      main.jsx
      App.jsx
      api/
      components/
      layouts/
      pages/
      data/
      styles/
```

## Modelo de datos

### Ticket

- `id`
- `code`
- `title`
- `description`
- `requesterName`
- `requesterArea`
- `sourceChannel`
- `status`
- `priority`
- `impact`
- `urgency`
- `categoryId`
- `aiStatus`
- `aiProvider`
- `aiConfidence`
- `summary`
- `possibleCause`
- `responsibleArea`
- `suggestedReply`
- `createdAt`
- `updatedAt`

### Category

- `id`
- `name`
- `description`
- `color`
- `responsibleArea`
- `active`
- `createdAt`
- `updatedAt`

### SuggestedStep

- `id`
- `ticketId`
- `order`
- `text`

### TicketNote

- `id`
- `ticketId`
- `content`
- `createdAt`

### TicketEvent

- `id`
- `ticketId`
- `type`
- `description`
- `createdAt`

## Endpoints mínimos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del backend. |
| `GET` | `/api/dashboard` | Métricas generales. |
| `GET` | `/api/tickets` | Lista tickets con filtros. |
| `GET` | `/api/tickets/:id` | Detalle de ticket. |
| `POST` | `/api/tickets/analyze` | Analiza un ticket sin guardarlo todavía. |
| `POST` | `/api/tickets` | Guarda un ticket. |
| `PATCH` | `/api/tickets/:id/status` | Cambia estado. |
| `POST` | `/api/tickets/:id/notes` | Agrega nota interna. |
| `GET` | `/api/categories` | Lista categorías. |
| `POST` | `/api/categories` | Crea categoría. |
| `PUT` | `/api/categories/:id` | Actualiza categoría. |
| `GET` | `/api/ai/status` | Devuelve proveedor IA configurado. |

## Validaciones con Zod

### Crear ticket

- `title`: string, mínimo 5.
- `description`: string, mínimo 20.
- `requesterName`: string, mínimo 2.
- `requesterArea`: string, mínimo 2.
- `sourceChannel`: enum.
- `impact`: enum.
- `urgency`: enum.
- `analysis`: opcional.

### Analizar ticket

- `title`: string, mínimo 5.
- `description`: string, mínimo 20.
- `requesterArea`: string.
- `sourceChannel`: enum.
- `impact`: enum opcional.
- `urgency`: enum opcional.

## Variables de entorno

```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV="development"
AI_PROVIDER="gemini"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash-lite"
CLIENT_URL="http://localhost:5173"
```

Para producción con PostgreSQL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

La aplicación debe documentar que SQLite es suficiente para desarrollo y demo local, pero para un despliegue real conviene usar PostgreSQL en Supabase, Railway, Render u otro proveedor.

## Scripts sugeridos en raíz

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "build": "npm run build --prefix client",
    "start": "npm run start --prefix server",
    "db:migrate": "npm run db:migrate --prefix server",
    "db:seed": "npm run db:seed --prefix server"
  }
}
```

## Comportamiento del backend

- Todas las API keys deben estar solo en backend.
- El frontend nunca debe llamar directo a Gemini.
- Si falta `GEMINI_API_KEY`, usar modo demo.
- Si Gemini falla, devolver error controlado y ofrecer usar modo demo.
- Normalizar valores devueltos por IA.
- Guardar eventos relevantes del ticket.

## Cálculo de prioridad

Crear helper:

```txt
calculatePriority(impact, urgency)
```

Debe devolver:

- `critical`
- `high`
- `medium`
- `low`

## Seed inicial

El seed debe crear:

- Categorías iniciales.
- Tickets demo opcionales.
- Eventos básicos para tickets demo.

## Testing mínimo recomendado

Si el tiempo alcanza, agregar pruebas simples para:

- `calculatePriority`.
- Normalización de respuesta IA.
- Validaciones Zod.

Si no se agregan tests automatizados, documentar pruebas manuales en README.

## Requisitos no funcionales

- Seguridad: la API key de Gemini solo vive en backend.
- Privacidad: no cargar datos sensibles reales en la demo pública.
- Disponibilidad: el modo demo permite presentar aunque Gemini falle.
- Usabilidad: el flujo principal debe completarse sin instrucciones externas.
- Accesibilidad básica: labels, foco visible y contraste correcto.
- Mantenibilidad: componentes reutilizables y estructura clara por capas.
- Rendimiento: dashboard y listados deben cargar con estados de espera claros.
