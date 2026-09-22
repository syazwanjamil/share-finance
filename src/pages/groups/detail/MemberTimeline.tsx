import type { GroupBundle } from "../../../lib/api";
import {
  computeRoundCollection,
  getCurrentRound,
  getMembersWithUsers,
  getPaymentForMemberRound,
} from "../../../lib/selectors";
import { StatusPill } from "../../../components/ui/StatusPill";
import { Button } from "../../../components/ui/Button";
import { CollectionProgressBar } from "../../../components/ui/CollectionProgressBar";
import { formatRM } from "../../../lib/currency";
import { formatDate } from "../../../lib/date";
import styles from "./MemberTimeline.module.css";

interface MemberTimelineProps {
  bundle: GroupBundle;
  currentUserId: string;
}

export function MemberTimeline({ bundle, currentUserId }: MemberTimelineProps) {
  const { rounds } = bundle;
  const currentRound = getCurrentRound(bundle);
  const collection = currentRound ? computeRoundCollection(bundle, currentRound.roundNumber) : null;
  const membersWithUsers = getMembersWithUsers(bundle).filter((m) => m.member.status === "active");
  const recipientUser = currentRound
    ? membersWithUsers.find((m) => m.member.id === currentRound.recipientMemberId)?.user
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {currentRound && collection ? (
        <div className={styles.banner}>
          <div className={styles.bannerText}>
            <span className={styles.bannerLabel}>
              ROUND {currentRound.roundNumber} · PAYS OUT {formatDate(currentRound.scheduledDate)}
            </span>
            <span className={styles.bannerTitle}>
              {recipientUser?.name} receives {formatRM(collection.pool)}
            </span>
            {currentRound.priorityRequest ? (
              <span className={styles.bannerSub}>
                Priority request: {currentRound.priorityRequest.reason}
              </span>
            ) : null}
          </div>
          <div className={styles.bannerRight}>
            <span className={styles.bannerRightLabel}>
              {formatRM(collection.collected)} of {formatRM(collection.pool)} collected
            </span>
            <CollectionProgressBar
              paidCount={collection.paidCount}
              totalCount={collection.totalCount}
              width={190}
            />
            <StatusPill variant="warning">{collection.totalCount - collection.paidCount} members unpaid</StatusPill>
          </div>
        </div>
      ) : null}

      <div className={styles.columns}>
        <div className={styles.rotation}>
          <span className={styles.sectionLabel}>ROTATION</span>
          {rounds.map((r) => {
            const recipient = membersWithUsers.find((m) => m.member.id === r.recipientMemberId);
            const isMine = recipient?.member.userId === currentUserId;
            const dotClass =
              r.status === "paid-out"
                ? styles.dotDone
                : r.status === "current"
                  ? styles.dotCurrent
                  : isMine
                    ? styles.dotMine
                    : styles.dotUpcoming;
            return (
              <div
                key={r.id}
                className={`${styles.rotationRow} ${r.status === "current" ? styles.rotationRowCurrent : ""}`}
              >
                <span className={`${styles.dot} ${dotClass}`} />
                <div>
                  <div className={styles.rotationName}>
                    {r.roundNumber} · {recipient?.user?.name}
                    {isMine ? " (you)" : ""}
                  </div>
                  <div className={styles.rotationSub}>
                    {r.status === "paid-out"
                      ? `Paid out ${formatDate(r.paidOutAt ?? r.scheduledDate)}${r.paidOutRef ? ` · ref ${r.paidOutRef}` : ""}`
                      : r.movedUpFrom
                        ? `${formatDate(r.scheduledDate)} · moved up from round ${r.movedUpFrom}, reason logged`
                        : formatDate(r.scheduledDate)}
                  </div>
                </div>
                {r.status === "paid-out" ? (
                  <StatusPill variant="success">done</StatusPill>
                ) : r.status === "current" ? (
                  <StatusPill variant="accent">current</StatusPill>
                ) : isMine ? (
                  <StatusPill variant="accentOutline">your turn</StatusPill>
                ) : null}
              </div>
            );
          })}
        </div>

        {currentRound ? (
          <div className={styles.payments}>
            <span className={styles.sectionLabel}>THIS ROUND'S PAYMENTS</span>
            {membersWithUsers.map(({ member, user }) => {
              const payment = getPaymentForMemberRound(bundle, member.id, currentRound.roundNumber);
              const isMe = member.userId === currentUserId;
              const label =
                payment?.status === "paid" || payment?.status === "paid-late"
                  ? `paid ${payment.paidAt ? formatDate(payment.paidAt) : ""}`
                  : payment?.status === "failed"
                    ? "failed · retry"
                    : "unpaid";
              const color = payment?.status === "paid" || payment?.status === "paid-late" ? "var(--success)" : "var(--warning)";
              return (
                <div key={member.id} className={styles.paymentRow}>
                  <span style={{ fontWeight: isMe ? 700 : 400 }}>
                    {user?.name}
                    {isMe ? " (you)" : ""}
                  </span>
                  <span style={{ fontWeight: 700, color }}>{label}</span>
                </div>
              );
            })}
            <Button variant="secondary">Send WhatsApp reminder</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
