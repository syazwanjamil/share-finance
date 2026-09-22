import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useAppData, useGroupBundle } from "../../state/AppDataContext";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import { formatRM } from "../../lib/currency";
import styles from "./CheckoutLayout.module.css";

export function CheckoutPage() {
  const { groupId, round } = useParams();
  const roundNumber = Number(round);
  const bundle = useGroupBundle(groupId);
  const { flow, startPayment, setAutopay } = usePaymentFlow();
  const { actions } = useAppData();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bundle && groupId) {
      startPayment(groupId, roundNumber, bundle.group.contributionAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, roundNumber]);

  if (!bundle) return <div>Group not found.</div>;

  async function handleContinue() {
    if (!groupId) return;
    setError(null);
    setSubmitting(true);
    try {
      // On success this redirects the browser to Stripe Checkout and never returns.
      await actions.markPaymentPaid(groupId, roundNumber, "card");
    } catch {
      setSubmitting(false);
      setError("Couldn't start the payment — please try again.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>Pay your contribution</div>

        <div className={styles.amountBox}>
          <span className={styles.amountLabel}>AMOUNT DUE</span>
          <span className={styles.amountValue}>
            {formatRM(bundle.group.contributionAmount)}
          </span>
          <span className={styles.amountMeta}>
            {bundle.group.name} · round {roundNumber} of{" "}
            {bundle.group.totalRounds}
          </span>
          <span className={styles.amountNote}>
            Fixed by the group. Partial payments are not accepted.
          </span>
        </div>

        <span className={styles.sectionLabel}>PAY WITH</span>
        <div className={`${styles.methodRow} ${styles.methodRowSelected}`}>
          <div className={styles.methodLeft}>
            <span className={styles.methodBadge}>CARD</span>
            <div>
              <div className={styles.methodName}>Debit / credit card</div>
              <div className={styles.methodSub}>Secured by Stripe</div>
            </div>
          </div>
          <span className={`${styles.radioDot} ${styles.radioDotSelected}`} />
        </div>

        <div className={styles.breakdown}>
          <div className={styles.breakdownRow}>
            <span>Contribution</span>
            <span>{formatRM(bundle.group.contributionAmount)}</span>
          </div>
          <div className={styles.breakdownRow}>
            <span>Platform fee</span>
            <span>{formatRM(0)}</span>
          </div>
          <div className={styles.breakdownTotal}>
            <span>Total</span>
            <span>{formatRM(bundle.group.contributionAmount)}</span>
          </div>
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={flow.autopay}
            onChange={(e) => setAutopay(e.target.checked)}
          />
          Pay this automatically every month, 2 days before the due date
        </label>

        {error && (
          <div style={{ color: "var(--warning)", fontSize: 12.5 }}>{error}</div>
        )}

        <Button block onClick={handleContinue} disabled={submitting}>
          {submitting ? "Redirecting to Stripe…" : "Continue to secure payment"}
        </Button>

        <div className={styles.badgeRow}>
          <StatusPill variant="success">🔒 encrypted</StatusPill>
          <StatusPill variant="neutral">
            paid into group trust account
          </StatusPill>
          <StatusPill variant="neutral">not to the organizer</StatusPill>
        </div>
      </div>
    </div>
  );
}
