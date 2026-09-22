import { useState } from "react";
import { useCurrentUser } from "../../state/AppDataContext";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import * as api from "../../lib/api";
import styles from "../checkout/CheckoutLayout.module.css";

export function PayoutSetupPage() {
  const currentUser = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetUp() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api.createConnectOnboardingLink();
      window.location.href = url;
    } catch {
      setError("Couldn't start payout setup. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.title}>Set up your payout account</span>
        <p style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.55 }}>
          When it's your turn to be paid out, the pool is sent to a Stripe account in your name. You'll be
          asked for basic identity and bank details on Stripe's secure onboarding page.
        </p>

        {currentUser.stripeConnectOnboarded ? (
          <StatusPill variant="success">✓ Payout account ready</StatusPill>
        ) : (
          <StatusPill variant="warning">Not set up yet</StatusPill>
        )}

        {error && <p style={{ fontSize: 12, color: "var(--warning)" }}>{error}</p>}

        <Button block onClick={handleSetUp} disabled={loading}>
          {loading ? "Redirecting…" : currentUser.stripeConnectOnboarded ? "Update payout details" : "Set up now"}
        </Button>
      </div>
    </div>
  );
}
