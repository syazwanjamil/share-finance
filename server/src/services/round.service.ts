import { ApiError } from "../lib/ApiError.js";
import { generatePayoutRef } from "../lib/reference.js";
import {
  findRoundByNumber,
  findRoundsForGroup,
  updateRound,
} from "../repositories/round.repository.js";
import { countPaidForRound, findPaymentsForRound } from "../repositories/payment.repository.js";
import { findGroupById, updateGroupCurrentRound } from "../repositories/group.repository.js";
import { findMembersForGroup } from "../repositories/member.repository.js";
import { createPayoutHold, findActiveHoldForRound, releaseHold } from "../repositories/payoutHold.repository.js";
import { notify, whatsAppService } from "./notification/notify.js";
import { formatRM } from "../lib/currency.js";
import { config } from "../config/env.js";
import { stripe } from "../lib/stripeClient.js";
import type { Round } from "@prisma/client";

async function getRoundOrThrow(groupId: string, roundNumber: number): Promise<Round> {
  const round = await findRoundByNumber(groupId, roundNumber);
  if (!round) throw ApiError.notFound("ROUND_NOT_FOUND", "Round not found");
  return round;
}

export interface RoundCollection {
  round: Round;
  paidCount: number;
  totalCount: number;
  collected: number;
  pool: number;
  lateFeesCollected: number;
}

