import { prisma } from "../lib/prisma.js";

export function createExtensionRequest(input: {
  groupId: string;
  roundId: string;
  memberId: string;
  paymentId?: string;
  reason: string;
  requestedByUserId: string;
}) {
  return prisma.paymentExtensionRequest.create({ data: input });
}

export function findExtensionRequestsForGroup(groupId: string) {
  return prisma.paymentExtensionRequest.findMany({
    where: { groupId },
    include: { member: { include: { user: true } }, round: true },
    orderBy: { createdAt: "desc" },
  });
}
