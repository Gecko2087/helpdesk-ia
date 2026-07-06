import cors from "cors";
import express from "express";
import helmet from "helmet";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import { env } from "./config/env.js";
import { aiRouter } from "./routes/ai.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { ticketRouter } from "./routes/ticket.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

// En producción el frontend compilado vive en client/dist relativo a la raíz del repo.
// Railway corre desde la raíz del monorepo, así que subimos dos niveles desde server/src/.
const clientDistPath = join(__dirname, "../../client/dist");
const isProduction = env.nodeEnv === "production";

app.use(helmet({
  // Relajar CSP para que Vite/React funcione correctamente
  contentSecurityPolicy: false
}));

app.use(
  cors({
    origin: isProduction
      ? env.clientUrl
      : [env.clientUrl, "http://localhost:5173", "http://localhost:5174", "http://localhost:3001"]
  })
);
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/ai", aiRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/categories", categoryRouter);

// Servir frontend compilado en producción
if (isProduction && existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Catch-all: devolver index.html para que React Router maneje las rutas del cliente
  app.get(/.*/, (_req, res) => {
    res.sendFile(join(clientDistPath, "index.html"));
  });
} else {
  // En desarrollo, el 404 para rutas de API desconocidas
  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
}

app.use(errorHandler);
