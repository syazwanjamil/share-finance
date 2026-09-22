import type { Group, Member, Payment, Round } from "../../types";

export const warungCircleGroup: Group = {
  id: "g-warung",
  slug: "warung-circle",
  name: "Warung Circle",
  contributionAmount: 200,
  frequency: "monthly",
  totalSlots: 6,
  currentRound: 5,
  totalRounds: 6,
  trustAccountVerified: true,
  organizerId: "u-amir",
  lateFeePolicy: { amount: 10, graceDays: 3 },
  payoutOrderMethod: "assigned",
  inviteCode: "KUTU-9W3R",
  startedAt: "2026-06-01",
};

const order: { userId: string; round: number }[] = [
  { userId: "u-amir", round: 1 },
  { userId: "u-zul", round: 2 },
  { userId: "u-mei", round: 3 },
  { userId: "u-hafiz", round: 4 },
  { userId: "u-sari", round: 5 },
  { userId: "u-aina", round: 6 },
];

export const warungCircleMembers: Member[] = order.map(({ userId, round }) => ({
  id: `m-warung-${userId}`,
  userId,
  groupId: warungCircleGroup.id,
  role: round === 1 ? "organizer" : "member",
  status: "active",
}));

export const warungCircleRounds: Round[] = order.map(({ userId, round }) => {
  const memberId = `m-warung-${userId}`;
  if (round < 5) {
    const paidOutAt = ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01"][round - 1];
    return {
      id: `r-warung-${round}`,
      groupId: warungCircleGroup.id,
      roundNumber: round,
      recipientMemberId: memberId,
      scheduledDate: paidOutAt,
      paidOutAt,
      paidOutRef: `SF-2290-000${round}`,
      status: "paid-out",
    };
  }
  if (round === 5) {
    return {
      id: `r-warung-5`,
      groupId: warungCircleGroup.id,
      roundNumber: 5,
      recipientMemberId: memberId,
      scheduledDate: "2026-10-01",
      status: "current",
    };
  }
  return {
    id: `r-warung-6`,
    groupId: warungCircleGroup.id,
    roundNumber: 6,
    recipientMemberId: memberId,
    scheduledDate: "2026-11-01",
    status: "upcoming",
  };
});

const unpaidRound5 = new Set(["u-hafiz"]);

export const warungCirclePayments: Payment[] = order.flatMap(({ userId }) => {
  const memberId = `m-warung-${userId}`;
  const payments: Payment[] = [];
  for (const round of [1, 2, 3, 4]) {
    payments.push({
      id: `p-warung-${userId}-${round}`,
      groupId: warungCircleGroup.id,
      memberId,
      roundNumber: round,
      status: "paid",
      paidAt: ["2026-05-28", "2026-06-27", "2026-07-29", "2026-08-30"][round - 1],
    });
  }
  payments.push({
    id: `p-warung-${userId}-5`,
    groupId: warungCircleGroup.id,
    memberId,
    roundNumber: 5,
    status: unpaidRound5.has(userId) ? "unpaid" : "paid",
    paidAt: unpaidRound5.has(userId) ? undefined : "2026-09-03",
    ref: userId === "u-sari" ? "SF-2290-0041" : undefined,
  });
  return payments;
});
