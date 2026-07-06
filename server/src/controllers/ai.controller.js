import { analyzeTicket, getAiStatus } from "../services/ai.service.js";

export function getAiStatusController(_req, res) {
  res.json(getAiStatus());
}

export async function analyzeTicketController(req, res, next) {
  try {
    const analysis = await analyzeTicket(req.body);
    res.json({ data: analysis });
  } catch (error) {
    next(error);
  }
}
