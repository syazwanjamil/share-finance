import crypto from "node:crypto";
import { ApiError } from "../lib/ApiError.js";
import { prisma } from "../lib/prisma.js";
import { findGroupById } from "../repositories/group.repository.js";
import { findRoundsForGroup } from "../repositories/round.repository.js";
import { findMembersForGroup } from "../repositories/member.repository.js";
import { findPayoutOrderHistory } from "../repositories/payoutOrderLog.repository.js";
import { findPriorityRequestById, resolvePriorityRequest } from "../repositories/priorityRequest.repository.js";
import { notify, whatsAppService } from "./notification/notify.js";
import type { NotifyChannel } from "@prisma/client";

export interface ReorderChange {
  roundNumber: number;
  newRecipientMemberId: string;
}

export interface ReorderInput {
  changes: ReorderChange[];
  reason: string;
  notifyChannel: NotifyChannel;
  requireConfirm: boolean;
  changedByUserId: string;
}

export async function applyPayoutOrderChanges(groupId: string, input: ReorderInput) {
  const group = await findGroupById(groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");

  const rounds = await findRoundsForGroup(groupId);
  const roundsByNumber = new Map(rounds.map((r) => [r.roundNumber, r]));

  for (const change of input.changes) {
    const round = roundsByNumber.get(change.roundNumber);
    if (!round) {
      throw ApiError.notFound("ROUND_NOT_FOUND", `Round ${change.roundNumber} not found`);
    }
    if (round.status === "paid_out") {
      throw ApiError.conflict("ROUND_LOCKED", `Round ${change.roundNumber} has already paid out and cannot be reordered`);
    }
  }

  const batchId = crypto.randomUUID();
  const priorityStatus = input.requireConfirm ? "pending" : "approved";

  await prisma.$transaction(async (tx) => {
    const logRows = input.changes.map((change) => {
      const round = roundsByNumber.get(change.roundNumber)!;
      return {
        batchId,
        groupId,
        roundId: round.id,
        previousRecipientMemberId: round.recipientMemberId,
        newRecipientMemberId: change.newRecipientMemberId,
        reason: input.reason,
        notifyChannel: input.notifyChannel,
        requireConfirm: input.requireConfirm,
        changedByUserId: input.changedByUserId,
      };
    });
    await tx.payoutOrderChangeLog.createMany({ data: logRows });

    for (const change of input.changes) {
      const round = roundsByNumber.get(change.roundNumber)!;
      await tx.round.update({
        where: { id: round.id },
        data: { recipientMemberId: change.newRecipientMemberId },
      });
      await tx.priorityRequest.upsert({
        where: { roundId: round.id },
        update: {
          memberId: change.newRecipientMemberId,
          reason: input.reason,
          status: priorityStatus,
          resolvedAt: priorityStatus === "pending" ? null : new Date(),
        },
        create: {
          roundId: round.id,
          memberId: change.newRecipientMemberId,
          reason: input.reason,
          status: priorityStatus,
          resolvedAt: priorityStatus === "pending" ? null : new Date(),
        },
      });
    }
  });

  if (input.notifyChannel === "whatsapp") {
    const members = await findMembersForGroup(groupId);
    await Promise.all(
      members
        .filter((m) => m.status === "active" && m.user?.phone)
        .map((m) =>
          notify({
            phone: m.user!.phone,
            groupId,
            template: "payout_order_change",
            payload: { reason: input.reason, changes: input.changes },
            send: () =>
              whatsAppService.sendPayoutOrderChange(m.user!.phone, {
                groupName: group.name,
                roundNumber: input.changes[0]?.roundNumber ?? 0,
                reason: input.reason,
              }),
          }),
        ),
    );
  }

  return { batchId, rounds: await findRoundsForGroup(groupId) };
}

export async function getPayoutOrderHistory(groupId: string) {
  return findPayoutOrderHistory(groupId);
}

export async function respondToPriorityRequest(
  groupId: string,
  priorityRequestId: string,
  status: "approved" | "declined",
) {
  const request = await findPriorityRequestById(priorityRequestId);
  if (!request || request.round.groupId !== groupId) {
    throw ApiError.notFound("PRIORITY_REQUEST_NOT_FOUND", "Priority request not found");
  }
  return resolvePriorityRequest(priorityRequestId, status);
}
