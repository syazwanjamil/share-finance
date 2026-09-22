import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as api from "../lib/api";
import type { GroupBundle } from "../lib/api";
import { getGroupBundle } from "../lib/selectors";
import type { GroupDraftInput, User } from "../types";

interface AppState {
  currentUser: User | null;
  groups: GroupBundle[];
  autopay: Record<string, boolean>;
  loading: boolean;
}

const initialState: AppState = {
  currentUser: null,
  groups: [],
  autopay: {},
  loading: true,
};

interface AppDataActions {
  refresh: () => Promise<void>;
  markPaymentPaid: (groupId: string, roundNumber: number, method: "card") => Promise<void>;
  applyPayoutOrderChange: (
    groupId: string,
    changes: api.PayoutOrderChangeInput[],
    reason: string,
  ) => Promise<void>;
  releasePayout: (groupId: string, roundNumber: number) => Promise<void>;
  remindUnpaid: (groupId: string) => Promise<{ remindedCount: number }>;
  toggleAutopay: (groupId: string) => Promise<void>;
  addGroup: (input: GroupDraftInput) => Promise<GroupBundle>;
  joinGroup: (inviteCode: string) => Promise<GroupBundle>;
  logout: () => Promise<void>;
}

interface AppDataContextValue {
  state: AppState;
  actions: AppDataActions;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const refresh = useCallback(async () => {
    if (!api.isLoggedIn()) {
      setState({ currentUser: null, groups: [], autopay: {}, loading: false });
      return;
    }
    try {
      const [currentUser, groups] = await Promise.all([api.getMe(), api.getMyGroups()]);
      const autopayEntries = await Promise.all(
        groups.map(async (bundle) => [bundle.group.id, await api.getAutopay(bundle.group.id)] as const),
      );
      setState({ currentUser, groups, autopay: Object.fromEntries(autopayEntries), loading: false });
    } catch {
      api.clearTokens();
      setState({ currentUser: null, groups: [], autopay: {}, loading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const refreshGroup = useCallback(async (groupId: string) => {
    const bundle = await api.getGroup(groupId);
    setState((s) => ({
      ...s,
      groups: s.groups.some((b) => b.group.id === groupId)
        ? s.groups.map((b) => (b.group.id === groupId ? bundle : b))
        : [...s.groups, bundle],
    }));
    return bundle;
  }, []);

  const actions = useMemo<AppDataActions>(
    () => ({
      refresh,
      async markPaymentPaid(groupId, roundNumber, method) {
        const { redirectUrl, gatewayRef } = await api.initiatePayment(groupId, roundNumber, method);
        if (redirectUrl) {
          // Hands off to Stripe-hosted Checkout; confirmation happens via webhook + the
          // /pay/:groupId/:round/return page once the browser comes back.
          window.location.href = redirectUrl;
          return;
        }
        await api.confirmPayment(groupId, roundNumber, gatewayRef);
        await refreshGroup(groupId);
      },
      async applyPayoutOrderChange(groupId, changes, reason) {
        await api.reorderPayoutOrder(groupId, changes, reason);
        await refreshGroup(groupId);
      },
      async releasePayout(groupId, roundNumber) {
        await api.releaseRound(groupId, roundNumber);
        await refreshGroup(groupId);
      },
      async remindUnpaid(groupId) {
        return api.remindUnpaid(groupId);
      },
      async toggleAutopay(groupId) {
        setState((s) => {
          const next = !s.autopay[groupId];
          api.setAutopay(groupId, next).catch(() => refresh());
          return { ...s, autopay: { ...s.autopay, [groupId]: next } };
        });
      },
      async addGroup(input) {
        const bundle = await api.createGroup(input);
        setState((s) => ({ ...s, groups: [...s.groups, bundle] }));
        return bundle;
      },
      async joinGroup(inviteCode) {
        const bundle = await api.joinGroup(inviteCode);
        setState((s) => ({
          ...s,
          groups: s.groups.some((b) => b.group.id === bundle.group.id) ? s.groups : [...s.groups, bundle],
        }));
        return bundle;
      },
      async logout() {
        await api.logout();
        setState({ currentUser: null, groups: [], autopay: {}, loading: false });
      },
    }),
    [refresh, refreshGroup],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

/** Only safe to call from routes gated behind <RequireAuth>, which guarantees a loaded user. */
export function useCurrentUser(): User {
  const { state } = useAppData();
  if (!state.currentUser) throw new Error("useCurrentUser called without an authenticated user");
  return state.currentUser;
}

export function useGroupBundle(groupId: string | undefined): GroupBundle | undefined {
  const { state } = useAppData();
  if (!groupId) return undefined;
  return getGroupBundle(state.groups, groupId);
}
