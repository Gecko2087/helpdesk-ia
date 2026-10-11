import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(2000),
  color: z.string().trim().regex(/^#[a-f0-9]{6}$/i),
  responsibleArea: z.string().trim().min(2).max(120),
  active: z.boolean().optional()
});
