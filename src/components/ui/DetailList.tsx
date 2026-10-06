import type { ReactNode } from "react";
import styles from "./DetailList.module.css";

export interface DetailItem {
  term: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
}

/** Key/value rows for receipts and breakdowns. */
export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className={styles.list}>
      {items.map((item, i) => (
        <div key={i} className={`${styles.row} ${item.emphasis ? styles.emphasis : ""}`}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
