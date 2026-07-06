import { describe, expect, it } from "vitest";

import { analyzeTicketSchema, createTicketSchema } from "./ticket.validator.js";

const validTicket = {
  title: "No puedo ingresar al CRM",
  description: "El sistema informa que mi usuario esta bloqueado desde esta manana.",
  requesterName: "Lucas Perez",
  requesterArea: "Ventas",
  sourceChannel: "email",
  impact: "medium",
  urgency: "high"
};

describe("ticket validators", () => {
  it("accepts a valid ticket creation payload", () => {
    expect(createTicketSchema.safeParse(validTicket).success).toBe(true);
  });

  it("rejects short title and description", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      title: "CRM",
      description: "No entra"
    });

    expect(result.success).toBe(false);
  });

  it("accepts analyze payload without requesterName", () => {
    const { requesterName, ...payload } = validTicket;

    expect(analyzeTicketSchema.safeParse(payload).success).toBe(true);
  });
});
