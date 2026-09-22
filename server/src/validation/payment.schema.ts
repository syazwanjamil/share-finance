import { z } from "zod";

export const initiatePaymentSchema = z.object({
  method: z.enum(["fpx", "ewallet", "qr", "card"]),
});

export const confirmPaymentSchema = z.object({
  gatewayRef: z.string().min(1),
});

export const extensionRequestSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const autopaySchema = z.object({
  enabled: z.boolean(),
});
