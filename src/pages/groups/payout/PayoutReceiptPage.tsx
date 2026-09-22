import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGroupBundle } from "../../../state/AppDataContext";
import { getRoundByNumber } from "../../../mock/selectors";
import { Button } from "../../../components/ui/Button";
import { formatRM } from "../../../lib/currency";
import { formatDateFull } from "../../../lib/date";
import styles from "../../checkout/CheckoutLayout.module.css";

interface ReceiptState {
  amount: number;
  recipientName?: string;
  roundNumber: number;
}

export function PayoutReceiptPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bundle = useGroupBundle(groupId);
  const receiptState = location.state as ReceiptState | null;
  const valid = !!bundle && !!receiptState;

  useEffect(() => {
    if (!valid) navigate(`/groups/${groupId}`);
  }, [valid, navigate, groupId]);

  if (!bundle || !receiptState) {
    return null;
  }

  const round = getRoundByNumber(bundle, receiptState.roundNumber);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.center}>
          <span className={styles.successIcon}>✓</span>
          <div>
            <div className={styles.title}>Payout sent</div>
            <span style={{ fontSize: 11.5, color: "var(--text)" }}>
              {formatDateFull(new Date().toISOString())} · round {receiptState.roundNumber} of{" "}
              {bundle.group.totalRounds}
            </span>
          </div>
          <span className={styles.bigAmount}>{formatRM(receiptState.amount)}</span>
        </div>

        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span>To</span>
            <span>{receiptState.recipientName}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Reference</span>
            <span>{round?.paidOutRef}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Released by</span>
            <span>Automatic (scheduled)</span>
          </div>
          <div className={styles.detailRow}>
            <span>Arrives</span>
            <span>Within 15 minutes</span>
          </div>
        </div>

        <div className={styles.tip}>
          Receipt posted to the {bundle.group.name} WhatsApp group and added to the ledger.{" "}
          {receiptState.roundNumber < bundle.group.totalRounds
            ? `Round ${receiptState.roundNumber + 1} opens tomorrow.`
            : "This was the final round."}
        </div>

        <div className={styles.footerActions}>
          <Button variant="secondary">Download receipt</Button>
          <Button onClick={() => navigate(`/groups/${groupId}`)}>Back to group</Button>
        </div>
      </div>
    </div>
  );
}
