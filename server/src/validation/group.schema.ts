import { z } from "zod";

/** Frontend sends "join-order" (hyphen); Prisma enum is join_order (underscore). */
export const payoutOrderMethodSchema = z
  .enum(["assigned", "random", "join-order"])
  .transform((value) => (value === "join-order" ? "join_order" : value));

export const createGroupSchema = z.object({
  name: z.string().min(1).max(120),
  contributionAmount: z.coerce.number().positive(),
  frequency: z.enum(["weekly", "monthly"]),
  totalSlots: z.coerce.number().int().min(2).max(50),
  firstPayoutDate: z.coerce.date(),
  lateFeeEnabled: z.boolean().default(true),
  lateFeeAmount: z.coerce.number().nonnegative().default(20),
  lateFeeGraceDays: z.coerce.number().int().nonnegative().default(3),
  payoutOrderMethod: payoutOrderMethodSchema.default("assigned"),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().min(1),
});

export const groupSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const inviteMemberSchema = z.object({
  phone: z.string().regex(/^\+60\d{8,10}$/),
});
