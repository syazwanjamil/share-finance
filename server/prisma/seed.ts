import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedUser {
  mockId: string;
  name: string;
  initials: string;
  phone: string; // E.164, spaces/dashes stripped from the frontend mock's display format
  mykadVerifiedAt?: string;
  bankAccountLabel?: string;
}

const users: SeedUser[] = [
  { mockId: "u-sari", name: "Sari W.", initials: "S", phone: "+60123456789", mykadVerifiedAt: "2026-06-14", bankAccountLabel: "Maybank ···4821" },
  { mockId: "u-rina", name: "Rina H.", initials: "R", phone: "+60132014455" },
  { mockId: "u-ahmad", name: "Ahmad F.", initials: "A", phone: "+60178892201" },
  { mockId: "u-nia", name: "Nia P.", initials: "N", phone: "+60192247781" },
  { mockId: "u-dewi", name: "Dewi A.", initials: "D", phone: "+60129083312", bankAccountLabel: "Maybank ···7702" },
  { mockId: "u-budi", name: "Budi S.", initials: "B", phone: "+60167735540" },
  { mockId: "u-lim", name: "Lim K.", initials: "L", phone: "+60116649902" },
  { mockId: "u-eka", name: "Eka R.", initials: "E", phone: "+60183301187" },
  { mockId: "u-farah", name: "Farah N.", initials: "F", phone: "+60198821130" },
  { mockId: "u-zaid", name: "Zaid K.", initials: "Z", phone: "+60145562290" },
  { mockId: "u-amir", name: "Amir R.", initials: "A", phone: "+60127710043" },
  { mockId: "u-zul", name: "Zul H.", initials: "Z", phone: "+60134409021" },
  { mockId: "u-mei", name: "Mei L.", initials: "M", phone: "+60162278834" },
  { mockId: "u-hafiz", name: "Hafiz R.", initials: "H", phone: "+60179901123" },
  { mockId: "u-aina", name: "Aina S.", initials: "A", phone: "+60191156602" },
];

async function seedUsers(): Promise<Map<string, string>> {
  const idByMockId = new Map<string, string>();
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: {
        phone: u.phone,
        name: u.name,
        initials: u.initials,
        phoneVerified: true,
        mykadVerified: true,
        mykadVerifiedAt: u.mykadVerifiedAt ? new Date(u.mykadVerifiedAt) : null,
        bankAccountLabel: u.bankAccountLabel,
      },
    });
    idByMockId.set(u.mockId, user.id);
  }
  return idByMockId;
}

interface SeedRound {
  roundNumber: number;
  recipientMockId: string;
  scheduledDate: string;
  paidOutAt?: string;
  paidOutRef?: string;
  status: "paid_out" | "current" | "upcoming";
  movedUpFrom?: number;
  priorityRequest?: { memberMockId: string; reason: string; status: "pending" | "approved" };
}

interface SeedPayment {
  memberMockId: string;
  roundNumber: number;
  status: "paid" | "paid_late" | "unpaid";
  paidAt?: string;
  ref?: string;
}

interface SeedGroup {
  slug: string;
  name: string;
  contributionAmount: number;
  frequency: "monthly" | "weekly";
  totalSlots: number;
  currentRound: number;
  totalRounds: number;
  organizerMockId: string;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  inviteCode: string;
  startedAt: string;
  order: string[]; // member mockIds in round order (index 0 = round 1's recipient)
  rounds: SeedRound[];
  payments: SeedPayment[];
}

const blokCOrder = ["u-rina", "u-ahmad", "u-nia", "u-dewi", "u-budi", "u-sari", "u-lim", "u-eka", "u-farah", "u-zaid"];

const blokCFullyPaidRounds = (): SeedPayment[] => {
  const payments: SeedPayment[] = [];
  const paidAtByRound: Record<number, string> = { 1: "2026-06-20", 2: "2026-07-21", 3: "2026-08-23" };
  for (const round of [1, 2, 3]) {
    for (const memberMockId of blokCOrder) {
      payments.push({
        memberMockId,
        roundNumber: round,
        status: memberMockId === "u-budi" && round === 3 ? "paid_late" : "paid",
        paidAt: paidAtByRound[round],
      });
    }
  }
  const round4Paid = new Set(["u-rina", "u-ahmad", "u-dewi", "u-nia", "u-lim", "u-eka", "u-farah"]);
  for (const memberMockId of blokCOrder) {
    payments.push({
      memberMockId,
      roundNumber: 4,
      status: round4Paid.has(memberMockId) ? "paid" : "unpaid",
      paidAt: round4Paid.has(memberMockId) ? "2026-09-05" : undefined,
    });
  }
  return payments;
};

