import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  OTP_LENGTH: z.coerce.number().int().positive().default(6),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_REQUEST_RATE_LIMIT_PER_PHONE: z.coerce.number().int().positive().default(3),
  OTP_REQUEST_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(10),

  NOTIFICATION_PROVIDER: z.enum(["mock", "teekrr"]).default("mock"),
  TEEKRR_API_BASE_URL: z.string().optional().default(""),
  TEEKRR_API_KEY: z.string().optional().default(""),

  PAYMENT_GATEWAY_PROVIDER: z
    .enum(["simulated", "billplz", "toyyibpay", "curlec"])
    .default("simulated"),
  PAYMENT_GATEWAY_API_KEY: z.string().optional().default(""),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:5174")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  DEBUG_OTP_ECHO: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
};
