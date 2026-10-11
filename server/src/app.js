import cors from "cors";
import express from "express";
import helmet from "helmet";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { env } from "./config/env.js";
import { aiRouter } from "./routes/ai.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { ticketRouter } from "./routes/ticket.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sandboxMiddleware } from './middleware/sandbox.js';

export const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

// En producción el frontend compilado vive en client/dist relativo a la raíz del repo.
// Railway corre desde la raíz del monorepo, así que subimos dos niveles desde server/src/.
const clientDistPath = join(__dirname, "../../client/dist");
const clientAssetsPath = join(clientDistPath, "assets");
const clientIndexPath = join(clientDistPath, "index.html");
const isProduction = env.nodeEnv === "production";

app.use(helmet({
  // Relajar CSP para que Vite/React funcione correctamente
  contentSecurityPolicy: false
}));

app.use(
  cors({
    origin: isProduction
      ? env.clientUrl
      : [env.clientUrl, "http://localhost:5173", "http://localhost:5174", "http://localhost:3001"],
    credentials: true
  })
);
app.use(express.json({ limit: '24kb' }));

app.use("/api/health", healthRouter);
app.use('/api', sandboxMiddleware);
app.use('/api', (req, res, next) => {
  for (const value of Object.values(req.query)) {
    if (typeof value !== 'string' || value.length > 160) return res.status(400).json({ error: 'Filtro inválido' });
  }
  next();
});
app.use("/api/ai", aiRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/categories", categoryRouter);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// Servir frontend compilado en producción
if ((isProduction || process.env.SERVE_CLIENT === 'true') && existsSync(clientDistPath)) {
  // Vite fingerprints assets, so they can be cached across deployments. Missing
  // fingerprints must fail rather than receiving the SPA's HTML as JavaScript.
  app.use('/assets', express.static(clientAssetsPath, { immutable: true, maxAge: '1y' }));
  app.use('/assets', (_req, res) => res.status(404).send('Asset no encontrado'));

  const sendIndex = async (_req, res) => {
    // Git archives preserve file timestamps. A validator derived from index.html
    // could otherwise return 304 for a different deployment with the same mtime.
    const html = await readFile(clientIndexPath);
    res.type('html').set('Cache-Control', 'no-store').end(html);
  };
  app.get('/index.html', sendIndex);
  app.use(express.static(clientDistPath, { index: false }));

  // Catch-all for client routes. HTML is never reusable across deployments.
  app.get(/.*/, sendIndex);
} else {
  // En desarrollo, el 404 para rutas de API desconocidas
  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
}

app.use(errorHandler);
