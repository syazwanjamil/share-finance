import { prisma } from "../lib/prisma.js";
import type { PriorityRequestStatus } from "@prisma/client";

export function upsertPriorityRequest(input: {
  roundId: string;
  memberId: string;
  reason: string;
  status: PriorityRequestStatus;
}) {
  return prisma.priorityRequest.upsert({
    where: { roundId: input.roundId },
    update: { memberId: input.memberId, reason: input.reason, status: input.status, resolvedAt: input.status === "pending" ? null : new Date() },
    create: input,
  });
}

export function findPriorityRequestById(id: string) {
  return prisma.priorityRequest.findUnique({ where: { id }, include: { round: true } });
}

export function resolvePriorityRequest(id: string, status: "approved" | "declined") {
  return prisma.priorityRequest.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
  });
}