export async function computeRoundCollection(groupId: string, roundNumber: number): Promise<RoundCollection> {
  const group = await findGroupById(groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");
  const round = await getRoundOrThrow(groupId, roundNumber);

  const payments = await findPaymentsForRound(groupId, roundNumber);
  const paidCount = await countPaidForRound(groupId, roundNumber);
  const lateCount = payments.filter((p) => p.status === "paid_late").length;
  const amount = Number(group.contributionAmount);

  return {
    round,
    paidCount,
    totalCount: group.totalSlots,
    collected: paidCount * amount,
    pool: group.totalSlots * amount,
    lateFeesCollected: lateCount * Number(group.lateFeeAmount),
  };
}

export async function setAutoRelease(groupId: string, roundNumber: number, autoRelease: boolean): Promise<Round> {
  const round = await getRoundOrThrow(groupId, roundNumber);
  return updateRound(round.id, { autoRelease });
}

export async function releasePayout(
  groupId: string,
  roundNumber: number,
  options: { force: boolean; simulate?: boolean },
): Promise<Round> {
  const group = await findGroupById(groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");
  const round = await getRoundOrThrow(groupId, roundNumber);

  if (round.status === "paid_out") {
    throw ApiError.conflict("ROUND_ALREADY_PAID_OUT", "This round has already been released");
  }
  if (round.status === "held") {
    throw ApiError.conflict("ROUND_ON_HOLD", "This round is on hold and cannot be released");
  }

  const collection = await computeRoundCollection(groupId, roundNumber);
  if (collection.paidCount < collection.totalCount && !options.force) {
    throw ApiError.conflict("ROUND_NOT_FULLY_COLLECTED", "Not all members have paid this round yet", {
      paidCount: collection.paidCount,
      totalCount: collection.totalCount,
    });
  }

  const members = await findMembersForGroup(groupId);
  const recipient = members.find((m) => m.id === round.recipientMemberId);

  if (options.simulate && config.NODE_ENV === "production") {
    throw ApiError.forbidden("NOT_ALLOWED_IN_PRODUCTION", "Payouts cannot be simulated in production");
  }

  let gatewayTransferId: string | undefined;
  if (config.PAYMENT_GATEWAY_PROVIDER === "stripe" && !options.simulate) {
    if (!recipient?.user?.stripeConnectOnboarded || !recipient.user.stripeConnectAccountId) {
      throw ApiError.conflict(
        "RECIPIENT_PAYOUT_NOT_SET_UP",
        "The recipient hasn't finished setting up their payout account yet",
      );
    }

    // Short-lived guard against a double-release race during the Stripe API round-trip.
    // stripe.transfers.create() to a Connect Express account is synchronous — it either
    // succeeds or throws in this same call, so no webhook is needed to confirm it.
    await updateRound(round.id, { status: "payout_pending" });
    try {
      const transfer = await stripe!.transfers.create(
        {
          amount: Math.round((collection.collected + collection.lateFeesCollected) * 100),
          currency: "myr",
          destination: recipient.user.stripeConnectAccountId,
          transfer_group: `round_${round.id}`,
        },
        { idempotencyKey: `payout-${round.id}` },
      );
      gatewayTransferId = transfer.id;
    } catch (err) {
      await updateRound(round.id, {
        status: "current",
        payoutFailureReason: err instanceof Error ? err.message : String(err),
      });
      throw ApiError.badRequest("PAYOUT_TRANSFER_FAILED", "Could not send the payout to Stripe", {
        cause: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const paidOutRef = generatePayoutRef();
  const updated = await updateRound(round.id, {
    status: "paid_out",
    paidOutAt: new Date(),
    paidOutRef,
    gatewayTransferId,
  });

  const nextRoundNumber = roundNumber + 1;
  if (nextRoundNumber <= group.totalRounds) {
    await updateGroupCurrentRound(groupId, nextRoundNumber);
    const nextRound = await findRoundByNumber(groupId, nextRoundNumber);
    if (nextRound && nextRound.status === "upcoming") {
      await updateRound(nextRound.id, { status: "current" });
    }
  }

  if (recipient?.user?.phone) {
    const amount = collection.collected + collection.lateFeesCollected;
    await notify({
      phone: recipient.user.phone,
      groupId,
      template: "payout_receipt",
      payload: { roundNumber, amount, ref: paidOutRef },
      send: () =>
        whatsAppService.sendPayoutReceipt(recipient.user!.phone, {
          groupName: group.name,
          roundNumber,
          amountLabel: formatRM(amount),
          ref: paidOutRef,
        }),
    });
  }

  return updated;
}

export async function placeHold(groupId: string, roundNumber: number, reason: string, userId: string) {
  const group = await findGroupById(groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");
  const round = await getRoundOrThrow(groupId, roundNumber);

  if (round.status === "paid_out") {
    throw ApiError.conflict("ROUND_ALREADY_PAID_OUT", "Cannot hold a round that has already paid out");
  }
  if (round.status === "held") {
    throw ApiError.conflict("ROUND_ALREADY_HELD", "This round is already on hold");
  }

  const hold = await createPayoutHold({ roundId: round.id, groupId, reason, placedByUserId: userId });
  await updateRound(round.id, { status: "held" });

  const members = await findMembersForGroup(groupId);
  await Promise.all(
    members
      .filter((m) => m.user?.phone)
      .map((m) =>
        notify({
          phone: m.user!.phone,
          groupId,
          template: "payout_hold",
          payload: { roundNumber, reason },
          send: () =>
            whatsAppService.sendPayoutHold(m.user!.phone, { groupName: group.name, roundNumber, reason }),
        }),
      ),
  );

  return hold;
}

export async function releaseHoldForRound(groupId: string, roundNumber: number): Promise<Round> {
  const round = await getRoundOrThrow(groupId, roundNumber);
  const activeHold = await findActiveHoldForRound(round.id);
  if (!activeHold) {
    throw ApiError.conflict("NO_ACTIVE_HOLD", "This round is not currently on hold");
  }

  await releaseHold(activeHold.id);

  // A round can only be placed on hold while it's the group's active round, so releasing
  // the hold always restores it to "current" (never "paid_out" or "upcoming").
  return updateRound(round.id, { status: "current" });
}

export async function remindUnpaid(groupId: string): Promise<{ remindedCount: number; memberIds: string[] }> {
  const group = await findGroupById(groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");

  const round = await getRoundOrThrow(groupId, group.currentRound);
  const payments = await findPaymentsForRound(groupId, group.currentRound);
  const paidMemberIds = new Set(
    payments.filter((p) => p.status === "paid" || p.status === "paid_late").map((p) => p.memberId),
  );

  const members = await findMembersForGroup(groupId);
  const unpaidMembers = members.filter(
    (m) => m.status === "active" && m.user?.phone && !paidMemberIds.has(m.id),
  );

  await Promise.all(
    unpaidMembers.map((m) =>
      notify({
        phone: m.user!.phone,
        groupId,
        template: "payment_reminder",
        payload: { roundNumber: round.roundNumber },
        send: () =>
          whatsAppService.sendPaymentReminder(m.user!.phone, {
            groupName: group.name,
            roundNumber: round.roundNumber,
            amountLabel: formatRM(Number(group.contributionAmount)),
            dueDateLabel: round.scheduledDate.toDateString(),
          }),
      }),
    ),
  );

  return { remindedCount: unpaidMembers.length, memberIds: unpaidMembers.map((m) => m.id) };
}

export { findRoundsForGroup };
