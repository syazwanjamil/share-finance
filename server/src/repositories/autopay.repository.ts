import { prisma } from "../lib/prisma.js";

export function findAutopay(userId: string, groupId: string) {
  return prisma.autopay.findUnique({ where: { userId_groupId: { userId, groupId } } });
}

export function setAutopay(userId: string, groupId: string, enabled: boolean) {
  return prisma.autopay.upsert({
    where: { userId_groupId: { userId, groupId } },
    update: { enabled },
    create: { userId, groupId, enabled },
  });
}
