import { useMemo, useState } from "react";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { useOrderHistory } from "../../state/useOrderHistory";
import { buildLedger } from "../../lib/ledger";
import { seriesClass } from "../../lib/series";
import { formatRM } from "../../lib/currency";
import { LedgerList } from "../../components/ledger/LedgerList";
import { EmptyState, PageHeader } from "../../components/layout/Page";
import { FormError } from "../../components/ui/Field";
import { LoadingScreen } from "../../components/layout/LoadingScreen";
import styles from "./LedgerPage.module.css";

export function LedgerPage() {
  const { state } = useAppData();
  const currentUser = useCurrentUser();
  const ids = state.groups.map((b) => b.group.id);
  const history = useOrderHistory(ids);
  const [filter, setFilter] = useState<string>("all");

  const groupNames = useMemo(
    () => Object.fromEntries(state.groups.map((b) => [b.group.id, b.group.name])),
    [state.groups],
  );

  const entries = useMemo(() => {
    const bundles = filter === "all" ? state.groups : state.groups.filter((b) => b.group.id === filter);
    return bundles
      .flatMap((b) => buildLedger(b, history.byGroup[b.group.id] ?? [], currentUser.id))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [state.groups, history.byGroup, filter, currentUser.id]);

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const e of entries) {
      if (e.amount == null) continue;
      if (e.amount >= 0) inflow += e.amount;
      else outflow += -e.amount;
    }
    return { inflow, outflow };
  }, [entries]);

  if (state.groups.length === 0) {
    return (
      <>
        <PageHeader title="Ledger" />
        <EmptyState title="No groups yet">Join or start a group and every ringgit it moves is recorded here.</EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Ledger"
        lead="Every contribution, payout and payout-order change, exactly as every member of the group sees it."
      />

      <div className={styles.filters} role="group" aria-label="Show ledger for">
        <button
          type="button"
          className={`${styles.filter} ${filter === "all" ? styles.on : ""}`}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All groups
        </button>
        {state.groups.map(({ group }) => (
          <button
            key={group.id}
            type="button"
            className={`${styles.filter} ${filter === group.id ? styles.on : ""} ${seriesClass(group.id)}`}
            aria-pressed={filter === group.id}
            onClick={() => setFilter(group.id)}
          >
            <span className={styles.swatch} aria-hidden="true" />
            {group.name}
          </button>
        ))}
      </div>

      <p className={styles.statement}>
        In these records, <strong className="tabular">{formatRM(totals.inflow)}</strong> was paid into pots and{" "}
        <strong className="tabular">{formatRM(totals.outflow)}</strong> was paid out to members.
      </p>

      {history.error ? <FormError>{history.error} Contributions and payouts are still complete.</FormError> : null}

      {history.loading && entries.length === 0 ? (
        <LoadingScreen label="Loading the ledger…" />
      ) : entries.length > 0 ? (
        <LedgerList entries={entries} groupNames={filter === "all" ? groupNames : undefined} caption="Ledger" />
      ) : (
        <EmptyState title="Nothing recorded yet">Entries appear as members pay and payouts are released.</EmptyState>
      )}
    </>
  );
}
