import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useAppData, useCurrentUser, useGroupBundle } from "../../state/AppDataContext";
import { computeRoundCollection, getPaymentForUserRound, getRoundByNumber } from "../../lib/selectors";
import { formatRM } from "../../lib/currency";
import { formatDateFull } from "../../lib/date";
import { NoteFace, NoteWindow } from "../../components/note/NoteFace";
import { roundSerial } from "../../components/note/GroupNote";
import { EmptyState, PageHeader } from "../../components/layout/Page";
import { Button, ButtonLink } from "../../components/ui/Button";
import { DetailList } from "../../components/ui/DetailList";
import { FormError } from "../../components/ui/Field";
import { Notice } from "../../components/ui/Notice";
import { Switch } from "../../components/ui/Switch";
import styles from "./CheckoutLayout.module.css";

export function CheckoutPage() {
  const { groupId, round } = useParams();
  const roundNumber = Number(round);
  const bundle = useGroupBundle(groupId);
  const currentUser = useCurrentUser();
  const { flow, startPayment, setAutopay } = usePaymentFlow();
  const { state, actions } = useAppData();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedAutopay = groupId ? !!state.autopay[groupId] : false;

  useEffect(() => {
    if (bundle && groupId) {
      startPayment(groupId, roundNumber, bundle.group.contributionAmount);
      setAutopay(savedAutopay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, roundNumber]);

  if (!bundle || !groupId) {
    return (
      <EmptyState title="We couldn't find this group" action={<ButtonLink to="/home">Back to home</ButtonLink>}>
        It may have been removed, or you're not a member of it.
      </EmptyState>
    );
  }

  const { group } = bundle;
  const payRound = getRoundByNumber(bundle, roundNumber);
  const collection = computeRoundCollection(bundle, roundNumber);
  const existing = getPaymentForUserRound(bundle, currentUser.id, roundNumber);
  const alreadyPaid = existing?.status === "paid" || existing?.status === "paid-late";

  async function handleContinue() {
    if (!groupId) return;
    setError(null);
    setSubmitting(true);
    try {
      if (flow.autopay !== savedAutopay) await actions.setAutopay(groupId, flow.autopay);
      // On success this redirects the browser to Stripe Checkout and never returns.
      await actions.markPaymentPaid(groupId, roundNumber, "card");
    } catch {
      setSubmitting(false);
      setError("Couldn't start the payment. Please try again.");
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        back={
          <ButtonLink to={`/groups/${group.id}`} variant="ghost">
            <ArrowLeft size={16} aria-hidden="true" /> {group.name}
          </ButtonLink>
        }
        title="Pay your contribution"
        lead="The amount is fixed by the group. Partial payments aren't accepted."
      />

      <NoteFace
        groupId={group.id}
        groupName={group.name}
        serial={roundSerial(bundle, roundNumber)}
        roundLabel={`Round ${roundNumber} of ${group.totalRounds}`}
        potLabel="your share"
        pot={group.contributionAmount}
        paidCount={collection.paidCount}
        totalCount={collection.totalCount}
        window={payRound ? <NoteWindow caption="Due" name={formatDateFull(payRound.scheduledDate)} /> : undefined}
        size="compact"
      />

      {alreadyPaid ? (
        <Notice tone="info" title="You've already paid this round">
          It's in the group ledger. There's nothing more to pay until the next round.
        </Notice>
      ) : null}

      <DetailList
        items={[
          { term: "Contribution", value: formatRM(group.contributionAmount) },
          { term: "Platform fee", value: formatRM(0) },
          { term: "Total", value: formatRM(group.contributionAmount), emphasis: true },
        ]}
      />

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.resultHead}>
            <CreditCard size={20} aria-hidden="true" /> Debit or credit card
          </h2>
          <p className={styles.small}>
            You'll enter your card on Stripe's payment page. Share Finance never sees your card number.
          </p>
        </div>
        <Switch
          checked={flow.autopay}
          onChange={setAutopay}
          label="Autopay for this group"
          description={`Pay future ${group.frequency === "monthly" ? "monthly" : "weekly"} rounds automatically. You can turn it off any time on Home.`}
        />
      </div>

      <div className={styles.actions}>
        {error ? <FormError>{error}</FormError> : null}
        <Button block onClick={handleContinue} disabled={submitting || alreadyPaid}>
          {submitting ? "Opening Stripe…" : `Continue to pay ${formatRM(group.contributionAmount)}`}
        </Button>
      </div>
    </div>
  );
}
