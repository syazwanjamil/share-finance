import { prisma } from "../lib/prisma.js";
import type { OtpCode } from "@prisma/client";

export function invalidateActiveOtps(phone: string): Promise<{ count: number }> {
  return prisma.otpCode.updateMany({
    where: { phone, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

export function createOtp(input: {
  phone: string;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
}): Promise<OtpCode> {
  return prisma.otpCode.create({ data: input });
}

export function findActiveOtp(phone: string): Promise<OtpCode | null> {
  return prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function incrementOtpAttempts(id: string): Promise<OtpCode> {
  return prisma.otpCode.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
}

export function consumeOtp(id: string): Promise<OtpCode> {
  return prisma.otpCode.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}

export function countRecentOtpRequests(phone: string, since: Date): Promise<number> {
  return prisma.otpCode.count({
    where: { phone, createdAt: { gte: since } },
  });
}
