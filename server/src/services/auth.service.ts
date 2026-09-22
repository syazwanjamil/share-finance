import { config } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";
import { compareSecret, hashSecret } from "../lib/hash.js";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "../lib/jwt.js";
import {
  consumeOtp,
  createOtp,
  findActiveOtp,
  incrementOtpAttempts,
  invalidateActiveOtps,
} from "../repositories/otp.repository.js";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
} from "../repositories/refreshToken.repository.js";
import { createUser, findUserByPhone, findUserById } from "../repositories/user.repository.js";
import { notify } from "./notification/notify.js";
import { whatsAppService } from "./notification/index.js";
import type { User } from "@prisma/client";

function generateOtpCode(): string {
  const min = 10 ** (config.OTP_LENGTH - 1);
  const max = 10 ** config.OTP_LENGTH - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export interface RequestOtpResult {
  phone: string;
  expiresInSeconds: number;
  /** Only populated when DEBUG_OTP_ECHO is enabled and not in production. */
  debugCode?: string;
}

export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  await invalidateActiveOtps(phone);

  const code = generateOtpCode();
  const codeHash = await hashSecret(code);
  const expiresAt = new Date(Date.now() + config.OTP_TTL_MINUTES * 60 * 1000);

  await createOtp({ phone, codeHash, expiresAt, maxAttempts: config.OTP_MAX_ATTEMPTS });

  await notify({
    phone,
    template: "otp",
    payload: { expiresInMinutes: config.OTP_TTL_MINUTES },
    send: () => whatsAppService.sendOtp(phone, { code, expiresInMinutes: config.OTP_TTL_MINUTES }),
  });

  const debugEcho = config.DEBUG_OTP_ECHO && !config.isProduction;
  return {
    phone,
    expiresInSeconds: config.OTP_TTL_MINUTES * 60,
    ...(debugEcho ? { debugCode: code } : {}),
  };
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function verifyOtp(
  phone: string,
  code: string,
  context: { userAgent?: string; ip?: string },
): Promise<VerifyOtpResult> {
  const otp = await findActiveOtp(phone);
  if (!otp) {
    throw ApiError.badRequest("OTP_NOT_FOUND", "No active OTP for this phone number. Request a new one.");
  }
  if (otp.expiresAt < new Date()) {
    throw ApiError.badRequest("OTP_EXPIRED", "This code has expired. Request a new one.");
  }
  if (otp.attempts >= otp.maxAttempts) {
    throw ApiError.tooManyRequests("OTP_LOCKED", "Too many incorrect attempts. Request a new code.");
  }

  const isValid = await compareSecret(code, otp.codeHash);
  if (!isValid) {
    const updated = await incrementOtpAttempts(otp.id);
    const attemptsRemaining = Math.max(0, updated.maxAttempts - updated.attempts);
    throw ApiError.badRequest("OTP_INVALID", "Incorrect code.", { attemptsRemaining });
  }

  await consumeOtp(otp.id);

  let user = await findUserByPhone(phone);
  if (!user) {
    user = await createUser(phone);
  }

  const accessToken = signAccessToken({ sub: user.id, phone: user.phone });
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    userAgent: context.userAgent,
    ip: context.ip,
  });

  return { accessToken, refreshToken: rawRefreshToken, user };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export async function refreshSession(
  rawRefreshToken: string,
  context: { userAgent?: string; ip?: string },
): Promise<RefreshResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const existing = await findRefreshTokenByHash(tokenHash);

  if (!existing) {
    throw ApiError.unauthorized("INVALID_REFRESH_TOKEN", "Refresh token not recognized");
  }

  if (existing.revokedAt) {
    // Reuse of an already-rotated/revoked token — treat as theft and kill the whole chain.
    await revokeAllRefreshTokensForUser(existing.userId);
    throw ApiError.unauthorized("REFRESH_TOKEN_REUSED", "Refresh token has already been used");
  }

  if (existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
  }

  const user = await findUserById(existing.userId);
  if (!user) {
    throw ApiError.unauthorized("INVALID_REFRESH_TOKEN", "User no longer exists");
  }

  const newRawToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRawToken);
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const newToken = await createRefreshToken({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt,
    userAgent: context.userAgent,
    ip: context.ip,
  });

  await revokeRefreshToken(existing.id, newToken.id);

  const accessToken = signAccessToken({ sub: user.id, phone: user.phone });
  return { accessToken, refreshToken: newRawToken };
}

export async function logout(userId: string, rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existing = await findRefreshTokenByHash(tokenHash);
    if (existing && existing.userId === userId && !existing.revokedAt) {
      await revokeRefreshToken(existing.id);
    }
    return;
  }
  await revokeAllRefreshTokensForUser(userId);
}
