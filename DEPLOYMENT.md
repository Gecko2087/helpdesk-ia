# Demo full stack

Esta edición usa React, Express y Prisma con PostgreSQL. Cada visitante inicia un sandbox de una hora mediante `POST /api/demo/session`. La creación carga tres tickets y tres categorías ficticias en una sola transacción. Los tickets, categorías y dashboard se consultan por el sandbox de la cookie HttpOnly; las escrituras requieren el origen exacto configurado.

## Preparación

- Node 22.12 o superior.
- Crear una base PostgreSQL **nueva y exclusiva para datos ficticios de esta demo**. No usar bases con información personal ni migrar una instalación existente sin un plan de conservación.
- Configurar `DATABASE_URL`, `NODE_ENV=production`, `CLIENT_URL=https://<dominio-exacto>`.
- Ejecutar `npm ci --prefix server --ignore-scripts`, `npm run db:generate --prefix server` y `npm run db:deploy --prefix server` contra esa base nueva. La migración agrega el contador global de análisis. Los ejemplos se crean al abrir cada sandbox; no ejecutar el seed antiguo.
- En Vercel seleccionar la raíz del repositorio. `app.js` es la entrada Express reconocida por Vercel y exporta la aplicación; `vercel.json` ejecuta `npm run build:vercel`, que coloca el frontend en `public/` y genera Prisma Client. Las migraciones se aplican por separado antes del tráfico. PostgreSQL debe admitir conexiones del hosting; usar el pooler del proveedor y limitar conexiones según su plan.
- Sin `GEMINI_API_KEY`, el análisis usa reglas deterministas y la interfaz lo identifica como modo demo. Para probar Gemini, configurar `AI_PROVIDER=gemini`, `GEMINI_API_KEY` **solo en el servidor** y `GEMINI_MODEL=gemini-2.5-flash` o un modelo habilitado en esa cuenta. Nunca exponer la clave como variable `VITE_`.
- Configurar `GEMINI_DAILY_ANALYSIS_LIMIT` según la cuota de esa clave en [Google AI Studio](https://aistudio.google.com/). El valor local predeterminado es 20 análisis por día UTC compartidos por todos los sandboxes. Es un límite preventivo, no una promesa de cuota gratuita: [Google indica que los límites dependen del proyecto y del nivel de uso](https://ai.google.dev/gemini-api/docs/rate-limits).
- Antes de habilitar Gemini públicamente, mostrar y respetar el aviso de usar solo datos ficticios: título, descripción, área y otros detalles del caso llegan a Google. La [tabla oficial de precios](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash) indica que el contenido del nivel gratuito puede usarse para mejorar productos de Google. El nombre del solicitante queda fuera del prompt, pero el visitante puede escribir datos personales en otros campos.

## Validación

`npm test --prefix server` crea una base SQLite temporal exclusiva, ejecuta las pruebas HTTP y restaura el cliente PostgreSQL para el despliegue. Nunca borra ni usa una base remota.

Después del despliegue comprobar dos sesiones independientes: cada una debe comenzar con tres tickets ficticios propios; crear un cuarto, recargar, actualizar su estado y verificar que la segunda sesión recibe 404 sobre ese ID. Comprobar cookies Secure/HttpOnly, origen incorrecto 403, límites 429 y limpieza de datos vencidos. El deploy remoto y PostgreSQL aún deben verificarse; las pruebas locales no reemplazan ese control.

La cuota es de 100 sandboxes nuevos por día, 250 solicitudes, 80 escrituras y 10 análisis por sandbox, además del tope global diario configurable para Gemini. La reserva de ambos cupos se hace en una transacción de base de datos. Al crear nuevos sandboxes se eliminan los vencidos junto con sus datos. No son cuentas de uso productivo.
