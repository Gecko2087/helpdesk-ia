import { Router } from "express";

import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "helpdesk-ia-api",
    aiProvider: env.aiProvider,
    model: env.geminiModel,
    timestamp: new Date().toISOString()
  });
});
