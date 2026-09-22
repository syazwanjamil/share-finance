import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useGroupBundle } from "../../state/AppDataContext";
import { Button } from "../../components/ui/Button";
import { formatRM } from "../../lib/currency";
import { formatDateFull } from "../../lib/date";
import styles from "./CheckoutLayout.module.css";

export function CheckoutFailedPage() {
  const navigate = useNavigate();
  const { flow } = usePaymentFlow();
  const bundle = useGroupBundle(flow.groupId ?? undefined);
  const valid = !!bundle && flow.roundNumber != null;

  useEffect(() => {
    if (!valid) navigate("/home");
  }, [valid, navigate]);

  if (!bundle || flow.roundNumber == null) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.failedIcon}>!</span>
        <span className={styles.title}>Payment didn't go through</span>
        <p style={{ fontSize: 11.5, color: "var(--text)", lineHeight: 1.55 }}>
          Your bank declined the transfer: insufficient funds. Nothing was taken from your account.
        </p>

        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span>Attempted</span>
            <span>
              {formatRM(flow.amount)} · {formatDateFull(new Date().toISOString())}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span>Reference</span>
            <span>SF-4821-0092 · failed</span>
          </div>
          <div className={styles.detailRow}>
            <span>Grace period</span>
            <span style={{ color: "var(--warning)" }}>{bundle.group.lateFeePolicy.graceDays} days left</span>
          </div>
        </div>

        <div className={styles.tip} style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)", borderLeftColor: "var(--warning)" }}>
          After the grace period a {formatRM(bundle.group.lateFeePolicy.amount)} late fee is added and the
          organizer is notified. Your payout turn is not affected.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button block onClick={() => navigate(`/pay/${bundle.group.id}/${flow.roundNumber}`)}>
            Try another method
          </Button>
          <Button variant="secondary" block onClick={() => navigate("/pay/confirm")}>
            Retry {flow.method === "fpx" ? "Maybank ···4821" : "payment"}
          </Button>
          <button type="button" className={styles.linkButton}>
            Tell the organizer I need more time
          </button>
        </div>
      </div>
    </div>
  );
}
