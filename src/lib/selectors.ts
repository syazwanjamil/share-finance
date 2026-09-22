import type { GroupBundle } from "../lib/api";
import type { Member, Payment, Round, User } from "../types";

export function getGroupBundle(groups: GroupBundle[], groupId: string): GroupBundle | undefined {
  return groups.find((b) => b.group.id === groupId);
}

export function getGroupBundleBySlug(groups: GroupBundle[], slug: string): GroupBundle | undefined {
  return groups.find((b) => b.group.slug === slug);
}

export function isOrganizer(bundle: GroupBundle, userId: string): boolean {
  return bundle.group.organizerId === userId;
}

export interface MemberWithUser {
  member: Member;
  user: User | undefined;
}

export function getMembersWithUsers(bundle: GroupBundle): MemberWithUser[] {
  return bundle.members.map((member) => ({ member, user: member.user }));
}

export function getUserById(bundle: GroupBundle, userId: string): User | undefined {
  return bundle.members.find((m) => m.userId === userId)?.user;
}

export function getMemberByUserId(bundle: GroupBundle, userId: string): Member | undefined {
  return bundle.members.find((m) => m.userId === userId);
}

export function getRoundByNumber(bundle: GroupBundle, roundNumber: number): Round | undefined {
  return bundle.rounds.find((r) => r.roundNumber === roundNumber);
}

export function getCurrentRound(bundle: GroupBundle): Round | undefined {
  return getRoundByNumber(bundle, bundle.group.currentRound);
}

export function getPaymentsForRound(bundle: GroupBundle, roundNumber: number): Payment[] {
  return bundle.payments.filter((p) => p.roundNumber === roundNumber);
}

export function getPaymentForMemberRound(
  bundle: GroupBundle,
  memberId: string,
  roundNumber: number,
): Payment | undefined {
  return bundle.payments.find((p) => p.memberId === memberId && p.roundNumber === roundNumber);
}

export function getPaymentForUserRound(
  bundle: GroupBundle,
  userId: string,
  roundNumber: number,
): Payment | undefined {
  const member = getMemberByUserId(bundle, userId);
  if (!member) return undefined;
  return getPaymentForMemberRound(bundle, member.id, roundNumber);
}

export interface RoundCollection {
  round: Round;
  paidCount: number;
  totalCount: number;
  collected: number;
  pool: number;
  lateFeesCollected: number;
}

export function computeRoundCollection(bundle: GroupBundle, roundNumber: number): RoundCollection {
  const round = getRoundByNumber(bundle, roundNumber);
  const payments = getPaymentsForRound(bundle, roundNumber);
  const paidCount = payments.filter((p) => p.status === "paid" || p.status === "paid-late").length;
  const lateCount = payments.filter((p) => p.status === "paid-late").length;
  const totalCount = bundle.group.totalSlots;
  const amount = bundle.group.contributionAmount;
  return {
    round: round as Round,
    paidCount,
    totalCount,
    collected: paidCount * amount,
    pool: totalCount * amount,
    lateFeesCollected: lateCount * bundle.group.lateFeePolicy.amount,
  };
}

export function hasUserPaidCurrentRound(bundle: GroupBundle, userId: string): boolean {
  const payment = getPaymentForUserRound(bundle, userId, bundle.group.currentRound);
  return payment?.status === "paid" || payment?.status === "paid-late";
}

export interface DashboardPaymentDue {
  bundle: GroupBundle;
  round: Round;
  amount: number;
}

export interface DashboardPayoutNext {
  bundle: GroupBundle;
  round: Round;
  amount: number;
  collection: RoundCollection;
}

export function getPaymentsDue(groups: GroupBundle[], userId: string): DashboardPaymentDue[] {
  const due: DashboardPaymentDue[] = [];
  for (const bundle of groups) {
    const round = getCurrentRound(bundle);
    if (!round) continue;
    if (!hasUserPaidCurrentRound(bundle, userId)) {
      due.push({ bundle, round, amount: bundle.group.contributionAmount });
    }
  }
  return due;
}

export function getUpcomingPayouts(groups: GroupBundle[], userId: string): DashboardPayoutNext[] {
  const payouts: DashboardPayoutNext[] = [];
  for (const bundle of groups) {
    const member = getMemberByUserId(bundle, userId);
    if (!member) continue;
    const myRound = bundle.rounds.find(
      (r) => r.recipientMemberId === member.id && (r.status === "current" || r.status === "upcoming"),
    );
    if (!myRound) continue;
    payouts.push({
      bundle,
      round: myRound,
      amount: bundle.group.contributionAmount * bundle.group.totalSlots,
      collection: computeRoundCollection(bundle, myRound.roundNumber),
    });
  }
  return payouts;
}

export function computePoolSummary(bundle: GroupBundle) {
  const amount = bundle.group.contributionAmount;
  const slots = bundle.group.totalSlots;
  const rounds = bundle.group.totalRounds;
  const startDate = new Date(bundle.group.startedAt);
  const endDate = new Date(startDate);
  const monthsToAdd = bundle.group.frequency === "monthly" ? rounds - 1 : Math.ceil(((rounds - 1) * 7) / 30);
  endDate.setMonth(endDate.getMonth() + monthsToAdd);
  return {
    pool: amount * slots,
    memberCount: slots,
    contributionAmount: amount,
    rounds,
    endsAt: endDate.toISOString(),
  };
}
