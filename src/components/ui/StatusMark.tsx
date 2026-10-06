import type { PaymentStatus } from "../../types";
import styles from "./StatusMark.module.css";

export type MarkKind = PaymentStatus | "upcoming" | "done" | "waiting" | "blocked";

const LABELS: Record<MarkKind, string> = {
  paid: "Paid",
  "paid-late": "Paid late",
  unpaid: "Unpaid",
  failed: "Payment failed",
  upcoming: "Not due yet",
  done: "Done",
  waiting: "Waiting",
  blocked: "Not ready",
};

interface StatusMarkProps {
  kind: MarkKind;
  size?: number;
  /** Visible label beside the mark. Without it, the label is still announced. */
  showLabel?: boolean;
  label?: string;
}

/**
 * Status is carried by the mark's form, not only its colour: a filled seal for paid, a
 * half-filled seal for late, an open ring for unpaid, a struck ring for failed.
 */
export function StatusMark({ kind, size = 16, showLabel = false, label }: StatusMarkProps) {
  const text = label ?? LABELS[kind];
  return (
    <span className={`${styles.mark} ${styles[kind]}`}>
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        {(kind === "paid" || kind === "done") && (
          <>
            <circle cx="8" cy="8" r="7" className={styles.fill} />
            <path d="M4.8 8.3 7 10.4l4.2-4.6" className={styles.check} />
          </>
        )}
        {kind === "paid-late" && (
          <>
            <circle cx="8" cy="8" r="6.25" className={styles.ring} />
            <path d="M8 1.75a6.25 6.25 0 0 0 0 12.5Z" className={styles.fill} />
          </>
        )}
        {(kind === "unpaid" || kind === "waiting") && <circle cx="8" cy="8" r="6.25" className={styles.ring} />}
        {(kind === "failed" || kind === "blocked") && (
          <>
            <circle cx="8" cy="8" r="6.25" className={styles.ring} />
            <path d="M3.6 12.4 12.4 3.6" className={styles.strike} />
          </>
        )}
        {kind === "upcoming" && <circle cx="8" cy="8" r="2" className={styles.fill} />}
      </svg>
      {showLabel ? <span className={styles.label}>{text}</span> : <span className="visually-hidden">{text}</span>}
    </span>
  );
}
