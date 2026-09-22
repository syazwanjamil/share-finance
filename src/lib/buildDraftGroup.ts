import type { GroupBundle } from "../mock/groups";
import type { Member, Round } from "../types";
import type { GroupDraft } from "../pages/groups/create/wizardTypes";

export function buildDraftGroupBundle(draft: GroupDraft, inviteCode: string, organizerUserId: string): GroupBundle {
  const groupId = `g-${Date.now()}`;
  const slug = draft.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const organizerMember: Member = {
    id: `m-${groupId}-organizer`,
    userId: organizerUserId,
    groupId,
    role: "organizer",
    status: "active",
  };
  const joinedMember: Member = {
    id: `m-${groupId}-rina`,
    userId: "u-rina",
    groupId,
    role: "member",
    status: "active",
  };
  const invitedMember: Member = {
    id: `m-${groupId}-invited-1`,
    userId: null,
    groupId,
    role: "member",
    status: "invited",
    invitedPhone: "+60 19-882 1130",
  };
  const emptySlots = Math.max(0, draft.totalSlots - 3);
  const emptyMembers: Member[] = Array.from({ length: emptySlots }, (_, i) => ({
    id: `m-${groupId}-empty-${i}`,
    userId: null,
    groupId,
    role: "member",
    status: "empty",
  }));

  const members = [organizerMember, joinedMember, invitedMember, ...emptyMembers];

  const firstPayoutDate = new Date(draft.firstPayoutDate);
  const rounds: Round[] = Array.from({ length: draft.totalSlots }, (_, i) => {
    const roundNumber = i + 1;
    const scheduled = new Date(firstPayoutDate);
    scheduled.setMonth(scheduled.getMonth() + i);
    return {
      id: `r-${groupId}-${roundNumber}`,
      groupId,
      roundNumber,
      recipientMemberId: organizerMember.id,
      scheduledDate: scheduled.toISOString(),
      status: roundNumber === 1 ? "current" : "upcoming",
    };
  });

  return {
    group: {
      id: groupId,
      slug,
      name: draft.name,
      contributionAmount: draft.contributionAmount,
      frequency: draft.frequency,
      totalSlots: draft.totalSlots,
      currentRound: 1,
      totalRounds: draft.totalSlots,
      trustAccountVerified: false,
      organizerId: organizerUserId,
      lateFeePolicy: { amount: draft.lateFeeEnabled ? 20 : 0, graceDays: 3 },
      payoutOrderMethod: draft.payoutOrderMethod,
      inviteCode,
      startedAt: firstPayoutDate.toISOString(),
    },
    members,
    rounds,
    payments: [],
  };
}
