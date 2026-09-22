import { prisma } from "../lib/prisma.js";
import type { Payment, PaymentMethod, PaymentStatus } from "@prisma/client";

export function findPaymentsForRound(groupId: string, roundNumber: number): Promise<Payment[]> {
  return prisma.payment.findMany({ where: { groupId, roundNumber } });
}

export function findPaymentForMemberRound(memberId: string, roundNumber: number): Promise<Payment | null> {
  return prisma.payment.findUnique({
    where: { memberId_roundNumber: { memberId, roundNumber } },
  });
}

export function findPaymentByGatewaySessionId(gatewaySessionId: string): Promise<Payment | null> {
  return prisma.payment.findUnique({ where: { gatewaySessionId } });
}

export interface UpsertPaymentInput {
  groupId: string;
  memberId: string;
  roundId: string;
  roundNumber: number;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  ref?: string | null;
  paidAt?: Date | null;
  lateFeeApplied?: number;
  gatewayProvider?: string | null;
  gatewaySessionId?: string | null;
  gatewayPaymentIntentId?: string | null;
  gatewayFailureReason?: string | null;
}

export function upsertPayment(input: UpsertPaymentInput): Promise<Payment> {
  const { groupId, memberId, roundId, roundNumber, ...rest } = input;
  return prisma.payment.upsert({
    where: { memberId_roundNumber: { memberId, roundNumber } },
    update: { ...rest },
    create: { groupId, memberId, roundId, roundNumber, ...rest },
  });
}

export function countPaidForRound(groupId: string, roundNumber: number): Promise<number> {
  return prisma.payment.count({
    where: { groupId, roundNumber, status: { in: ["paid", "paid_late"] } },
  });
}
