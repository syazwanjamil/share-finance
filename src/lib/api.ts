import type { Frequency, Group, GroupDraftInput, Member, Payment, PayoutOrderMethod, Round, User } from "../types";

export class ApiRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  return fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await rawFetch("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return false;
        const data = (await parseJson(response)) as { accessToken: string; refreshToken: string };
        storeTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function throwApiError(response: Response): Promise<never> {
  const data = (await parseJson(response).catch(() => null)) as { error?: { code: string; message: string } } | null;
  const error = data?.error;
  throw new ApiRequestError(error?.code ?? "UNKNOWN_ERROR", error?.message ?? "Something went wrong. Please try again.");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await rawFetch(path, options);
  if (!response.ok) return throwApiError(response);
  return (await parseJson(response)) as T;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new ApiRequestError("UNAUTHENTICATED", "You're not logged in.");

  let response = await rawFetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await rawFetch(path, {
        ...options,
        headers: { Authorization: `Bearer ${getAccessToken()}`, ...options.headers },
      });
    } else {
      clearTokens();
    }
  }

  if (!response.ok) return throwApiError(response);
  return (await parseJson(response)) as T;
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return authFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}
function patch<T>(path: string, body: unknown): Promise<T> {
  return authFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
function put<T>(path: string, body: unknown): Promise<T> {
  return authFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}
function get<T>(path: string): Promise<T> {
  return authFetch<T>(path);
}

// ---- OTP (unauthenticated) ----

export function toE164(localNumber: string): string {
  return `+60${localNumber.replace(/\D/g, "")}`;
}

interface RequestOtpResponse {
  phone: string;
  expiresInSeconds: number;
  debugCode?: string;
}

export function requestOtp(phone: string): Promise<RequestOtpResponse> {
  return apiFetch<RequestOtpResponse>("/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }) });
}

interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: RawUser;
}

export async function verifyOtp(phone: string, code: string): Promise<{ user: User }> {
  const result = await apiFetch<VerifyOtpResponse>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  storeTokens(result.accessToken, result.refreshToken);
  return { user: normalizeUser(result.user) };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await post("/auth/logout", refreshToken ? { refreshToken } : undefined);
  } catch {
    // best-effort; clear tokens regardless
  } finally {
    clearTokens();
  }
}

// ---- Raw backend shapes ----

interface RawUser {
  id: string;
  phone: string;
  name: string | null;
  initials: string | null;
  phoneVerified: boolean;
  mykadVerified: boolean;
  mykadVerifiedAt: string | null;
  bankAccountLabel: string | null;
  stripeConnectOnboarded: boolean;
}

interface RawMember {
  id: string;
  groupId: string;
  userId: string | null;
  role: "organizer" | "member";
  status: "active" | "invited" | "empty";
  invitedPhone: string | null;
  user: RawUser | null;
}

interface RawPriorityRequest {
  memberId: string;
  reason: string;
  status: "pending" | "approved" | "declined";
}

interface RawRound {
  id: string;
  groupId: string;
  roundNumber: number;
  recipientMemberId: string;
  scheduledDate: string;
  status: "upcoming" | "current" | "held" | "paid_out";
  paidOutAt: string | null;
  paidOutRef: string | null;
  movedUpFrom: number | null;
  priorityRequest: RawPriorityRequest | null;
}

interface RawPayment {
  id: string;
  groupId: string;
  memberId: string;
  roundNumber: number;
  status: "unpaid" | "paid" | "paid_late" | "failed";
  method: "fpx" | "ewallet" | "qr" | null;
  ref: string | null;
  paidAt: string | null;
}

interface RawGroup {
  id: string;
  slug: string;
  name: string;
  contributionAmount: string | number;
  frequency: Frequency;
  totalSlots: number;
  totalRounds: number;
  currentRound: number;
  trustAccountVerified: boolean;
  organizerId: string;
  lateFeeAmount: string | number;
  lateFeeGraceDays: number;
  payoutOrderMethod: "assigned" | "random" | "join_order";
  inviteCode: string;
  startedAt: string;
}

interface RawGroupBundle {
  group: RawGroup;
  members: RawMember[];
  rounds: RawRound[];
  payments: RawPayment[];
}

export interface GroupBundle {
  group: Group;
  members: Member[];
  rounds: Round[];
  payments: Payment[];
}

