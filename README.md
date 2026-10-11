# HelpDesk IA

Demo de mesa de ayuda con React, Express, Prisma y análisis asistido. Cada visitante recibe un espacio aislado de una hora con tres tickets ficticios y tres categorías. Puede probar un análisis, guardar tickets y ver los cambios en el tablero.

**Estado:** el código y las pruebas se trabajan localmente. La antigua URL de Railway (`helpdesk-ia-production.up.railway.app`) responde 404 y no es un despliegue disponible. El [laboratorio público del portfolio](https://gecko2087.github.io/portfolio/lab.html?project=helpdesk) es una demostración independiente; no usa esta API ni esta base de datos. El despliegue de esta aplicación en Vercel y PostgreSQL está pendiente de verificación.

## Qué muestra

- Tickets, categorías, estados, prioridades y métricas de una mesa de ayuda.
- Análisis de ejemplo por reglas cuando no hay una clave Gemini configurada.
- Integración opcional con Gemini desde el servidor. La interfaz indica el proveedor de cada resultado y avisa antes de enviar un caso a Google.
- Sesiones aisladas mediante cookie HttpOnly. Los datos ficticios y los límites de uso se guardan en la base de datos.

## Desarrollo local

Requiere Node.js 22.12 o superior, npm y una base PostgreSQL **nueva para datos de prueba**. No uses una base con información real. Instalá las dependencias:

```bash
npm ci
npm ci --prefix server
npm ci --prefix client
```

Copiá `server/.env.example` a `server/.env` y configurá `DATABASE_URL` con la URL de esa base PostgreSQL, `CLIENT_URL=http://localhost:5173` y `NODE_ENV=development`. La plantilla deja la clave Gemini vacía para usar reglas locales. Para activar Gemini, configurá `AI_PROVIDER=gemini`, `GEMINI_API_KEY` solo en el servidor y un `GEMINI_MODEL` habilitado para tu cuenta. `gemini-2.5-flash` es un ejemplo documentado por Google; el modelo disponible y la cuota concreta se comprueban en Google AI Studio.

Prepará la base y arrancá ambos procesos:

```bash
npm run db:generate --prefix server
npm run db:deploy --prefix server
npm run dev
```

En desarrollo, configurá `VITE_API_URL=http://localhost:3001/api` en `client/.env.local` para que el frontend llame a Express. `CLIENT_URL` debe coincidir exactamente con el origen de Vite (`http://localhost:5173` en este ejemplo). Las peticiones incluyen la cookie de sesión; el servidor habilita credenciales CORS solo para los orígenes permitidos. El cliente abre en `http://localhost:5173` y la salud de la API se consulta en `http://localhost:3001/api/health`. Los tres ejemplos se crean al abrir cada espacio; el script histórico `db:seed` no forma parte de este flujo.

## Pruebas

```bash
npm test --prefix server
```

El script de pruebas crea una base SQLite temporal, ejecuta las pruebas HTTP y restaura el cliente Prisma de PostgreSQL. No utiliza una base remota. También podés compilar el cliente con `npm run build --prefix client`.

## Despliegue

El procedimiento previsto usa Vercel para la aplicación y una base PostgreSQL aparte. Primero se aplican las migraciones con `npm run db:deploy --prefix server` sobre una base nueva; luego se configura `CLIENT_URL` con el origen exacto de la aplicación. El archivo [`DEPLOYMENT.md`](./DEPLOYMENT.md) detalla las variables, cuotas y comprobaciones pendientes. No hay una URL de producción confirmada para esta aplicación.

Gemini está sujeto a los [límites reales de la cuenta y del modelo](https://ai.google.dev/gemini-api/docs/rate-limits). La aplicación limita por defecto a 20 análisis Gemini diarios entre todos los visitantes; `GEMINI_DAILY_ANALYSIS_LIMIT` permite fijar un valor acorde a AI Studio. Además, cada sesión admite 10 análisis y el servicio crea como máximo 100 sesiones nuevas por día. Google indica en su [tabla de precios](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash) que el contenido del nivel gratuito puede usarse para mejorar sus productos. Usá exclusivamente datos ficticios.

## Estructura

- `client/`: interfaz React, tablero y formulario.
- `server/src/`: API Express, validación, análisis y aislamiento de sesiones.
- `server/prisma/`: esquema y migraciones PostgreSQL.
- `docs/`: documentación funcional y técnica del proyecto.
