import type { Group, Member, Payment, Round } from "../../types";

export const blokCGroup: Group = {
  id: "g-blokc",
  slug: "ibu-ibu-blok-c",
  name: "Ibu-Ibu Blok C",
  contributionAmount: 500,
  frequency: "monthly",
  totalSlots: 10,
  currentRound: 4,
  totalRounds: 10,
  trustAccountVerified: true,
  organizerId: "u-sari",
  lateFeePolicy: { amount: 20, graceDays: 3 },
  payoutOrderMethod: "assigned",
  inviteCode: "KUTU-4F2M",
  startedAt: "2026-06-25",
};

const order: { userId: string; round: number }[] = [
  { userId: "u-rina", round: 1 },
  { userId: "u-ahmad", round: 2 },
  { userId: "u-nia", round: 3 },
  { userId: "u-dewi", round: 4 },
  { userId: "u-budi", round: 5 },
  { userId: "u-sari", round: 6 },
  { userId: "u-lim", round: 7 },
  { userId: "u-eka", round: 8 },
  { userId: "u-farah", round: 9 },
  { userId: "u-zaid", round: 10 },
];

export const blokCMembers: Member[] = order.map(({ userId, round }) => ({
  id: `m-blokc-${userId}`,
  userId,
  groupId: blokCGroup.id,
  role: round === 6 ? "organizer" : "member",
  status: "active",
}));

export const blokCRounds: Round[] = order.map(({ userId, round }) => {
  const memberId = `m-blokc-${userId}`;
  if (round < 4) {
    const paidOutAt = ["2026-06-25", "2026-07-25", "2026-08-25"][round - 1];
    return {
      id: `r-blokc-${round}`,
      groupId: blokCGroup.id,
      roundNumber: round,
      recipientMemberId: memberId,
      scheduledDate: paidOutAt,
      paidOutAt,
      paidOutRef: `SF-1180-000${round}`,
      status: "paid-out",
    };
  }
  if (round === 4) {
    return {
      id: `r-blokc-4`,
      groupId: blokCGroup.id,
      roundNumber: 4,
      recipientMemberId: memberId,
      scheduledDate: "2026-09-25",
      status: "current",
      movedUpFrom: 5,
      priorityRequest: {
        memberId,
        reason: "Dewi asked for an earlier turn — school fees due this month. Budi agreed to swap on 2 Sep.",
        status: "approved",
      },
    };
  }
  const dates: Record<number, string> = {
    5: "2026-10-25",
    6: "2026-11-25",
    7: "2026-12-25",
    8: "2027-01-25",
    9: "2027-02-25",
    10: "2027-03-25",
  };
  const round7Request =
    round === 7
      ? {
          memberId,
          reason: "Renovation deposit due in November",
          status: "pending" as const,
        }
      : undefined;
  return {
    id: `r-blokc-${round}`,
    groupId: blokCGroup.id,
    roundNumber: round,
    recipientMemberId: memberId,
    scheduledDate: dates[round],
    status: "upcoming",
    priorityRequest: round7Request,
  };
});

const paidUserIdsRound4 = new Set([
  "u-rina",
  "u-ahmad",
  "u-dewi",
  "u-nia",
  "u-lim",
  "u-eka",
  "u-farah",
]);

export const blokCPayments: Payment[] = order.flatMap(({ userId }) => {
  const memberId = `m-blokc-${userId}`;
  const payments: Payment[] = [];
  for (const round of [1, 2, 3]) {
    payments.push({
      id: `p-blokc-${userId}-${round}`,
      groupId: blokCGroup.id,
      memberId,
      roundNumber: round,
      status: userId === "u-budi" && round === 3 ? "paid-late" : "paid",
      paidAt: ["2026-06-20", "2026-07-21", "2026-08-23"][round - 1],
    });
  }
  payments.push({
    id: `p-blokc-${userId}-4`,
    groupId: blokCGroup.id,
    memberId,
    roundNumber: 4,
    status: paidUserIdsRound4.has(userId) ? "paid" : "unpaid",
    paidAt: paidUserIdsRound4.has(userId) ? "2026-09-05" : undefined,
  });
  return payments;
});
