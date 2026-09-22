import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useAppData, useGroupBundle } from "../../state/AppDataContext";
import * as api from "../../lib/api";
import { ApiRequestError } from "../../lib/api";
import styles from "./CheckoutLayout.module.css";

const POLL_ATTEMPTS = 4;
const POLL_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Landing page for the redirect back from Stripe Checkout. PaymentFlowContext is plain
 * in-memory React state, so it does NOT survive the full-page navigation to Stripe and
 * back — this page re-derives everything from the URL and a fresh fetch, then rehydrates
 * PaymentFlowContext before handing off to the existing success/failed pages.
 */
export function CheckoutReturnPage() {
  const { groupId, round } = useParams();
  const roundNumber = Number(round);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled") === "1";
  const navigate = useNavigate();
  const { startPayment, setMethod, setStatus } = usePaymentFlow();
  const { actions } = useAppData();
  const bundle = useGroupBundle(groupId);
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current || !groupId || !bundle) return;
    ranRef.current = true;

    startPayment(groupId, roundNumber, bundle.group.contributionAmount);
    setMethod("card");

    if (canceled || !sessionId) {
      setStatus("failed");
      navigate("/pay/failed", { replace: true });
      return;
    }

    (async () => {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        try {
          const payment = await api.confirmPayment(groupId, roundNumber, sessionId);
          if (payment.status === "paid" || payment.status === "paid-late") {
            await actions.refresh();
            setStatus("success");
            navigate("/pay/success", { replace: true });
            return;
          }
        } catch (err) {
          if (err instanceof ApiRequestError && err.code !== "PAYMENT_PENDING") {
            setStatus("failed");
            navigate("/pay/failed", { replace: true });
            return;
          }
        }
        await sleep(POLL_DELAY_MS);
      }
      setError("We're still waiting for Stripe to confirm this payment. Check back in a moment.");
    })();
  }, [groupId, bundle, roundNumber, sessionId, canceled, startPayment, setMethod, setStatus, actions, navigate]);

  if (!bundle) return null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.title}>{error ?? "Confirming your payment…"}</span>
        {!error && <div className={styles.tip}>Don't close this window.</div>}
      </div>
    </div>
  );
}
