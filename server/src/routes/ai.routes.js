import { Router } from "express";

import { analyzeTicketController, getAiStatusController } from "../controllers/ai.controller.js";
import { validate } from "../middleware/validate.js";
import { analyzeTicketSchema } from "../validators/ticket.validator.js";

export const aiRouter = Router();

aiRouter.get("/status", getAiStatusController);
aiRouter.post("/analyze", validate(analyzeTicketSchema), analyzeTicketController);
