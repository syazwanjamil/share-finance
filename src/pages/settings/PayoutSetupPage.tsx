import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useCurrentUser } from "../../state/AppDataContext";
import { PageHeader } from "../../components/layout/Page";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/Field";
import { StatusMark } from "../../components/ui/StatusMark";
import * as api from "../../lib/api";
import styles from "../checkout/CheckoutLayout.module.css";

export function PayoutSetupPage() {
  const currentUser = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = currentUser.stripeConnectOnboarded;

  async function handleSetUp() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api.createConnectOnboardingLink();
      window.location.href = url;
    } catch {
      setError("Couldn't open payout setup. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Your payout account"
        lead="When it's your turn, the pot is sent to a Stripe account in your name. Stripe asks for basic identity and bank details on its own secure page."
      />

      <p className={styles.resultHead}>
        <StatusMark kind={ready ? "done" : "waiting"} size={22} />
        <strong>{ready ? "Ready to receive payouts" : "Not set up yet"}</strong>
      </p>

      <div className={styles.actions}>
        {error ? <FormError>{error}</FormError> : null}
        <Button block onClick={handleSetUp} disabled={loading} variant={ready ? "secondary" : "primary"}>
          {loading ? "Opening Stripe…" : ready ? "Update payout details on Stripe" : "Set up on Stripe"}
          {!loading ? <ExternalLink size={16} aria-hidden="true" /> : null}
        </Button>
        <p className={styles.small}>You'll come back here when you're done.</p>
      </div>
    </div>
  );
}
