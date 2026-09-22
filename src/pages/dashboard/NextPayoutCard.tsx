import type { DashboardPayoutNext } from "../../mock/selectors";
import { CollectionProgressBar } from "../../components/ui/CollectionProgressBar";
import { formatRM } from "../../lib/currency";
import { formatDate } from "../../lib/date";
import styles from "./DashboardCards.module.css";

interface NextPayoutCardProps {
  payout: DashboardPayoutNext;
}

export function NextPayoutCard({ payout }: NextPayoutCardProps) {
  const { collection } = payout;
  return (
    <div className={`${styles.card} ${styles.payoutCard}`}>
      <span className={styles.label}>YOUR NEXT PAYOUT</span>
      <span className={styles.amount}>{formatRM(payout.amount)}</span>
      <span className={styles.meta}>
        {payout.bundle.group.name} · round {payout.round.roundNumber} · {formatDate(payout.round.scheduledDate)}
      </span>
      <CollectionProgressBar paidCount={collection.paidCount} totalCount={collection.totalCount} />
      <span className={styles.footnote}>
        {collection.paidCount} of {collection.totalCount} members have paid this round
      </span>
    </div>
  );
}
