# HelpDesk IA

Sistema de gestión de tickets de soporte técnico con asistencia de inteligencia artificial.

Clasificá, priorizá y resolvé incidentes de IT con ayuda de Gemini API — y modo demo sin API key para demostraciones offline.

🌐 **App en producción:** https://helpdesk-ia-production.up.railway.app

---

## 🚀 Demo rápida

1. Abrí la app: https://helpdesk-ia-production.up.railway.app
2. Hacé clic en **Nuevo ticket** → elegí un caso de ejemplo (CRM, Internet, Impresora).
3. Presioná **Analizar con IA** — en segundos obtenés categoría, prioridad, pasos sugeridos y respuesta automática.
4. Guardá el ticket y verificalo en el historial con estado, prioridad y categoría visibles.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | Tailwind CSS 3 |
| Gráficos | Recharts |
| Iconos | lucide-react |
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL (prod) / SQLite (dev) vía Prisma |
| Validaciones | Zod |
| IA | Google Gemini API (con fallback a modo demo) |
| Despliegue | Railway |

---

## 📦 Desarrollo local

### Requisitos

- Node.js 20+
- npm 10+

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Gecko2087/helpdesk-ia.git
cd helpdesk-ia

# Instalar dependencias del monorepo
npm install
npm install --prefix server
npm install --prefix client
```

### Variables de entorno

Copiá el archivo de ejemplo y completalo:

```bash
cp .env.example server/.env
```

Editá `server/.env`:

```env
# SQLite para desarrollo local
DATABASE_URL="file:./dev.db"

PORT=3001
NODE_ENV="development"

# IA: dejá vacío para usar modo demo
AI_PROVIDER="gemini"
GEMINI_API_KEY="tu_api_key_de_gemini"
GEMINI_MODEL="gemini-3.5-flash"

CLIENT_URL="http://localhost:5173"
```

> **Modo demo**: si `GEMINI_API_KEY` está vacía o `AI_PROVIDER` no es `"gemini"`, la app usa respuestas simuladas. Ideal para demos sin internet.

### Base de datos local

```bash
# Crear tablas SQLite y poblar con datos de ejemplo
npm run db:migrate
npm run db:seed
```

### Iniciar en modo desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api/health

> **Nota:** En desarrollo, si necesitás que el frontend llame directamente al backend local, creá un archivo `client/.env.local` con:
> ```
> VITE_API_URL=http://localhost:3001/api
> ```

---

## ☁️ Despliegue en Railway

La app ya está desplegada en: https://helpdesk-ia-production.up.railway.app

### Variables de entorno en Railway

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia automática al plugin) |
| `NODE_ENV` | `production` |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | Tu API key de Google Gemini |
| `GEMINI_MODEL` | `gemini-3.5-flash` |
| `CLIENT_URL` | `https://helpdesk-ia-production.up.railway.app` |

> ⚠️ **NUNCA** expongas `GEMINI_API_KEY` en el código fuente, el frontend, ni en commits públicos. Solo existe en el backend como variable de entorno.

### Cómo funciona el despliegue

Railway ejecuta automáticamente al arrancar:

```bash
# 1. Aplica migraciones en PostgreSQL (idempotente, seguro de correr siempre)
npm run db:deploy --prefix server

# 2. Carga categorías y tickets demo (usa upsert, no duplica datos)
npm run db:seed --prefix server

# 3. Inicia el servidor Express
npm start
```

El servidor Express sirve tanto la API (`/api/*`) como el frontend compilado desde el mismo dominio — sin necesidad de un servidor separado para el frontend.

---

## 🗂️ Estructura del proyecto

```
helpdesk-ia/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx         # Toda la UI (SPA de una sola página)
│   │   └── styles/
│   └── dist/               # Build de producción (generado, no committear)
├── server/                 # Backend Node.js + Express
│   ├── prisma/
│   │   ├── schema.prisma   # Modelo de datos
│   │   ├── migrations/     # Migraciones de Prisma (PostgreSQL)
│   │   ├── seed.js         # Datos iniciales (categorías + tickets demo)
│   │   └── migrate.js      # Script de migración SQLite para desarrollo
│   └── src/
│       ├── app.js          # Express: rutas + archivos estáticos en producción
│       ├── server.js       # Punto de entrada
│       ├── config/         # Variables de entorno + Prisma Client
│       ├── controllers/    # Controladores HTTP
│       ├── routes/         # Definición de rutas
│       ├── services/       # Lógica de negocio + integración Gemini
│       ├── validators/     # Validaciones Zod
│       └── utils/          # Utilidades (cálculo de prioridad, códigos)
├── docs/                   # Documentación del TP
├── .env.example            # Plantilla de variables de entorno
├── .gitignore
├── railway.json            # Configuración de Railway
└── package.json            # Scripts del monorepo
```

---

## 🤖 Integración con Gemini

- El análisis ocurre **siempre en el backend** — la API key nunca llega al cliente.
- Si la API falla o no hay key configurada, el sistema responde con análisis simulado (**modo demo**).
- El modelo se configura con `GEMINI_MODEL` (en uso: `gemini-3.5-flash`).

---

## 📋 Scripts disponibles

```bash
# Desarrollo
npm run dev              # Levanta servidor + cliente en paralelo

# Build
npm run build            # Compila el frontend + genera Prisma Client

# Producción
npm start                # Levanta el servidor (sirve API + frontend compilado)

# Base de datos
npm run db:migrate       # Crea tablas SQLite (solo desarrollo local)
npm run db:seed          # Pobla la BD con categorías y tickets demo
npm run db:deploy        # Aplica migraciones en PostgreSQL (producción)
```

---

## 📄 Documentación adicional

Ver carpeta [`docs/`](./docs/) para:
- Especificación funcional y técnica
- Integración con Gemini
- Checklist de defensa
