import { prisma } from "../lib/prisma.js";

export function createPayoutHold(input: {
  roundId: string;
  groupId: string;
  reason: string;
  placedByUserId: string;
}) {
  return prisma.payoutHold.create({ data: input });
}

export function findActiveHoldForRound(roundId: string) {
  return prisma.payoutHold.findFirst({
    where: { roundId, releasedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function releaseHold(id: string) {
  return prisma.payoutHold.update({ where: { id }, data: { releasedAt: new Date() } });
}
