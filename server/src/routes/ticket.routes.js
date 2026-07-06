import { Router } from "express";

import { analyzeTicketController } from "../controllers/ai.controller.js";
import {
  addTicketNoteController,
  createTicketController,
  getTicketController,
  listTicketsController,
  updateTicketStatusController
} from "../controllers/ticket.controller.js";
import { validate } from "../middleware/validate.js";
import {
  addTicketNoteSchema,
  analyzeTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema
} from "../validators/ticket.validator.js";

export const ticketRouter = Router();

ticketRouter.get("/", listTicketsController);
ticketRouter.get("/:id", getTicketController);
ticketRouter.post("/analyze", validate(analyzeTicketSchema), analyzeTicketController);
ticketRouter.post("/", validate(createTicketSchema), createTicketController);
ticketRouter.patch("/:id/status", validate(updateTicketStatusSchema), updateTicketStatusController);
ticketRouter.post("/:id/notes", validate(addTicketNoteSchema), addTicketNoteController);
