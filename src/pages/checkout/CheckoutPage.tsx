import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import type { PaymentMethod } from "../../state/PaymentFlowContext";
import { useGroupBundle } from "../../state/AppDataContext";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import { formatRM } from "../../lib/currency";
import styles from "./CheckoutLayout.module.css";

const METHODS: { id: PaymentMethod; badge: string; name: string; sub: string }[] = [
  { id: "fpx", badge: "BANK", name: "Maybank ···4821 · FPX", sub: "Instant · no fee" },
  { id: "ewallet", badge: "TNG", name: "Touch 'n Go eWallet", sub: "Balance RM 620.40" },
  { id: "qr", badge: "QR", name: "DuitNow QR", sub: "Scan with any banking app" },
];

export function CheckoutPage() {
  const { groupId, round } = useParams();
  const roundNumber = Number(round);
  const navigate = useNavigate();
  const bundle = useGroupBundle(groupId);
  const { flow, startPayment, setMethod, setAutopay } = usePaymentFlow();

  useEffect(() => {
    if (bundle && groupId) {
      startPayment(groupId, roundNumber, bundle.group.contributionAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, roundNumber]);

  if (!bundle) return <div>Group not found.</div>;

  const continueLabel =
    flow.method === "fpx" ? "Continue to Maybank" : flow.method === "ewallet" ? "Continue to TNG eWallet" : "Continue with DuitNow QR";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>Pay your contribution</div>

        <div className={styles.amountBox}>
          <span className={styles.amountLabel}>AMOUNT DUE</span>
          <span className={styles.amountValue}>{formatRM(bundle.group.contributionAmount)}</span>
          <span className={styles.amountMeta}>
            {bundle.group.name} · round {roundNumber} of {bundle.group.totalRounds}
          </span>
          <span className={styles.amountNote}>Fixed by the group. Partial payments are not accepted.</span>
        </div>

        <span className={styles.sectionLabel}>PAY WITH</span>
        {METHODS.map((m) => {
          const selected = flow.method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`${styles.methodRow} ${selected ? styles.methodRowSelected : ""}`}
              onClick={() => setMethod(m.id)}
            >
              <div className={styles.methodLeft}>
                <span className={styles.methodBadge}>{m.badge}</span>
                <div>
                  <div className={styles.methodName}>{m.name}</div>
                  <div className={styles.methodSub}>{m.sub}</div>
                </div>
              </div>
              <span className={`${styles.radioDot} ${selected ? styles.radioDotSelected : ""}`} />
            </button>
          );
        })}
        <div className={styles.addRow}>
          <span>＋</span>
          <span>Add a bank or e-wallet</span>
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
          <input type="checkbox" checked={flow.autopay} onChange={(e) => setAutopay(e.target.checked)} />
          Pay this automatically every month, 2 days before the due date
        </label>

        <Button block onClick={() => navigate("/pay/confirm")}>
          {continueLabel}
        </Button>

        <div className={styles.badgeRow}>
          <StatusPill variant="success">🔒 encrypted</StatusPill>
          <StatusPill variant="neutral">paid into group trust account</StatusPill>
          <StatusPill variant="neutral">not to the organizer</StatusPill>
        </div>
      </div>
    </div>
  );
}
