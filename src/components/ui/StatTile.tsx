import type { ReactNode } from "react";
import styles from "./StatTile.module.css";

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}

export function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label.toUpperCase()}</span>
      <span className={styles.value}>{value}</span>
      {sub ? <span className={styles.sub}>{sub}</span> : null}
    </div>
  );
}
