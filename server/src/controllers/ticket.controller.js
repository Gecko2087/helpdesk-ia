import {
  addTicketNote,
  createTicket,
  getTicketById,
  listTickets,
  updateTicketStatus
} from "../services/ticket.service.js";

export async function listTicketsController(req, res, next) {
  try {
    const tickets = await listTickets(req.query);
    res.json({ data: tickets });
  } catch (error) {
    next(error);
  }
}

export async function getTicketController(req, res, next) {
  try {
    const ticket = await getTicketById(Number(req.params.id));

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    return res.json({ data: ticket });
  } catch (error) {
    return next(error);
  }
}

export async function createTicketController(req, res, next) {
  try {
    const ticket = await createTicket(req.body);
    res.status(201).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicketStatusController(req, res, next) {
  try {
    const ticket = await updateTicketStatus(Number(req.params.id), req.body.status);
    res.json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function addTicketNoteController(req, res, next) {
  try {
    const ticket = await addTicketNote(Number(req.params.id), req.body.content);
    res.status(201).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}
