import type { Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import * as authService from "../services/auth.service.js";

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone: string };
  const result = await authService.requestOtp(phone);
  res.status(202).json(result);
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { phone, code } = req.body as { phone: string; code: string };
  const result = await authService.verifyOtp(phone, code, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  res.status(200).json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id: result.user.id,
      name: result.user.name,
      phone: result.user.phone,
      phoneVerified: result.user.phoneVerified,
      mykadVerified: result.user.mykadVerified,
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refreshSession(refreshToken, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  res.status(200).json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  const { refreshToken } = req.body as { refreshToken?: string };
  await authService.logout(req.user.id, refreshToken);
  res.status(204).send();
}
