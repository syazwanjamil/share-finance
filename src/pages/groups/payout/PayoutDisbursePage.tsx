import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData, useGroupBundle } from "../../../state/AppDataContext";
import { computeRoundCollection, getMembersWithUsers, getRoundByNumber } from "../../../lib/selectors";
import { Button } from "../../../components/ui/Button";
import { StatusPill } from "../../../components/ui/StatusPill";
import { formatRM } from "../../../lib/currency";
import { formatDateFull } from "../../../lib/date";
import checkoutStyles from "../../checkout/CheckoutLayout.module.css";
import styles from "./PayoutDisbursePage.module.css";

export function PayoutDisbursePage() {
  const { groupId, round } = useParams();
  const roundNumber = Number(round);
  const navigate = useNavigate();
  const bundle = useGroupBundle(groupId);
  const { actions } = useAppData();
  const [autoRelease, setAutoRelease] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!bundle) return <div>Group not found.</div>;

  const payoutRound = getRoundByNumber(bundle, roundNumber);
  const collection = computeRoundCollection(bundle, roundNumber);
  const recipient = getMembersWithUsers(bundle).find((m) => m.member.id === payoutRound?.recipientMemberId);
  const total = collection.collected + collection.lateFeesCollected;
  const poolComplete = collection.paidCount === collection.totalCount;
  const recipientNotOnboarded = !!recipient?.user && !recipient.user.stripeConnectOnboarded;

  async function handleRelease(simulate = false) {
    setError(null);
    try {
      await actions.releasePayout(groupId!, roundNumber, simulate, simulate);
      navigate(`/groups/${groupId}/payout/${roundNumber}/receipt`, {
        state: { amount: total, recipientName: recipient?.user?.name, roundNumber },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't release this payout.");
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className={checkoutStyles.title}>Release round {roundNumber} payout</span>
        <StatusPill variant={poolComplete ? "success" : "warning"}>
          {poolComplete ? "pool complete" : "collecting"}
        </StatusPill>
      </div>

      <div className={styles.recipientCard}>
        <div className={styles.recipientLeft}>
          <span className={styles.recipientAvatar}>{recipient?.user?.initials}</span>
          <div className={styles.recipientNames}>
            <span className={styles.recipientName}>{recipient?.user?.name}</span>
            <span className={styles.recipientMeta}>
              {recipient?.user?.bankAccount ?? "Bank not on file"} · name matched ✓
            </span>
            {recipientNotOnboarded && <StatusPill variant="warning">Payout account not set up</StatusPill>}
            {recipient?.user?.mykadVerifiedDate ? (
              <span className={styles.recipientMeta}>
                MyKad verified {formatDateFull(recipient.user.mykadVerifiedDate)}
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.recipientRight}>
          <span className={styles.recipientAmountLabel}>Disbursing</span>
          <span className={styles.recipientAmount}>{formatRM(total)}</span>
        </div>
      </div>

      <div className={checkoutStyles.breakdown}>
        <span className={checkoutStyles.sectionLabel}>POOL CHECK</span>
        <div className={checkoutStyles.breakdownRow}>
          <span>Contributions collected</span>
          <span>
            {collection.paidCount} of {collection.totalCount} · {formatRM(collection.collected)}
          </span>
        </div>
        <div className={checkoutStyles.breakdownRow}>
          <span>Late fees added to pool</span>
          <span>{formatRM(collection.lateFeesCollected)}</span>
        </div>
        <div className={checkoutStyles.breakdownRow}>
          <span>Transfer fee</span>
          <span>{formatRM(0)}</span>
        </div>
        <div className={checkoutStyles.breakdownTotal}>
          <span>{recipient?.user?.name?.split(" ")[0]} receives</span>
          <span>{formatRM(total)}</span>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <div className={styles.toggleText}>
          <span className={styles.toggleTitle}>Automatic release on payout day</span>
          <span className={styles.toggleSub}>
            Sends at 09:00 on {payoutRound ? formatDateFull(payoutRound.scheduledDate) : ""} if the pool is
            complete
          </span>
        </div>
        <button
          type="button"
          className={`${styles.toggle} ${autoRelease ? styles.toggleOn : styles.toggleOff}`}
          onClick={() => setAutoRelease((v) => !v)}
          aria-pressed={autoRelease}
          aria-label="Toggle automatic release"
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      <div className={styles.holdBox}>
        <span className={styles.holdTitle}>Hold this payout instead</span>
        <span className={styles.holdSub}>
          Use if a member disputes the order or a contribution is reversed. Funds stay in the trust account
          and all members are told why.
        </span>
        <button type="button" className={styles.holdLink}>
          Place a hold →
        </button>
      </div>

      {error && (
        <span className={styles.securityNote} style={{ color: "var(--warning)" }}>
          {error}
        </span>
      )}
      <Button block onClick={() => handleRelease()} disabled={!poolComplete}>
        Release {formatRM(total)} now
      </Button>
      <span className={styles.securityNote}>
        Needs your PIN. Transfers to a verified account only and cannot be redirected.
      </span>

      {import.meta.env.DEV && (
        <Button variant="ghost" block onClick={() => handleRelease(true)}>
          Simulate payout (dev only)
        </Button>
      )}
    </>
  );
}
