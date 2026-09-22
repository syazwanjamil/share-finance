import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useCurrentUser, useGroupBundle } from "../../state/AppDataContext";
import { computeRoundCollection, getPaymentForUserRound } from "../../lib/selectors";
import { Button } from "../../components/ui/Button";
import { formatRM } from "../../lib/currency";
import { formatDateFull } from "../../lib/date";
import styles from "./CheckoutLayout.module.css";

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { flow, reset } = usePaymentFlow();
  const currentUser = useCurrentUser();
  const bundle = useGroupBundle(flow.groupId ?? undefined);
  const valid = !!bundle && flow.roundNumber != null;

  useEffect(() => {
    if (!valid) navigate("/home");
  }, [valid, navigate]);

  if (!bundle || flow.roundNumber == null) {
    return null;
  }

  const collection = computeRoundCollection(bundle, flow.roundNumber);
  const payment = getPaymentForUserRound(bundle, currentUser.id, flow.roundNumber);
  const ref = payment?.ref ?? "—";

  function handleBackHome() {
    reset();
    navigate("/home");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.center}>
          <span className={styles.successIcon}>✓</span>
          <div>
            <div className={styles.title}>Payment received</div>
            <span style={{ fontSize: 11.5, color: "var(--text)" }}>
              {formatDateFull(new Date().toISOString())} · cleared
            </span>
          </div>
          <span className={styles.bigAmount}>{formatRM(flow.amount)}</span>
        </div>

        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span>Reference</span>
            <span>{ref}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Method</span>
            <span>
              {flow.method === "fpx"
                ? "Maybank FPX ···4821"
                : flow.method === "ewallet"
                  ? "Touch 'n Go eWallet"
                  : flow.method === "card"
                    ? "Card (Stripe)"
                    : "DuitNow QR"}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span>Group</span>
            <span>
              {bundle.group.name} · round {flow.roundNumber}
            </span>
          </div>
          <div className={`${styles.detailRow} ${styles.detailTotal}`}>
            <span>Round progress</span>
            <span>
              {collection.paidCount} of {collection.totalCount} paid
            </span>
          </div>
        </div>

        <div className={styles.tip}>
          <strong>Receipt sent on WhatsApp.</strong> A confirmation also went to the {bundle.group.name}{" "}
          group chat so members can see the pool update.
        </div>

        <div className={styles.footerActions}>
          <Button variant="secondary">Download receipt</Button>
          <Button onClick={handleBackHome}>Back to home</Button>
        </div>
      </div>
    </div>
  );
}
