import { ArrowDownUp, Banknote } from "lucide-react";
import type { LedgerEntry } from "../../lib/ledger";
import { formatRM } from "../../lib/currency";
import { formatDate, formatMonthYearLong, formatTime } from "../../lib/date";
import { seriesClass } from "../../lib/series";
import { StatusMark } from "../ui/StatusMark";
import styles from "./LedgerList.module.css";

interface LedgerListProps {
  entries: LedgerEntry[];
  /** Group names by id, shown when the list spans several groups. */
  groupNames?: Record<string, string>;
  caption: string;
  /** Stacked rows at every width, for side columns. */
  compact?: boolean;
}

function EntryMark({ entry }: { entry: LedgerEntry }) {
  if (entry.kind === "contribution") return <StatusMark kind={entry.paymentStatus ?? "paid"} size={18} />;
  if (entry.kind === "failed") return <StatusMark kind="failed" size={18} />;
  if (entry.kind === "payout")
    return (
      <span className={styles.icon}>
        <Banknote size={18} strokeWidth={1.75} aria-hidden="true" />
        <span className="visually-hidden">Payout</span>
      </span>
    );
  return (
    <span className={styles.icon}>
      <ArrowDownUp size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="visually-hidden">Order change</span>
    </span>
  );
}

function groupByMonth(entries: LedgerEntry[]): [string, LedgerEntry[]][] {
  const months = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const key = formatMonthYearLong(entry.at);
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(entry);
  }
  return Array.from(months.entries());
}

export function LedgerList({ entries, groupNames, caption, compact }: LedgerListProps) {
  const hasRefs = entries.some((e) => !!e.reference);
  const columns = hasRefs ? 4 : 3;
  return (
    <table className={`${styles.table} ${compact ? styles.compact : ""}`}>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Entry</th>
          {hasRefs ? <th scope="col">Reference</th> : null}
          <th scope="col" className={styles.num}>
            Amount
          </th>
        </tr>
      </thead>
      {groupByMonth(entries).map(([month, rows]) => (
        <tbody key={month}>
          <tr className={styles.month}>
            <th scope="rowgroup" colSpan={columns}>
              {month}
            </th>
          </tr>
          {rows.map((entry) => (
            <tr key={entry.id} className={`${styles.row} ${styles[entry.kind]}`}>
              <td className={styles.date}>
                <div className={styles.dateInner}>
                  <span className="tabular">{formatDate(entry.at)}</span>
                  <span className={styles.time}>{formatTime(entry.at)}</span>
                </div>
              </td>
              <td className={styles.entry}>
                <div className={styles.entryInner}>
                <EntryMark entry={entry} />
                <div className={styles.entryText}>
                  <span className={styles.title}>{entry.title}</span>
                  <span className={styles.meta}>
                    {groupNames ? (
                      <span className={`${styles.group} ${seriesClass(entry.groupId)}`}>{groupNames[entry.groupId]}</span>
                    ) : null}
                    {entry.roundNumber != null ? <span>Round {entry.roundNumber}</span> : null}
                    {entry.detail ? <span>{entry.detail}</span> : null}
                  </span>
                </div>
                </div>
              </td>
              {hasRefs ? (
                <td className={styles.ref}>
                  {entry.reference ? <span className="serial">{entry.reference}</span> : <span className="visually-hidden">No reference</span>}
                </td>
              ) : null}
              <td className={`${styles.num} ${styles.amount}`}>
                {entry.amount != null ? (
                  <>
                    <span className="visually-hidden">{entry.amount >= 0 ? "Into the pot:" : "Paid out:"}</span>
                    {entry.amount >= 0 ? "+" : "−"} {formatRM(Math.abs(entry.amount))}
                  </>
                ) : (
                  <span className={styles.none}>No money moved</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
