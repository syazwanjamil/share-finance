import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import type { DashboardPaymentDue } from "../../lib/selectors";
import { formatRM } from "../../lib/currency";
import { formatDate, relativeDays } from "../../lib/date";
import styles from "./DashboardCards.module.css";

interface NextPaymentCardProps {
  due: DashboardPaymentDue;
}

export function NextPaymentCard({ due }: NextPaymentCardProps) {
  const navigate = useNavigate();
  const { state, actions } = useAppData();
  const currentUser = useCurrentUser();
  const autopay = state.autopay[due.bundle.group.id];

  return (
    <div className={`${styles.card} ${styles.paymentCard}`}>
      <span className={styles.label}>NEXT PAYMENT DUE</span>
      <div className={styles.amountRow}>
        <span className={styles.amount}>{formatRM(due.amount)}</span>
        <StatusPill variant="warning">{relativeDays(due.round.scheduledDate)}</StatusPill>
      </div>
      <span className={styles.meta}>
        {due.bundle.group.name} · round {due.round.roundNumber} of {due.bundle.group.totalRounds} · due{" "}
        {formatDate(due.round.scheduledDate)}
      </span>
      <div className={styles.actions}>
        <Button onClick={() => navigate(`/pay/${due.bundle.group.id}/${due.round.roundNumber}`)}>
          Pay {formatRM(due.amount)}
        </Button>
        <Button
          variant="ghost"
          onClick={() => actions.toggleAutopay(due.bundle.group.id)}
        >
          Autopay {autopay ? "on" : "off"}
        </Button>
      </div>
      <span className={styles.footnote}>
        {currentUser.bankAccount} · confirmed within seconds
      </span>
    </div>
  );
}
