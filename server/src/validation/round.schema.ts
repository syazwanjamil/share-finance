import { z } from "zod";
import { groupIdParamSchema } from "./group.schema.js";

export const roundParamsSchema = groupIdParamSchema.extend({
  roundNumber: z.coerce.number().int().positive(),
});

export const releaseRoundSchema = z.object({
  force: z.boolean().default(false),
  simulate: z.boolean().default(false),
});

export const autoReleaseSchema = z.object({
  autoRelease: z.boolean(),
});

export const holdRoundSchema = z.object({
  reason: z.string().min(1).max(500),
});
