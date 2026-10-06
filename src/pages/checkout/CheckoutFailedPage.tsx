import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useAppData, useGroupBundle } from "../../state/AppDataContext";
import { getRoundByNumber, getUserById } from "../../lib/selectors";
import { ApiRequestError } from "../../lib/api";
import { formatRM } from "../../lib/currency";
import { formatDateFull } from "../../lib/date";
import { PageHeader } from "../../components/layout/Page";
import { Button, ButtonLink } from "../../components/ui/Button";
import { DetailList } from "../../components/ui/DetailList";
import { FormError, TextAreaField } from "../../components/ui/Field";
import { StatusMark } from "../../components/ui/StatusMark";
import styles from "./CheckoutLayout.module.css";

export function CheckoutFailedPage() {
  const navigate = useNavigate();
  const { flow } = usePaymentFlow();
  const { actions } = useAppData();
  const bundle = useGroupBundle(flow.groupId ?? undefined);
  const valid = !!bundle && flow.roundNumber != null;
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) navigate("/home", { replace: true });
  }, [valid, navigate]);

  if (!bundle || flow.roundNumber == null) return null;

  const { group } = bundle;
  const round = getRoundByNumber(bundle, flow.roundNumber);
  const organizerName = getUserById(bundle, group.organizerId)?.name ?? "your organizer";

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!reason.trim() || sending || flow.roundNumber == null) return;
    setSending(true);
    setError(null);
    try {
      await actions.requestExtension(group.id, flow.roundNumber, reason.trim());
      setSent(true);
      setAsking(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't send your request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Your payment didn't go through"
        lead="Stripe didn't complete the payment, or the payment page was closed before it finished. Nothing was charged."
      />

      <DetailList
        items={[
          { term: "Group", value: `${group.name} · round ${flow.roundNumber}` },
          { term: "Amount", value: formatRM(flow.amount) },
          ...(round ? [{ term: "Due", value: formatDateFull(round.scheduledDate) }] : []),
          {
            term: "Late fee",
            value:
              group.lateFeePolicy.amount > 0
                ? `${formatRM(group.lateFeePolicy.amount)} after a ${group.lateFeePolicy.graceDays}-day grace period`
                : "None for this group",
          },
        ]}
      />

      <div className={styles.actions}>
        <Button block onClick={() => navigate(`/pay/${group.id}/${flow.roundNumber}`)}>
          Try again
        </Button>
        <ButtonLink to={`/groups/${group.id}`} variant="secondary" block>
          Back to {group.name}
        </ButtonLink>
      </div>

      <section className={styles.panel} aria-labelledby="more-time-heading">
        <div className={styles.panelHead}>
          <h2 id="more-time-heading">Need more time?</h2>
          <p className={styles.small}>Ask {organizerName} on WhatsApp. They'll see your reason.</p>
        </div>
        {sent ? (
          <p className={styles.resultHead} role="status">
            <StatusMark kind="done" size={18} /> Sent to {organizerName}.
          </p>
        ) : asking ? (
          <form className={styles.stack} onSubmit={handleAsk}>
            <TextAreaField
              label="Your message"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g. My salary comes in on the 28th. Can I pay then?"
              maxLength={500}
              autoFocus
              error={touched && !reason.trim() ? "Add a short reason for your organizer." : null}
            />
            {error ? <FormError>{error}</FormError> : null}
            <div className={styles.actionsRow}>
              <Button type="submit" variant="secondary" disabled={sending}>
                {sending ? "Sending…" : `Send to ${organizerName.split(" ")[0]}`}
              </Button>
              <Button variant="ghost" onClick={() => setAsking(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.actionsRow}>
            <Button variant="secondary" onClick={() => setAsking(true)}>
              Ask for more time
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
