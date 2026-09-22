import { prisma } from "../lib/prisma.js";
import type { Group, Prisma } from "@prisma/client";

export const groupBundleInclude = {
  members: { include: { user: true }, orderBy: { createdAt: "asc" } },
  rounds: {
    include: { priorityRequest: true, holds: { where: { releasedAt: null } } },
    orderBy: { roundNumber: "asc" },
  },
  payments: true,
} satisfies Prisma.GroupInclude;

/** Prisma's raw shape: Group scalars + relations as sibling properties. */
type GroupWithRelations = Prisma.GroupGetPayload<{ include: typeof groupBundleInclude }>;

/**
 * API-facing shape: Group scalars nested under `group`, mirroring the frontend's
 * existing `GroupBundle` (src/mock/groups/index.ts: `{group, members, rounds, payments}`)
 * so the eventual frontend integration needs no reshaping.
 */
export interface GroupBundle {
  group: Omit<GroupWithRelations, "members" | "rounds" | "payments">;
  members: GroupWithRelations["members"];
  rounds: GroupWithRelations["rounds"];
  payments: GroupWithRelations["payments"];
}

function toBundle(row: GroupWithRelations): GroupBundle {
  const { members, rounds, payments, ...group } = row;
  return { group, members, rounds, payments };
}

export async function findGroupBundleById(id: string): Promise<GroupBundle | null> {
  const row = await prisma.group.findUnique({ where: { id }, include: groupBundleInclude });
  return row ? toBundle(row) : null;
}

export async function findGroupBundleBySlug(slug: string): Promise<GroupBundle | null> {
  const row = await prisma.group.findUnique({ where: { slug }, include: groupBundleInclude });
  return row ? toBundle(row) : null;
}

export function findGroupById(id: string): Promise<Group | null> {
  return prisma.group.findUnique({ where: { id } });
}

export function findGroupByInviteCode(inviteCode: string): Promise<Group | null> {
  return prisma.group.findUnique({ where: { inviteCode } });
}

export async function findGroupsForUser(userId: string): Promise<GroupBundle[]> {
  const rows = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: groupBundleInclude,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toBundle);
}

export function createGroupWithRounds(input: {
  group: Prisma.GroupCreateInput;
  organizerUserId: string;
  rounds: { roundNumber: number; scheduledDate: Date; status: "current" | "upcoming" }[];
}): Promise<GroupBundle> {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({ data: input.group });

    const organizerMember = await tx.member.create({
      data: {
        groupId: group.id,
        userId: input.organizerUserId,
        role: "organizer",
        status: "active",
        joinedAt: new Date(),
      },
    });

    const emptySlotsCount = Math.max(0, input.rounds.length - 1);
    const emptyMembers = await Promise.all(
      Array.from({ length: emptySlotsCount }, () =>
        tx.member.create({ data: { groupId: group.id, role: "member", status: "empty" } }),
      ),
    );
    const fillerMemberIds = [organizerMember.id, ...emptyMembers.map((m) => m.id)];

    await tx.round.createMany({
      data: input.rounds.map((round, index) => ({
        groupId: group.id,
        roundNumber: round.roundNumber,
        scheduledDate: round.scheduledDate,
        status: round.status,
        // Recipient is provisionally the organizer until the payout order is finalized
        // once all slots are filled; index cycles through available members for now.
        recipientMemberId: fillerMemberIds[index % fillerMemberIds.length],
      })),
    });

    const row = await tx.group.findUniqueOrThrow({
      where: { id: group.id },
      include: groupBundleInclude,
    });
    return toBundle(row);
  });
}

export function updateGroupCurrentRound(groupId: string, currentRound: number): Promise<Group> {
  return prisma.group.update({ where: { id: groupId }, data: { currentRound } });
}
