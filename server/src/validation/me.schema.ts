import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  bankAccountLabel: z.string().max(120).optional(),
});
