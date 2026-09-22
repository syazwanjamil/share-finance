import { z } from "zod";

// Malaysian mobile numbers in E.164, e.g. +60123456789
const phoneSchema = z
  .string()
  .regex(/^\+60\d{8,10}$/, "Phone must be in E.164 Malaysian format, e.g. +60123456789");

export const otpRequestSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, "OTP code must be 6 digits").regex(/^\d+$/, "OTP code must be numeric"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export { phoneSchema };
