export type Frequency = "weekly" | "monthly";

export interface User {
  id: string;
  name: string;
  initials: string;
  phone: string;
  phoneVerified: boolean;
  mykadVerified: boolean;
  mykadVerifiedDate?: string;
  bankAccount?: string;
  stripeConnectOnboarded: boolean;
}

export type MemberStatus = "active" | "invited" | "empty";

export interface Member {
  id: string;
  userId: string | null;
  groupId: string;
  role: "organizer" | "member";
  status: MemberStatus;
  invitedPhone?: string;
  user?: User;
}

export type PayoutOrderMethod = "assigned" | "random" | "join-order";

export interface LateFeePolicy {
  amount: number;
  graceDays: number;
}

export interface Group {
  id: string;
  slug: string;
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  totalSlots: number;
  currentRound: number;
  totalRounds: number;
  trustAccountVerified: boolean;
  organizerId: string;
  lateFeePolicy: LateFeePolicy;
  payoutOrderMethod: PayoutOrderMethod;
  inviteCode: string;
  startedAt: string;
}

export type RoundStatus = "paid-out" | "current" | "upcoming" | "held";

export interface PriorityRequest {
  memberId: string;
  reason: string;
  status: "pending" | "approved" | "declined";
}

export interface Round {
  id: string;
  groupId: string;
  roundNumber: number;
  recipientMemberId: string;
  scheduledDate: string;
  paidOutAt?: string;
  paidOutRef?: string;
  status: RoundStatus;
  priorityRequest?: PriorityRequest;
  movedUpFrom?: number;
}

export type PaymentStatus = "paid" | "paid-late" | "unpaid" | "failed";

export interface Payment {
  id: string;
  groupId: string;
  memberId: string;
  roundNumber: number;
  status: PaymentStatus;
  paidAt?: string;
  method?: string;
  ref?: string;
}

export type ViewerRole = "organizer" | "member";

export interface GroupDraftInput {
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  totalSlots: number;
  firstPayoutDate: string;
  lateFeeEnabled: boolean;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  payoutOrderMethod: PayoutOrderMethod;
}
