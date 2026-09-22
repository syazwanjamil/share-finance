import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../../state/AppDataContext";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import * as api from "../../lib/api";
import styles from "../checkout/CheckoutLayout.module.css";

export function PayoutSetupReturnPage() {
  const navigate = useNavigate();
  const { actions } = useAppData();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const status = await api.getConnectStatus();
      await actions.refresh();
      setOnboarded(status.onboarded);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {onboarded === null && <span className={styles.title}>Checking your payout account…</span>}

        {onboarded === true && (
          <>
            <span className={styles.title}>✓ Payout account ready</span>
            <p style={{ fontSize: 12.5, color: "var(--text)" }}>
              You're all set to receive a payout when it's your turn.
            </p>
            <Button block onClick={() => navigate("/home")}>
              Back to home
            </Button>
          </>
        )}

        {onboarded === false && (
          <>
            <StatusPill variant="warning">Still incomplete</StatusPill>
            <p style={{ fontSize: 12.5, color: "var(--text)" }}>
              Stripe says your onboarding isn't finished yet. You can pick up where you left off.
            </p>
            <Button block onClick={() => navigate("/settings/payout")}>
              Continue setup
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
