import { prisma } from "../lib/prisma.js";

export function findPayoutOrderHistory(groupId: string) {
  return prisma.payoutOrderChangeLog.findMany({
    where: { groupId },
    include: { round: true, newRecipient: { include: { user: true } }, changedBy: true },
    orderBy: { createdAt: "desc" },
  });
}
