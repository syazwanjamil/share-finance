import type { RoundStatus } from "../../types";
import styles from "./RoundProgressBar.module.css";

interface RoundProgressBarProps {
  statuses: RoundStatus[];
  currentRound: number;
  totalRounds: number;
}

export function RoundProgressBar({ statuses, currentRound, totalRounds }: RoundProgressBarProps) {
  return (
    <div
      className={styles.bar}
      role="img"
      aria-label={`Round ${currentRound} of ${totalRounds}`}
    >
      {statuses.map((status, i) => (
        <span
          key={i}
          className={`${styles.segment} ${status === "paid-out" ? styles.done : status === "current" ? styles.current : ""}`}
        />
      ))}
    </div>
  );
}
