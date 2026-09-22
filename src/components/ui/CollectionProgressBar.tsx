import styles from "./CollectionProgressBar.module.css";

interface CollectionProgressBarProps {
  paidCount: number;
  totalCount: number;
  width?: number | string;
}

export function CollectionProgressBar({ paidCount, totalCount, width }: CollectionProgressBarProps) {
  const percent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  return (
    <div
      className={styles.track}
      style={{ width }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${paidCount} of ${totalCount} members have paid`}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
