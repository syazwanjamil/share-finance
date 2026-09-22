import { prisma } from "../lib/prisma.js";
import type { Member, Prisma } from "@prisma/client";

export function findMemberByGroupAndUser(groupId: string, userId: string): Promise<Member | null> {
  return prisma.member.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function findMembersForGroup(groupId: string) {
  return prisma.member.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export function findMemberById(id: string): Promise<Member | null> {
  return prisma.member.findUnique({ where: { id } });
}

export function findMemberWithUserById(id: string) {
  return prisma.member.findUnique({ where: { id }, include: { user: true } });
}

/** First open slot (invited or empty) available for a joining user, oldest first. */
export function findOpenSlot(groupId: string): Promise<Member | null> {
  return prisma.member.findFirst({
    where: { groupId, status: { in: ["invited", "empty"] } },
    orderBy: { createdAt: "asc" },
  });
}

/** First genuinely empty (never-invited) slot, for the organizer's explicit invite action. */
export function findEmptySlot(groupId: string): Promise<Member | null> {
  return prisma.member.findFirst({
    where: { groupId, status: "empty" },
    orderBy: { createdAt: "asc" },
  });
}

export function activateMember(id: string, userId: string): Promise<Member> {
  return prisma.member.update({
    where: { id },
    data: { userId, status: "active", joinedAt: new Date() },
  });
}

export function inviteSlot(id: string, invitedPhone: string): Promise<Member> {
  return prisma.member.update({
    where: { id },
    data: { invitedPhone, status: "invited" },
  });
}

export function updateMemberRecipient(id: string, data: Prisma.MemberUpdateInput) {
  return prisma.member.update({ where: { id }, data });
}
