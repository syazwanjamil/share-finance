import { ApiError } from "../lib/ApiError.js";
import { generateInviteCode } from "../lib/inviteCode.js";
import { stepDate } from "../lib/dateStep.js";
import {
  createGroupWithRounds,
  findGroupBundleById,
  findGroupBundleBySlug,
  findGroupByInviteCode,
  findGroupsForUser,
  type GroupBundle,
} from "../repositories/group.repository.js";
import { activateMember, findEmptySlot, findOpenSlot, inviteSlot } from "../repositories/member.repository.js";
import type { Member } from "@prisma/client";
import { notify, whatsAppService } from "./notification/notify.js";
import type { Frequency, PayoutOrderMethod } from "@prisma/client";

export interface CreateGroupInput {
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  totalSlots: number;
  firstPayoutDate: Date;
  lateFeeEnabled: boolean;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  payoutOrderMethod: PayoutOrderMethod;
  organizerUserId: string;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "group"
  );
}

async function uniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName);
  let candidate = base;
  let suffix = 1;
  // Small collision-avoidance loop; group creation is low-frequency so a few lookups is fine.
  while (await findGroupBundleBySlug(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

async function uniqueInviteCode(): Promise<string> {
  let candidate = generateInviteCode();
  while (await findGroupByInviteCode(candidate)) {
    candidate = generateInviteCode();
  }
  return candidate;
}

export async function createGroup(input: CreateGroupInput): Promise<GroupBundle> {
  const slug = await uniqueSlug(input.name);
  const inviteCode = await uniqueInviteCode();

  const rounds = Array.from({ length: input.totalSlots }, (_, i) => ({
    roundNumber: i + 1,
    scheduledDate: stepDate(input.firstPayoutDate, input.frequency, i),
    status: (i === 0 ? "current" : "upcoming") as "current" | "upcoming",
  }));

  return createGroupWithRounds({
    group: {
      slug,
      name: input.name,
      contributionAmount: input.contributionAmount,
      frequency: input.frequency,
      totalSlots: input.totalSlots,
      totalRounds: input.totalSlots,
      currentRound: 1,
      trustAccountVerified: false,
      organizer: { connect: { id: input.organizerUserId } },
      lateFeeAmount: input.lateFeeEnabled ? input.lateFeeAmount : 0,
      lateFeeGraceDays: input.lateFeeGraceDays,
      payoutOrderMethod: input.payoutOrderMethod,
      inviteCode,
      startedAt: input.firstPayoutDate,
    },
    organizerUserId: input.organizerUserId,
    rounds,
  });
}

export async function getGroupBundle(groupId: string): Promise<GroupBundle> {
  const bundle = await findGroupBundleById(groupId);
  if (!bundle) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");
  return bundle;
}

export async function getGroupBundleBySlug(slug: string): Promise<GroupBundle> {
  const bundle = await findGroupBundleBySlug(slug);
  if (!bundle) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");
  return bundle;
}

export async function getGroupsForUser(userId: string): Promise<GroupBundle[]> {
  return findGroupsForUser(userId);
}

export async function joinGroupByInviteCode(inviteCode: string, userId: string): Promise<GroupBundle> {
  const group = await findGroupByInviteCode(inviteCode);
  if (!group) {
    throw ApiError.notFound("INVITE_CODE_NOT_FOUND", "No group found for this invite code");
  }

  const bundle = await getGroupBundle(group.id);
  const alreadyMember = bundle.members.some((m) => m.userId === userId);
  if (alreadyMember) {
    throw ApiError.conflict("ALREADY_MEMBER", "You are already a member of this group");
  }

  const openSlot = await findOpenSlot(group.id);
  if (!openSlot) {
    throw ApiError.conflict("GROUP_FULL", "This group has no open slots");
  }

  await activateMember(openSlot.id, userId);
  return getGroupBundle(group.id);
}

export interface PoolSummary {
  pool: number;
  memberCount: number;
  contributionAmount: number;
  rounds: number;
  endsAt: string;
}

export function computePoolSummary(bundle: GroupBundle): PoolSummary {
  const amount = Number(bundle.group.contributionAmount);
  const slots = bundle.group.totalSlots;
  const rounds = bundle.group.totalRounds;
  const endsAt = stepDate(bundle.group.startedAt, bundle.group.frequency, rounds - 1);
  return {
    pool: amount * slots,
    memberCount: slots,
    contributionAmount: amount,
    rounds,
    endsAt: endsAt.toISOString(),
  };
}

export async function inviteMember(groupId: string, phone: string): Promise<Member> {
  const bundle = await getGroupBundle(groupId);

  const alreadyInvited = bundle.members.some((m) => m.invitedPhone === phone || m.user?.phone === phone);
  if (alreadyInvited) {
    throw ApiError.conflict("ALREADY_INVITED", "This phone number is already part of the group");
  }

  const slot = await findEmptySlot(groupId);
  if (!slot) {
    throw ApiError.conflict("GROUP_FULL", "This group has no open slots left to invite into");
  }

  const invited = await inviteSlot(slot.id, phone);

  await notify({
    phone,
    groupId,
    template: "group_invite",
    payload: { groupName: bundle.group.name, inviteCode: bundle.group.inviteCode },
    send: () =>
      whatsAppService.sendGroupInvite(phone, {
        groupName: bundle.group.name,
        inviteCode: bundle.group.inviteCode,
      }),
  });

  return invited;
}