const blokC: SeedGroup = {
  slug: "ibu-ibu-blok-c",
  name: "Ibu-Ibu Blok C",
  contributionAmount: 500,
  frequency: "monthly",
  totalSlots: 10,
  currentRound: 4,
  totalRounds: 10,
  organizerMockId: "u-sari",
  lateFeeAmount: 20,
  lateFeeGraceDays: 3,
  inviteCode: "KUTU-4F2M",
  startedAt: "2026-06-25",
  order: blokCOrder,
  rounds: [
    { roundNumber: 1, recipientMockId: "u-rina", scheduledDate: "2026-06-25", paidOutAt: "2026-06-25", paidOutRef: "SF-1180-0001", status: "paid_out" },
    { roundNumber: 2, recipientMockId: "u-ahmad", scheduledDate: "2026-07-25", paidOutAt: "2026-07-25", paidOutRef: "SF-1180-0002", status: "paid_out" },
    { roundNumber: 3, recipientMockId: "u-nia", scheduledDate: "2026-08-25", paidOutAt: "2026-08-25", paidOutRef: "SF-1180-0003", status: "paid_out" },
    {
      roundNumber: 4,
      recipientMockId: "u-dewi",
      scheduledDate: "2026-09-25",
      status: "current",
      movedUpFrom: 5,
      priorityRequest: {
        memberMockId: "u-dewi",
        reason: "Dewi asked for an earlier turn — school fees due this month. Budi agreed to swap on 2 Sep.",
        status: "approved",
      },
    },
    { roundNumber: 5, recipientMockId: "u-budi", scheduledDate: "2026-10-25", status: "upcoming" },
    { roundNumber: 6, recipientMockId: "u-sari", scheduledDate: "2026-11-25", status: "upcoming" },
    {
      roundNumber: 7,
      recipientMockId: "u-lim",
      scheduledDate: "2026-12-25",
      status: "upcoming",
      priorityRequest: { memberMockId: "u-lim", reason: "Renovation deposit due in November", status: "pending" },
    },
    { roundNumber: 8, recipientMockId: "u-eka", scheduledDate: "2027-01-25", status: "upcoming" },
    { roundNumber: 9, recipientMockId: "u-farah", scheduledDate: "2027-02-25", status: "upcoming" },
    { roundNumber: 10, recipientMockId: "u-zaid", scheduledDate: "2027-03-25", status: "upcoming" },
  ],
  payments: blokCFullyPaidRounds(),
};

const warungOrder = ["u-amir", "u-zul", "u-mei", "u-hafiz", "u-sari", "u-aina"];

const warungPayments = (): SeedPayment[] => {
  const payments: SeedPayment[] = [];
  const paidAtByRound: Record<number, string> = {
    1: "2026-05-28",
    2: "2026-06-27",
    3: "2026-07-29",
    4: "2026-08-30",
  };
  for (const round of [1, 2, 3, 4]) {
    for (const memberMockId of warungOrder) {
      payments.push({ memberMockId, roundNumber: round, status: "paid", paidAt: paidAtByRound[round] });
    }
  }
  for (const memberMockId of warungOrder) {
    const unpaid = memberMockId === "u-hafiz";
    payments.push({
      memberMockId,
      roundNumber: 5,
      status: unpaid ? "unpaid" : "paid",
      paidAt: unpaid ? undefined : "2026-09-03",
      ref: memberMockId === "u-sari" ? "SF-2290-0041" : undefined,
    });
  }
  return payments;
};

