import { ApiError } from "../lib/ApiError.js";
import { generatePaymentRef } from "../lib/reference.js";
import { formatRM } from "../lib/currency.js";
import { findGroupById } from "../repositories/group.repository.js";
import {
  findMemberByGroupAndUser,
  findMembersForGroup,
  findMemberWithUserById,
} from "../repositories/member.repository.js";
import { findRoundByNumber } from "../repositories/round.repository.js";
import {
  findPaymentByGatewaySessionId,
  findPaymentForMemberRound,
  upsertPayment,
} from "../repositories/payment.repository.js";
import { createExtensionRequest } from "../repositories/extension.repository.js";
import { findAutopay, setAutopay as setAutopayRepo } from "../repositories/autopay.repository.js";
import { config } from "../config/env.js";
import { paymentGatewayService } from "./payment-gateway/index.js";
import { notify, whatsAppService } from "./notification/notify.js";
import type { GatewayPaymentMethod } from "./payment-gateway/PaymentGatewayService.js";
import type { Group, Member, Payment, Round } from "@prisma/client";

async function requireGroupRoundMember(groupId: string, roundNumber: number, userId: string) {
  const group = await findGroupById(groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");

  const round = await findRoundByNumber(groupId, roundNumber);
  if (!round) throw ApiError.notFound("ROUND_NOT_FOUND", "Round not found");

  const member = await findMemberByGroupAndUser(groupId, userId);
  if (!member) throw ApiError.forbidden("NOT_A_MEMBER", "You are not a member of this group");

  return { group, round, member };
}

export interface InitiatePaymentResult {
  paymentId: string;
  gatewayRef: string;
  redirectUrl: string | null;
}

export async function initiatePayment(
  groupId: string,
  roundNumber: number,
  userId: string,
  method: GatewayPaymentMethod,
): Promise<InitiatePaymentResult> {
  const { group, round, member } = await requireGroupRoundMember(groupId, roundNumber, userId);

  if (round.status === "paid_out") {
    throw ApiError.conflict("ROUND_ALREADY_PAID_OUT", "This round has already paid out");
  }

  const existing = await findPaymentForMemberRound(member.id, roundNumber);
  if (existing?.status === "paid" || existing?.status === "paid_late") {
    throw ApiError.conflict("ALREADY_PAID", "This round is already paid");
  }

  const amount = Number(group.contributionAmount);
  const reference = generatePaymentRef(groupId);
  const { gatewayRef, redirectUrl } = await paymentGatewayService.initiate({
    amount,
    method,
    reference,
    groupId,
    roundNumber,
    memberId: member.id,
  });

  const payment = await upsertPayment({
    groupId,
    memberId: member.id,
    roundId: round.id,
    roundNumber,
    amount,
    method,
    status: "unpaid",
    gatewayProvider: config.PAYMENT_GATEWAY_PROVIDER,
    gatewaySessionId: gatewayRef,
  });

  return { paymentId: payment.id, gatewayRef, redirectUrl };
}

/**
 * Marks a Payment as successfully paid: computes the late fee, upserts the row, and sends
 * the WhatsApp receipt. Shared by the simulated synchronous path and the Stripe webhook path.
 */
async function applySuccessfulPayment(
  group: Group,
  round: Round,
  member: Member,
  paymentIntentId?: string,
): Promise<Payment> {
  const isLate = new Date() > new Date(round.scheduledDate.getTime() + group.lateFeeGraceDays * 86_400_000);
  const lateFeeApplied = isLate ? Number(group.lateFeeAmount) : 0;
  const ref = generatePaymentRef(group.id);

  const payment = await upsertPayment({
    groupId: group.id,
    memberId: member.id,
    roundId: round.id,
    roundNumber: round.roundNumber,
    amount: Number(group.contributionAmount),
    status: isLate ? "paid_late" : "paid",
    paidAt: new Date(),
    lateFeeApplied,
    ref,
    gatewayPaymentIntentId: paymentIntentId ?? undefined,
  });

  const memberWithUser = await findMemberWithUserById(member.id);
  if (memberWithUser?.user?.phone) {
    const amount = Number(payment.amount) + lateFeeApplied;
    const phone = memberWithUser.user.phone;
    await notify({
      phone,
      groupId: group.id,
      template: "payment_receipt",
      payload: { roundNumber: round.roundNumber, amount, ref },
      send: () =>
        whatsAppService.sendPaymentReceipt(phone, {
          groupName: group.name,
          roundNumber: round.roundNumber,
          amountLabel: formatRM(amount),
          ref,
        }),
    });
  }

  return payment;
}

export type FinalizePaymentOutcome =
  | { success: true; paymentIntentId?: string }
  | { success: false; failureReason: string };

/** Called from the Stripe webhook handler — the authoritative source of payment-in confirmation. */
export async function finalizePaymentFromWebhook(
  gatewaySessionId: string,
  outcome: FinalizePaymentOutcome,
): Promise<Payment> {
  const payment = await findPaymentByGatewaySessionId(gatewaySessionId);
  if (!payment) {
    throw ApiError.notFound("PAYMENT_NOT_FOUND", `No payment found for gateway session ${gatewaySessionId}`);
  }

  if (payment.status === "paid" || payment.status === "paid_late") {
    return payment; // already applied — idempotent no-op (e.g. webhook retried)
  }

  if (!outcome.success) {
    return upsertPayment({
      groupId: payment.groupId,
      memberId: payment.memberId,
      roundId: payment.roundId,
      roundNumber: payment.roundNumber,
      amount: Number(payment.amount),
      status: "failed",
      gatewayFailureReason: outcome.failureReason,
    });
  }

  const group = await findGroupById(payment.groupId);
  if (!group) throw ApiError.notFound("GROUP_NOT_FOUND", "Group not found");
  const round = await findRoundByNumber(payment.groupId, payment.roundNumber);
  if (!round) throw ApiError.notFound("ROUND_NOT_FOUND", "Round not found");
  const member = await findMemberWithUserById(payment.memberId);
  if (!member) throw ApiError.notFound("MEMBER_NOT_FOUND", "Member not found");

  return applySuccessfulPayment(group, round, member, outcome.paymentIntentId);
}

export async function confirmPayment(
  groupId: string,
  roundNumber: number,
  userId: string,
  gatewayRef: string,
): Promise<Payment> {
  const { group, round, member } = await requireGroupRoundMember(groupId, roundNumber, userId);

  const existing = await findPaymentForMemberRound(member.id, roundNumber);
  if (existing?.status === "paid" || existing?.status === "paid_late") {
    return existing; // webhook already landed — this is now just a status read-through
  }

  const result = await paymentGatewayService.lookup(gatewayRef);

  if (result.status === "pending") {
    if (existing) return existing;
    throw ApiError.badRequest("PAYMENT_PENDING", "Payment has not been confirmed yet");
  }

  if (result.status === "failed") {
    const failed = await upsertPayment({
      groupId,
      memberId: member.id,
      roundId: round.id,
      roundNumber,
      amount: Number(group.contributionAmount),
      status: "failed",
      gatewayFailureReason: result.failureReason,
    });
    throw ApiError.badRequest("PAYMENT_FAILED", result.failureReason ?? "Payment could not be confirmed", {
      payment: failed,
    });
  }

  return applySuccessfulPayment(group, round, member, result.paymentIntentId);
}

export async function requestExtension(
  groupId: string,
  roundNumber: number,
  userId: string,
  reason: string,
) {
  const { group, round, member } = await requireGroupRoundMember(groupId, roundNumber, userId);
  const payment = await findPaymentForMemberRound(member.id, roundNumber);

  const request = await createExtensionRequest({
    groupId,
    roundId: round.id,
    memberId: member.id,
    paymentId: payment?.id,
    reason,
    requestedByUserId: userId,
  });

  const members = await findMembersForGroup(groupId);
  const organizer = members.find((m) => m.role === "organizer");
  const requestingMember = members.find((m) => m.id === member.id);
  if (organizer?.user?.phone) {
    const organizerPhone = organizer.user.phone;
    await notify({
      phone: organizerPhone,
      groupId,
      template: "extension_request",
      payload: { roundNumber, reason },
      send: () =>
        whatsAppService.sendExtensionRequest(organizerPhone, {
          groupName: group.name,
          roundNumber,
          memberName: requestingMember?.user?.name ?? "A member",
          reason,
        }),
    });
  }

  return request;
}

export async function getAutopay(groupId: string, userId: string): Promise<boolean> {
  const autopay = await findAutopay(userId, groupId);
  return autopay?.enabled ?? false;
}

export async function setAutopay(groupId: string, userId: string, enabled: boolean): Promise<boolean> {
  const autopay = await setAutopayRepo(userId, groupId, enabled);
  return autopay.enabled;
}
