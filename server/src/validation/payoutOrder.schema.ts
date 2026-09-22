import { z } from "zod";

export const reorderPayoutSchema = z.object({
  changes: z
    .array(
      z.object({
        roundNumber: z.number().int().positive(),
        newRecipientMemberId: z.string().min(1),
      }),
    )
    .min(1),
  reason: z.string().min(1).max(500),
  notifyChannel: z.enum(["whatsapp", "in_app", "sms"]).default("whatsapp"),
  requireConfirm: z.boolean().default(false),
});

export const respondPriorityRequestSchema = z.object({
  status: z.enum(["approved", "declined"]),
});

export const priorityRequestParamsSchema = z.object({
  groupId: z.string().min(1),
  id: z.string().min(1),
});