const warungCircle: SeedGroup = {
  slug: "warung-circle",
  name: "Warung Circle",
  contributionAmount: 200,
  frequency: "monthly",
  totalSlots: 6,
  currentRound: 5,
  totalRounds: 6,
  organizerMockId: "u-amir",
  lateFeeAmount: 10,
  lateFeeGraceDays: 3,
  inviteCode: "KUTU-9W3R",
  startedAt: "2026-06-01",
  order: warungOrder,
  rounds: [
    { roundNumber: 1, recipientMockId: "u-amir", scheduledDate: "2026-06-01", paidOutAt: "2026-06-01", paidOutRef: "SF-2290-0001", status: "paid_out" },
    { roundNumber: 2, recipientMockId: "u-zul", scheduledDate: "2026-07-01", paidOutAt: "2026-07-01", paidOutRef: "SF-2290-0002", status: "paid_out" },
    { roundNumber: 3, recipientMockId: "u-mei", scheduledDate: "2026-08-01", paidOutAt: "2026-08-01", paidOutRef: "SF-2290-0003", status: "paid_out" },
    { roundNumber: 4, recipientMockId: "u-hafiz", scheduledDate: "2026-09-01", paidOutAt: "2026-09-01", paidOutRef: "SF-2290-0004", status: "paid_out" },
    { roundNumber: 5, recipientMockId: "u-sari", scheduledDate: "2026-10-01", status: "current" },
    { roundNumber: 6, recipientMockId: "u-aina", scheduledDate: "2026-11-01", status: "upcoming" },
  ],
  payments: warungPayments(),
};

async function seedGroup(group: SeedGroup, userIdByMockId: Map<string, string>): Promise<void> {
  const existing = await prisma.group.findUnique({ where: { slug: group.slug } });
  if (existing) {
    console.log(`Skipping "${group.name}" — already seeded (slug: ${group.slug})`);
    return;
  }

  const organizerUserId = userIdByMockId.get(group.organizerMockId)!;

  const created = await prisma.group.create({
    data: {
      slug: group.slug,
      name: group.name,
      contributionAmount: group.contributionAmount,
      frequency: group.frequency,
      totalSlots: group.totalSlots,
      totalRounds: group.totalRounds,
      currentRound: group.currentRound,
      trustAccountVerified: true,
      organizerId: organizerUserId,
      lateFeeAmount: group.lateFeeAmount,
      lateFeeGraceDays: group.lateFeeGraceDays,
      payoutOrderMethod: "assigned",
      inviteCode: group.inviteCode,
      startedAt: new Date(group.startedAt),
    },
  });

  const memberIdByMockId = new Map<string, string>();
  for (const memberMockId of group.order) {
    const member = await prisma.member.create({
      data: {
        groupId: created.id,
        userId: userIdByMockId.get(memberMockId)!,
        role: memberMockId === group.organizerMockId ? "organizer" : "member",
        status: "active",
        joinedAt: new Date(group.startedAt),
      },
    });
    memberIdByMockId.set(memberMockId, member.id);
  }

  const roundIdByNumber = new Map<number, string>();
  for (const round of group.rounds) {
    const created_ = await prisma.round.create({
      data: {
        groupId: created.id,
        roundNumber: round.roundNumber,
        recipientMemberId: memberIdByMockId.get(round.recipientMockId)!,
        scheduledDate: new Date(round.scheduledDate),
        status: round.status,
        paidOutAt: round.paidOutAt ? new Date(round.paidOutAt) : null,
        paidOutRef: round.paidOutRef,
        movedUpFrom: round.movedUpFrom,
      },
    });
    roundIdByNumber.set(round.roundNumber, created_.id);

    if (round.priorityRequest) {
      await prisma.priorityRequest.create({
        data: {
          roundId: created_.id,
          memberId: memberIdByMockId.get(round.priorityRequest.memberMockId)!,
          reason: round.priorityRequest.reason,
          status: round.priorityRequest.status,
          resolvedAt: round.priorityRequest.status === "approved" ? new Date() : null,
        },
      });
    }
  }

  for (const payment of group.payments) {
    const memberId = memberIdByMockId.get(payment.memberMockId)!;
    const roundId = roundIdByNumber.get(payment.roundNumber)!;
    await prisma.payment.create({
      data: {
        groupId: created.id,
        memberId,
        roundId,
        roundNumber: payment.roundNumber,
        status: payment.status,
        amount: group.contributionAmount,
        method: payment.status === "unpaid" ? null : "fpx",
        ref: payment.ref,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
      },
    });
  }

  console.log(`Seeded "${group.name}" (${group.order.length} members, ${group.rounds.length} rounds, ${group.payments.length} payments)`);
}

async function main() {
  const userIdByMockId = await seedUsers();
  console.log(`Seeded ${userIdByMockId.size} users`);

  await seedGroup(blokC, userIdByMockId);
  await seedGroup(warungCircle, userIdByMockId);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
