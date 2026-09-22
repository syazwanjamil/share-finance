import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import { verifyAccessToken } from "../lib/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("UNAUTHENTICATED", "Missing bearer token");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, phone: payload.phone };
    next();
  } catch {
    throw ApiError.unauthorized("UNAUTHENTICATED", "Invalid or expired access token");
  }
}
