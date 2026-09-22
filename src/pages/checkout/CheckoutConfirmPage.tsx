import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useAppData, useCurrentUser, useGroupBundle } from "../../state/AppDataContext";
import { Button } from "../../components/ui/Button";
import { formatRM } from "../../lib/currency";
import styles from "./CheckoutLayout.module.css";

export function CheckoutConfirmPage() {
  const navigate = useNavigate();
  const { flow } = usePaymentFlow();
  const { actions } = useAppData();
  const currentUser = useCurrentUser();
  const bundle = useGroupBundle(flow.groupId ?? undefined);
  const valid = !!bundle && flow.roundNumber != null;

  useEffect(() => {
    if (!valid) navigate("/home");
  }, [valid, navigate]);

  if (!bundle || flow.roundNumber == null) {
    return null;
  }

  async function handleContinue() {
    try {
      await actions.markPaymentPaid(flow.groupId!, flow.roundNumber!, flow.method);
      navigate("/pay/success");
    } catch {
      navigate("/pay/failed");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.title}>Confirm before you continue</span>
        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span>Paying into</span>
            <span>{bundle.group.name} trust account</span>
          </div>
          <div className={styles.detailRow}>
            <span>Account no.</span>
            <span>···8830 (verified)</span>
          </div>
          <div className={styles.detailRow}>
            <span>From</span>
            <span>{currentUser.bankAccount}</span>
          </div>
          <div className={styles.detailRow}>
            <span>For</span>
            <span>
              Round {flow.roundNumber} of {bundle.group.totalRounds}
            </span>
          </div>
          <div className={`${styles.detailRow} ${styles.detailTotal}`}>
            <span>Amount</span>
            <span>{formatRM(flow.amount)}</span>
          </div>
        </div>

        <div className={styles.gatewayPlaceholder}>
          bank / gateway page
          <br />
          (FPX login, TAC, biometric)
        </div>

        <div className={styles.tip}>
          Don't close this window. We update your status the moment the bank confirms — usually under 10
          seconds.
        </div>

        <div className={styles.footerActions} style={{ flexDirection: "column" }}>
          <Button block onClick={handleContinue}>
            Continue
          </Button>
          <Button variant="secondary" block onClick={() => navigate(-1)}>
            Cancel payment
          </Button>
        </div>
        <button type="button" className={styles.linkButton} onClick={() => navigate("/pay/failed")}>
          Simulate a failed payment
        </button>
      </div>
    </div>
  );
}
