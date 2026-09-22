import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { config } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";
import {
  OTP_VERIFY_RATE_LIMIT_PER_PHONE,
  OTP_VERIFY_RATE_LIMIT_WINDOW_MINUTES,
} from "../config/constants.js";

function phoneKey(req: Request): string {
  const phone = typeof req.body?.phone === "string" ? req.body.phone : "unknown";
  return `phone:${phone}`;
}

export const otpRequestPhoneLimiter = rateLimit({
  windowMs: config.OTP_REQUEST_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: config.OTP_REQUEST_RATE_LIMIT_PER_PHONE,
  keyGenerator: phoneKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw ApiError.tooManyRequests(
      "OTP_REQUEST_RATE_LIMITED",
      "Too many OTP requests for this phone number. Try again later.",
    );
  },
});

export const otpRequestIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw ApiError.tooManyRequests(
      "OTP_REQUEST_RATE_LIMITED",
      "Too many OTP requests from this network. Try again later.",
    );
  },
});

export const otpVerifyLimiter = rateLimit({
  windowMs: OTP_VERIFY_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: OTP_VERIFY_RATE_LIMIT_PER_PHONE,
  keyGenerator: phoneKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw ApiError.tooManyRequests(
      "OTP_VERIFY_RATE_LIMITED",
      "Too many verification attempts for this phone number. Try again later.",
    );
  },
});
