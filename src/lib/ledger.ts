import type { GroupBundle, PayoutOrderChange } from "./api";
import { getMembersWithUsers, memberName } from "./selectors";
import type { PaymentStatus } from "../types";

export type LedgerKind = "contribution" | "failed" | "payout" | "order-change";

export interface LedgerEntry {
  id: string;
  groupId: string;
  kind: LedgerKind;
  at: string;
  roundNumber: number | null;
  title: string;
  detail?: string;
  reference?: string;
  /** Positive = into the pool, negative = paid out of it. */
  amount?: number;
  paymentStatus?: PaymentStatus;
}

/**
 * The shared ledger, rebuilt from the same records every member receives: contributions,
 * failed attempts, released payouts and logged payout-order changes. Nothing here is
 * organizer-only.
 */
export function buildLedger(
  bundle: GroupBundle,
  history: PayoutOrderChange[] = [],
  currentUserId?: string,
): LedgerEntry[] {
  const members = getMembersWithUsers(bundle);
  const byId = (id: string) => members.find((m) => m.member.id === id);
  const entries: LedgerEntry[] = [];
  const { group } = bundle;

  for (const payment of bundle.payments) {
    const who = memberName(byId(payment.memberId), currentUserId);
    if ((payment.status === "paid" || payment.status === "paid-late") && payment.paidAt) {
      entries.push({
        id: `pay-${payment.id}`,
        groupId: group.id,
        kind: "contribution",
        at: payment.paidAt,
        roundNumber: payment.roundNumber,
        title: `${who} paid`,
        detail: payment.status === "paid-late" ? "Paid after the due date" : undefined,
        reference: payment.ref,
        amount: group.contributionAmount,
        paymentStatus: payment.status,
      });
    } else if (payment.status === "failed" && payment.paidAt) {
      entries.push({
        id: `fail-${payment.id}`,
        groupId: group.id,
        kind: "failed",
        at: payment.paidAt,
        roundNumber: payment.roundNumber,
        title: `${who}'s payment didn't go through`,
        reference: payment.ref,
        paymentStatus: "failed",
      });
    }
  }

  for (const round of bundle.rounds) {
    if (round.status !== "paid-out" || !round.paidOutAt) continue;
    entries.push({
      id: `payout-${round.id}`,
      groupId: group.id,
      kind: "payout",
      at: round.paidOutAt,
      roundNumber: round.roundNumber,
      title: `Payout to ${memberName(byId(round.recipientMemberId), currentUserId)}`,
      reference: round.paidOutRef,
      amount: -(group.contributionAmount * group.totalSlots),
    });
  }

  for (const change of history) {
    const next = memberName(byId(change.newRecipientMemberId), currentUserId);
    const previous = memberName(byId(change.previousRecipientMemberId), currentUserId);
    entries.push({
      id: `order-${change.id}`,
      groupId: group.id,
      kind: "order-change",
      at: change.createdAt,
      roundNumber: change.roundNumber,
      title: `Payout order changed: ${next} now receives this round (was ${previous})`,
      detail: `“${change.reason}”${change.changedByName ? ` · by ${change.changedByName}` : ""}`,
    });
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/** The reason on record for the current recipient of a round, keyed to that member. */
export function reasonForRound(
  bundle: GroupBundle,
  roundId: string,
  history: PayoutOrderChange[],
): string | undefined {
  const round = bundle.rounds.find((r) => r.id === roundId);
  if (!round) return undefined;
  const logged = history
    .filter((h) => h.roundId === roundId && h.newRecipientMemberId === round.recipientMemberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (logged) return logged.reason;
  const request = round.priorityRequest;
  if (request && request.memberId === round.recipientMemberId && request.status !== "declined") {
    return request.reason;
  }
  return undefined;
}
