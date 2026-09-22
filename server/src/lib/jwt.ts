import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  phone: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
  if (typeof decoded === "string" || !decoded.sub || !decoded.phone) {
    throw new Error("Malformed access token payload");
  }
  return { sub: String(decoded.sub), phone: String(decoded.phone) };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
