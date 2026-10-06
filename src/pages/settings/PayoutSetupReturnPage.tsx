import { useEffect, useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import { LoadingScreen } from "../../components/layout/LoadingScreen";
import { PageHeader } from "../../components/layout/Page";
import { ButtonLink } from "../../components/ui/Button";
import { FormError } from "../../components/ui/Field";
import { StatusMark } from "../../components/ui/StatusMark";
import * as api from "../../lib/api";
import styles from "../checkout/CheckoutLayout.module.css";

export function PayoutSetupReturnPage() {
  const { actions } = useAppData();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const status = await api.getConnectStatus();
        await actions.refresh();
        setOnboarded(status.onboarded);
      } catch {
        setError("Couldn't check your payout account with Stripe.");
        setOnboarded(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (onboarded === null) return <LoadingScreen label="Checking your payout account with Stripe…" />;

  return (
    <div className={styles.page}>
      {onboarded ? (
        <>
          <PageHeader title="Payout account ready" lead="You're set to receive the pot when it's your turn." />
          <p className={styles.resultHead}>
            <StatusMark kind="done" size={22} /> <strong>Set up with Stripe, in your name</strong>
          </p>
          <div className={styles.actionsRow}>
            <ButtonLink to="/home" variant="primary">
              Back to home
            </ButtonLink>
          </div>
        </>
      ) : (
        <>
          <PageHeader
            title="Payout setup isn't finished"
            lead="Stripe says a few details are still missing. You can pick up where you left off."
          />
          {error ? <FormError>{error}</FormError> : null}
          <div className={styles.actionsRow}>
            <ButtonLink to="/settings/payout" variant="primary">
              Continue setup
            </ButtonLink>
            <ButtonLink to="/home" variant="secondary">
              Later
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
