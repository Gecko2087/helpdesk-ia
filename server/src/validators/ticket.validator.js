import { z } from "zod";

import { levels, sourceChannels, ticketStatuses } from "./enums.js";

const analysisSchema = z
  .object({
    provider: z.enum(['demo', 'gemini']).optional(),
    category: z.string().max(120).optional(),
    priority: z.string().max(16).optional(),
    impact: z.enum(levels).optional(),
    urgency: z.enum(levels).optional(),
    confidence: z.string().max(16).optional(),
    summary: z.string().max(2000).optional(),
    possibleCause: z.string().max(2000).optional(),
    responsibleArea: z.string().max(120).optional(),
    suggestedReply: z.string().max(2000).optional(),
    suggestedSteps: z.array(z.string().max(1000)).max(10).optional(),
    missingInfo: z.array(z.string().max(1000)).max(10).optional()
  })
  .optional();

export const createTicketSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(8000),
  requesterName: z.string().trim().min(2).max(120),
  requesterArea: z.string().trim().min(2).max(120),
  sourceChannel: z.enum(sourceChannels),
  impact: z.enum(levels),
  urgency: z.enum(levels),
  categoryId: z.number().int().positive().optional(),
  analysis: analysisSchema
});

export const analyzeTicketSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(8000),
  requesterName: z.string().trim().min(2).max(120).optional(),
  requesterArea: z.string().trim().min(2).max(120),
  sourceChannel: z.enum(sourceChannels),
  impact: z.enum(levels).optional(),
  urgency: z.enum(levels).optional()
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(ticketStatuses)
});

export const addTicketNoteSchema = z.object({
  content: z.string().trim().min(2).max(2000)
});
