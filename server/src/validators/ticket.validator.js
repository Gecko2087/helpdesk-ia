import { z } from "zod";

import { levels, sourceChannels, ticketStatuses } from "./enums.js";

const analysisSchema = z
  .object({
    provider: z.string().optional(),
    category: z.string().optional(),
    priority: z.string().optional(),
    impact: z.enum(levels).optional(),
    urgency: z.enum(levels).optional(),
    confidence: z.string().optional(),
    summary: z.string().optional(),
    possibleCause: z.string().optional(),
    responsibleArea: z.string().optional(),
    suggestedReply: z.string().optional(),
    suggestedSteps: z.array(z.string()).optional(),
    missingInfo: z.array(z.string()).optional()
  })
  .optional();

export const createTicketSchema = z.object({
  title: z.string().trim().min(5),
  description: z.string().trim().min(20),
  requesterName: z.string().trim().min(2),
  requesterArea: z.string().trim().min(2),
  sourceChannel: z.enum(sourceChannels),
  impact: z.enum(levels),
  urgency: z.enum(levels),
  categoryId: z.number().int().positive().optional(),
  analysis: analysisSchema
});

export const analyzeTicketSchema = z.object({
  title: z.string().trim().min(5),
  description: z.string().trim().min(20),
  requesterName: z.string().trim().min(2).optional(),
  requesterArea: z.string().trim().min(2),
  sourceChannel: z.enum(sourceChannels),
  impact: z.enum(levels).optional(),
  urgency: z.enum(levels).optional()
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(ticketStatuses)
});

export const addTicketNoteSchema = z.object({
  content: z.string().trim().min(2)
});
