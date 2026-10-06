import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PauseCircle } from "lucide-react";
import { useAppData, useCurrentUser, useGroupBundle } from "../../../state/AppDataContext";
import {
  computeRoundCollection,
  getRecipient,
  getRoundByNumber,
  getRoundLineup,
  isOrganizer,
  memberName,
} from "../../../lib/selectors";
import { ApiRequestError } from "../../../lib/api";
import { formatRM } from "../../../lib/currency";
import { formatDate, formatDateFull } from "../../../lib/date";
import { NoteFace, NoteWindow } from "../../../components/note/NoteFace";
import { roundSerial } from "../../../components/note/GroupNote";
import { EmptyState, PageHeader } from "../../../components/layout/Page";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { DetailList } from "../../../components/ui/DetailList";
import { FormError, TextAreaField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { StatusMark } from "../../../components/ui/StatusMark";
import layout from "../../checkout/CheckoutLayout.module.css";
import styles from "./PayoutDisbursePage.module.css";

export function PayoutDisbursePage() {
  const { groupId, round } = useParams();
  const roundNumber = Number(round);
  const navigate = useNavigate();
  const bundle = useGroupBundle(groupId);
  const currentUser = useCurrentUser();
  const { actions } = useAppData();
  const [error, setError] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [holdTouched, setHoldTouched] = useState(false);
  const [holdBusy, setHoldBusy] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const payoutRound = bundle ? getRoundByNumber(bundle, roundNumber) : undefined;

  if (!bundle || !payoutRound) {
    return (
      <EmptyState title="We couldn't find this round" action={<ButtonLink to="/home">Back to home</ButtonLink>}>
        The group or round may have changed. Open the group to see the current round.
      </EmptyState>
    );
  }

  const { group } = bundle;
  if (!isOrganizer(bundle, currentUser.id)) {
    return (
      <EmptyState title="Only the organizer can release a payout" action={<ButtonLink to={`/groups/${group.id}`}>Back to group</ButtonLink>}>
        You'll see it in the group ledger as soon as it's sent.
      </EmptyState>
    );
  }

  const collection = computeRoundCollection(bundle, roundNumber);
  const lineup = getRoundLineup(bundle, roundNumber);
  const waiting = [...lineup.failed, ...lineup.unpaid];
  const recipient = getRecipient(bundle, payoutRound);
  const recipientName = memberName(recipient, currentUser.id);
  const recipientFirst = recipientName === "You" ? "you" : recipientName.split(" ")[0];
  const total = collection.collected + collection.lateFeesCollected;
  const poolComplete = waiting.length === 0;
  const accountReady = !!recipient?.user?.stripeConnectOnboarded;
  const mykadPassed = !!recipient?.user?.mykadVerified;
  const held = payoutRound.status === "held";
  const paidOut = payoutRound.status === "paid-out";
  const canRelease = poolComplete && accountReady && !held && !paidOut;

  async function handleRelease(simulate = false) {
    setError(null);
    setReleasing(true);
    try {
      await actions.releasePayout(group.id, roundNumber, simulate, simulate);
      navigate(`/groups/${group.id}/payout/${roundNumber}/receipt`, {
        state: { amount: total, recipientName, roundNumber },
      });
    } catch (err) {
      setError(err instanceof ApiRequestError || err instanceof Error ? err.message : "Couldn't release this payout.");
      setReleasing(false);
    }
  }

  async function handleHold(e: FormEvent) {
    e.preventDefault();
    setHoldTouched(true);
    if (!holdReason.trim() || holdBusy) return;
    setHoldBusy(true);
    setHoldError(null);
    try {
      await actions.holdPayout(group.id, roundNumber, holdReason.trim());
      setHoldOpen(false);
      setHoldReason("");
    } catch (err) {
      setHoldError(err instanceof ApiRequestError ? err.message : "Couldn't place the hold. Please try again.");
    } finally {
      setHoldBusy(false);
    }
  }

  async function handleLiftHold() {
    setHoldBusy(true);
    setHoldError(null);
    try {
      await actions.liftHold(group.id, roundNumber);
    } catch (err) {
      setHoldError(err instanceof ApiRequestError ? err.message : "Couldn't lift the hold. Please try again.");
    } finally {
      setHoldBusy(false);
    }
  }

  const blockReason = paidOut
    ? "This round has already been paid out."
    : held
      ? "Lift the hold before releasing."
      : !poolComplete
        ? `Waiting for ${waiting.length} contribution${waiting.length === 1 ? "" : "s"}.`
        : !accountReady
          ? `${recipientName === "You" ? "Your" : `${recipientFirst}'s`} payout account isn't set up yet.`
          : null;

  return (
    <div className={layout.page}>
      <PageHeader
        back={
          <ButtonLink to={`/groups/${group.id}`} variant="ghost">
            <ArrowLeft size={16} aria-hidden="true" /> {group.name}
          </ButtonLink>
        }
        title={`Release the round ${roundNumber} payout`}
        lead="Check everything below. Once you release it, the money is sent and can't be taken back."
      />

      <NoteFace
        groupId={group.id}
        groupName={group.name}
        serial={roundSerial(bundle, roundNumber)}
        roundLabel={`Round ${roundNumber} of ${group.totalRounds}`}
        potLabel="to release"
        pot={total}
        paidCount={collection.paidCount}
        totalCount={collection.totalCount}
        window={<NoteWindow caption="Goes to" name={recipientName} />}
        stamp={held ? "held" : paidOut ? "issued" : undefined}
      />

      <section className={layout.stack} aria-labelledby="checks-heading">
        <h2 id="checks-heading">Before it's sent</h2>
        <ul className={layout.checks}>
          <li className={layout.check}>
            <StatusMark kind={poolComplete ? "done" : "waiting"} size={20} />
            <div className={layout.checkText}>
              <p className={layout.checkTitle}>
                Contributions: {collection.paidCount} of {collection.totalCount} in
              </p>
              <p className={layout.checkBody}>
                {poolComplete
                  ? "Every member has paid this round."
                  : `Waiting for ${waiting.map((w) => memberName(w, currentUser.id)).join(", ")}`.replace(/\.?$/, ".")}
              </p>
            </div>
          </li>
          <li className={layout.check}>
            <StatusMark kind={accountReady ? "done" : "blocked"} size={20} />
            <div className={layout.checkText}>
              <p className={layout.checkTitle}>{recipientName === "You" ? "Your" : `${recipientName}'s`} payout account</p>
              <p className={layout.checkBody}>
                {accountReady
                  ? "Set up with Stripe, in their own name."
                  : "Not set up yet. They need to finish Stripe payout setup before the pot can be sent."}
              </p>
            </div>
          </li>
          <li className={layout.check}>
            <StatusMark kind={mykadPassed ? "done" : "waiting"} size={20} />
            <div className={layout.checkText}>
              <p className={layout.checkTitle}>MyKad identity check</p>
              <p className={layout.checkBody}>
                {mykadPassed
                  ? recipient?.user?.mykadVerifiedDate
                    ? `Passed ${formatDateFull(recipient.user.mykadVerifiedDate)}.`
                    : "Passed."
                  : "Not done yet."}
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section className={layout.stack} aria-labelledby="amount-heading">
        <h2 id="amount-heading">Amount</h2>
        <DetailList
          items={[
            {
              term: `Contributions (${collection.paidCount} × ${formatRM(group.contributionAmount)})`,
              value: formatRM(collection.collected),
            },
            { term: "Late fees added to the pot", value: formatRM(collection.lateFeesCollected) },
            { term: `${recipientName === "You" ? "You receive" : `${recipientFirst} receives`}`, value: formatRM(total), emphasis: true },
          ]}
        />
      </section>

      <div className={layout.actions}>
        {error ? <FormError>{error}</FormError> : null}
        <Button block onClick={() => handleRelease()} disabled={!canRelease || releasing}>
          {releasing ? "Releasing…" : `Release ${formatRM(total)} to ${recipientName === "You" ? "yourself" : recipientFirst}`}
        </Button>
        {blockReason ? <p className={layout.small}>{blockReason}</p> : null}
        {import.meta.env.DEV && !paidOut ? (
          <>
            <Button variant="ghost" block onClick={() => handleRelease(true)} disabled={releasing}>
              Simulate this payout
            </Button>
            <p className={layout.devNote}>Development only. Skips Stripe and the checks above.</p>
          </>
        ) : null}
      </div>

      {!paidOut ? (
        <section className={styles.hold} aria-labelledby="hold-heading">
          <div className={styles.holdHead}>
            <PauseCircle size={20} aria-hidden="true" />
            <h2 id="hold-heading">{held ? "This payout is on hold" : "Hold this payout instead"}</h2>
          </div>
          {held ? (
            <>
              <p className={layout.small}>
                Nothing is sent while the hold is on. Members were told the reason on WhatsApp. It was due to pay out on{" "}
                {formatDate(payoutRound.scheduledDate)}.
              </p>
              <div className={layout.actionsRow}>
                <Button variant="secondary" onClick={handleLiftHold} disabled={holdBusy}>
                  {holdBusy ? "Lifting…" : "Lift the hold"}
                </Button>
              </div>
            </>
          ) : holdOpen ? (
            <form className={styles.holdForm} onSubmit={handleHold}>
              <TextAreaField
                label="Reason, sent to every member"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                onBlur={() => setHoldTouched(true)}
                placeholder="e.g. Budi's card payment was reversed. Waiting for him to pay again."
                maxLength={500}
                autoFocus
                error={holdTouched && !holdReason.trim() ? "Add a reason. Every member receives it." : null}
              />
              <div className={layout.actionsRow}>
                <Button type="submit" variant="danger" disabled={holdBusy}>
                  {holdBusy ? "Placing hold…" : "Place hold and tell members"}
                </Button>
                <Button variant="ghost" onClick={() => setHoldOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className={layout.small}>
                Use this if a member disputes the order or a contribution is reversed. Nothing is sent while it's on hold,
                and every member is told why on WhatsApp.
              </p>
              <div className={layout.actionsRow}>
                <Button variant="secondary" onClick={() => setHoldOpen(true)}>
                  Place a hold
                </Button>
              </div>
            </>
          )}
          {holdError ? <FormError>{holdError}</FormError> : null}
        </section>
      ) : (
        <Notice tone="info" title="Already paid out">
          Sent {payoutRound.paidOutAt ? formatDateFull(payoutRound.paidOutAt) : ""}
          {payoutRound.paidOutRef ? ` · reference ${payoutRound.paidOutRef}` : ""}.
        </Notice>
      )}
    </div>
  );
}
