import { useEffect, useState } from "react";
import * as api from "../lib/api";
import type { PayoutOrderChange } from "../lib/api";

interface OrderHistoryState {
  byGroup: Record<string, PayoutOrderChange[]>;
  loading: boolean;
  error: string | null;
}

/** Payout-order change log for one or more groups, as recorded by the server. */
export function useOrderHistory(groupIds: string[], refreshKey = 0): OrderHistoryState {
  const key = groupIds.join(",");
  const [state, setState] = useState<OrderHistoryState>({ byGroup: {}, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(",") : [];
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all(ids.map(async (id) => [id, await api.getPayoutOrderHistory(id)] as const))
      .then((pairs) => {
        if (!cancelled) setState({ byGroup: Object.fromEntries(pairs), loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: "Couldn't load payout-order changes." }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, refreshKey]);

  return state;
}
