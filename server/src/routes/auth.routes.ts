import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { otpRequestIpLimiter, otpRequestPhoneLimiter, otpVerifyLimiter } from "../middleware/rateLimit.js";
import { logoutSchema, otpRequestSchema, otpVerifySchema, refreshSchema } from "../validation/auth.schema.js";

export const authRouter = Router();

authRouter.post(
  "/otp/request",
  otpRequestIpLimiter,
  otpRequestPhoneLimiter,
  validate({ body: otpRequestSchema }),
  authController.requestOtp,
);

authRouter.post(
  "/otp/verify",
  otpVerifyLimiter,
  validate({ body: otpVerifySchema }),
  authController.verifyOtp,
);

authRouter.post("/refresh", validate({ body: refreshSchema }), authController.refresh);

authRouter.post("/logout", requireAuth, validate({ body: logoutSchema }), authController.logout);