// ---- Normalization: backend Prisma shapes -> frontend display shapes ----

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .filter((w) => /[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function normalizeUser(raw: RawUser): User {
  const name = raw.name ?? "";
  return {
    id: raw.id,
    name,
    initials: raw.initials ?? (name ? initialsFromName(name) : "?"),
    phone: raw.phone,
    phoneVerified: raw.phoneVerified,
    mykadVerified: raw.mykadVerified,
    mykadVerifiedDate: raw.mykadVerifiedAt ?? undefined,
    bankAccount: raw.bankAccountLabel ?? undefined,
    stripeConnectOnboarded: raw.stripeConnectOnboarded,
  };
}

function normalizeMember(raw: RawMember): Member {
  return {
    id: raw.id,
    userId: raw.userId,
    groupId: raw.groupId,
    role: raw.role,
    status: raw.status,
    invitedPhone: raw.invitedPhone ?? undefined,
    user: raw.user ? normalizeUser(raw.user) : undefined,
  };
}

function normalizePayoutOrderMethod(value: "assigned" | "random" | "join_order"): PayoutOrderMethod {
  return value === "join_order" ? "join-order" : value;
}

function normalizeRoundStatus(value: RawRound["status"]): Round["status"] {
  return value === "paid_out" ? "paid-out" : value;
}

function normalizeRound(raw: RawRound): Round {
  return {
    id: raw.id,
    groupId: raw.groupId,
    roundNumber: raw.roundNumber,
    recipientMemberId: raw.recipientMemberId,
    scheduledDate: raw.scheduledDate,
    paidOutAt: raw.paidOutAt ?? undefined,
    paidOutRef: raw.paidOutRef ?? undefined,
    status: normalizeRoundStatus(raw.status),
    priorityRequest: raw.priorityRequest ?? undefined,
    movedUpFrom: raw.movedUpFrom ?? undefined,
  };
}

function normalizePayment(raw: RawPayment): Payment {
  return {
    id: raw.id,
    groupId: raw.groupId,
    memberId: raw.memberId,
    roundNumber: raw.roundNumber,
    status: raw.status === "paid_late" ? "paid-late" : raw.status,
    paidAt: raw.paidAt ?? undefined,
    method: raw.method ?? undefined,
    ref: raw.ref ?? undefined,
  };
}

function normalizeGroup(raw: RawGroup): Group {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    contributionAmount: Number(raw.contributionAmount),
    frequency: raw.frequency,
    totalSlots: raw.totalSlots,
    currentRound: raw.currentRound,
    totalRounds: raw.totalRounds,
    trustAccountVerified: raw.trustAccountVerified,
    organizerId: raw.organizerId,
    lateFeePolicy: { amount: Number(raw.lateFeeAmount), graceDays: raw.lateFeeGraceDays },
    payoutOrderMethod: normalizePayoutOrderMethod(raw.payoutOrderMethod),
    inviteCode: raw.inviteCode,
    startedAt: raw.startedAt,
  };
}

function normalizeGroupBundle(raw: RawGroupBundle): GroupBundle {
  return {
    group: normalizeGroup(raw.group),
    members: raw.members.map(normalizeMember),
    rounds: raw.rounds.map(normalizeRound),
    payments: raw.payments.map(normalizePayment),
  };
}

// ---- /me ----

export async function getMe(): Promise<User> {
  return normalizeUser(await get<RawUser>("/me"));
}

export async function updateMe(patchBody: { name?: string; bankAccountLabel?: string }): Promise<User> {
  return normalizeUser(await patch<RawUser>("/me", patchBody));
}

export async function getMyGroups(): Promise<GroupBundle[]> {
  const raw = await get<RawGroupBundle[]>("/me/groups");
  return raw.map(normalizeGroupBundle);
}

// ---- Groups ----

export async function createGroup(input: GroupDraftInput): Promise<GroupBundle> {
  const raw = await post<RawGroupBundle>("/groups", input);
  return normalizeGroupBundle(raw);
}

export async function joinGroup(inviteCode: string): Promise<GroupBundle> {
  const raw = await post<RawGroupBundle>("/groups/join", { inviteCode });
  return normalizeGroupBundle(raw);
}

export async function getGroup(groupId: string): Promise<GroupBundle> {
  const raw = await get<RawGroupBundle>(`/groups/${groupId}`);
  return normalizeGroupBundle(raw);
}

export async function remindUnpaid(groupId: string): Promise<{ remindedCount: number }> {
  return post(`/groups/${groupId}/remind-unpaid`);
}

// ---- Members ----

export async function inviteMember(groupId: string, phone: string): Promise<Member> {
  return normalizeMember(await post<RawMember>(`/groups/${groupId}/members/invite`, { phone }));
}

// ---- Rounds / payouts ----

export async function releaseRound(groupId: string, roundNumber: number, force = false): Promise<Round> {
  return normalizeRound(await post<RawRound>(`/groups/${groupId}/rounds/${roundNumber}/release`, { force }));
}

export async function holdRound(groupId: string, roundNumber: number, reason: string): Promise<void> {
  await post(`/groups/${groupId}/rounds/${roundNumber}/hold`, { reason });
}

// ---- Payments ----

export async function initiatePayment(
  groupId: string,
  roundNumber: number,
  method: "card",
): Promise<{ paymentId: string; gatewayRef: string; redirectUrl: string | null }> {
  return post(`/groups/${groupId}/rounds/${roundNumber}/payments`, { method });
}

export async function confirmPayment(groupId: string, roundNumber: number, gatewayRef: string): Promise<Payment> {
  return normalizePayment(
    await post<RawPayment>(`/groups/${groupId}/rounds/${roundNumber}/payments/confirm`, { gatewayRef }),
  );
}

// ---- Stripe Connect payout onboarding ----

export async function getConnectStatus(): Promise<{ onboarded: boolean; accountId: string | null }> {
  return get("/connect/status");
}

export async function createConnectOnboardingLink(): Promise<{ url: string }> {
  return post("/connect/onboarding-link");
}

// ---- Payout order ----

export interface PayoutOrderChangeInput {
  roundNumber: number;
  newRecipientMemberId: string;
}

export async function reorderPayoutOrder(
  groupId: string,
  changes: PayoutOrderChangeInput[],
  reason: string,
): Promise<void> {
  await post(`/groups/${groupId}/payout-order/reorder`, { changes, reason });
}

// ---- Autopay ----

export async function getAutopay(groupId: string): Promise<boolean> {
  const result = await get<{ enabled: boolean }>(`/groups/${groupId}/autopay`);
  return result.enabled;
}

export async function setAutopay(groupId: string, enabled: boolean): Promise<boolean> {
  const result = await put<{ enabled: boolean }>(`/groups/${groupId}/autopay`, { enabled });
  return result.enabled;
}
