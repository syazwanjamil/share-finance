import { prisma } from "../lib/prisma.js";
import type { Round } from "@prisma/client";

export function findRoundsForGroup(groupId: string) {
  return prisma.round.findMany({
    where: { groupId },
    include: {
      priorityRequest: true,
      holds: { where: { releasedAt: null } },
      recipient: { include: { user: true } },
    },
    orderBy: { roundNumber: "asc" },
  });
}

export function findRoundByNumber(groupId: string, roundNumber: number): Promise<Round | null> {
  return prisma.round.findUnique({
    where: { groupId_roundNumber: { groupId, roundNumber } },
  });
}

export function findRoundById(id: string): Promise<Round | null> {
  return prisma.round.findUnique({ where: { id } });
}

export function updateRound(id: string, data: Partial<Round>) {
  return prisma.round.update({ where: { id }, data });
}
