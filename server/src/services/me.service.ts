import { findGroupsForUser } from "../repositories/group.repository.js";
import { computeRoundCollection } from "./round.service.js";
import type { GroupBundle } from "../repositories/group.repository.js";

export interface DashboardPaymentDue {
  group: GroupBundle["group"];
  roundNumber: number;
  scheduledDate: Date;
  amount: number;
}

export interface DashboardPayoutNext {
  group: GroupBundle["group"];
  roundNumber: number;
  scheduledDate: Date;
  amount: number;
  collection: Awaited<ReturnType<typeof computeRoundCollection>>;
}

function hasUserPaidCurrentRound(bundle: GroupBundle, userId: string): boolean {
  const member = bundle.members.find((m) => m.userId === userId);
  if (!member) return false;
  const payment = bundle.payments.find(
    (p) => p.memberId === member.id && p.roundNumber === bundle.group.currentRound,
  );
  return payment?.status === "paid" || payment?.status === "paid_late";
}

export async function getDashboard(userId: string): Promise<{
  paymentsDue: DashboardPaymentDue[];
  upcomingPayouts: DashboardPayoutNext[];
}> {
  const bundles = await findGroupsForUser(userId);

  const paymentsDue: DashboardPaymentDue[] = [];
  const upcomingPayouts: DashboardPayoutNext[] = [];

  for (const bundle of bundles) {
    const currentRound = bundle.rounds.find((r) => r.roundNumber === bundle.group.currentRound);

    if (currentRound && !hasUserPaidCurrentRound(bundle, userId)) {
      paymentsDue.push({
        group: bundle.group,
        roundNumber: currentRound.roundNumber,
        scheduledDate: currentRound.scheduledDate,
        amount: Number(bundle.group.contributionAmount),
      });
    }

    const member = bundle.members.find((m) => m.userId === userId);
    if (member) {
      const myRound = bundle.rounds.find(
        (r) => r.recipientMemberId === member.id && (r.status === "current" || r.status === "upcoming"),
      );
      if (myRound) {
        const collection = await computeRoundCollection(bundle.group.id, myRound.roundNumber);
        upcomingPayouts.push({
          group: bundle.group,
          roundNumber: myRound.roundNumber,
          scheduledDate: myRound.scheduledDate,
          amount: Number(bundle.group.contributionAmount) * bundle.group.totalSlots,
          collection,
        });
      }
    }
  }

  return { paymentsDue, upcomingPayouts };
}
