import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(5),
  color: z.string().trim().min(4),
  responsibleArea: z.string().trim().min(2),
  active: z.boolean().optional()
});
