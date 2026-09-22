import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { GroupBundle } from "../mock/groups";
import { initialGroupBundles } from "../mock/groups";
import { currentUser } from "../mock/users";
import type { User } from "../types";
import { getGroupBundle, getMemberByUserId } from "../mock/selectors";

interface AppState {
  currentUser: User;
  groups: GroupBundle[];
  autopay: Record<string, boolean>;
}

const initialState: AppState = {
  currentUser,
  groups: initialGroupBundles,
  autopay: {},
};

type PayoutOrderChange = { roundNumber: number; newRecipientMemberId: string; reason: string };

type Action =
  | { type: "MARK_PAYMENT_PAID"; groupId: string; userId: string; roundNumber: number; method: string }
  | { type: "APPLY_PAYOUT_ORDER_CHANGE"; groupId: string; changes: PayoutOrderChange[]; reason: string }
  | { type: "RELEASE_PAYOUT"; groupId: string; roundNumber: number }
  | { type: "TOGGLE_AUTOPAY"; groupId: string }
  | { type: "ADD_GROUP"; bundle: GroupBundle };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "MARK_PAYMENT_PAID": {
      const bundle = getGroupBundle(state.groups, action.groupId);
      const member = bundle && getMemberByUserId(bundle, action.userId);
      if (!bundle || !member) return state;
      const ref = `SF-${action.groupId.slice(-4).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const groups = state.groups.map((b) => {
        if (b.group.id !== action.groupId) return b;
        const existing = b.payments.find(
          (p) => p.memberId === member.id && p.roundNumber === action.roundNumber,
        );
        const payments = existing
          ? b.payments.map((p) =>
              p.id === existing.id
                ? { ...p, status: "paid" as const, paidAt: new Date().toISOString(), method: action.method, ref }
                : p,
            )
          : [
              ...b.payments,
              {
                id: `p-${b.group.id}-${action.userId}-${action.roundNumber}`,
                groupId: b.group.id,
                memberId: member.id,
                roundNumber: action.roundNumber,
                status: "paid" as const,
                paidAt: new Date().toISOString(),
                method: action.method,
                ref,
              },
            ];
        return { ...b, payments };
      });
      return { ...state, groups };
    }
    case "APPLY_PAYOUT_ORDER_CHANGE": {
      const groups = state.groups.map((b) => {
        if (b.group.id !== action.groupId) return b;
        const rounds = b.rounds.map((r) => {
          const change = action.changes.find((c) => c.roundNumber === r.roundNumber);
          if (!change) return r;
          return {
            ...r,
            recipientMemberId: change.newRecipientMemberId,
            priorityRequest: {
              memberId: change.newRecipientMemberId,
              reason: action.reason,
              status: "approved" as const,
            },
          };
        });
        return { ...b, rounds };
      });
      return { ...state, groups };
    }
    case "RELEASE_PAYOUT": {
      const groups = state.groups.map((b) => {
        if (b.group.id !== action.groupId) return b;
        const rounds = b.rounds.map((r) =>
          r.roundNumber === action.roundNumber
            ? { ...r, status: "paid-out" as const, paidOutAt: new Date().toISOString(), paidOutRef: `SF-PO-${Math.floor(Math.random() * 9000 + 1000)}` }
            : r,
        );
        const nextRoundNumber = action.roundNumber + 1;
        const group =
          nextRoundNumber <= b.group.totalRounds ? { ...b.group, currentRound: nextRoundNumber } : b.group;
        const roundsWithNextCurrent = rounds.map((r) =>
          r.roundNumber === nextRoundNumber ? { ...r, status: "current" as const } : r,
        );
        return { ...b, group, rounds: roundsWithNextCurrent };
      });
      return { ...state, groups };
    }
    case "TOGGLE_AUTOPAY": {
      return { ...state, autopay: { ...state.autopay, [action.groupId]: !state.autopay[action.groupId] } };
    }
    case "ADD_GROUP": {
      return { ...state, groups: [...state.groups, action.bundle] };
    }
    default:
      return state;
  }
}

interface AppDataContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function useGroupBundle(groupId: string | undefined): GroupBundle | undefined {
  const { state } = useAppData();
  if (!groupId) return undefined;
  return getGroupBundle(state.groups, groupId);
}
