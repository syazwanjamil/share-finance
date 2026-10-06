import type { GroupBundle, PayoutOrderChange } from "../../../lib/api";
import { getMembersWithUsers, memberName } from "../../../lib/selectors";
import { reasonForRound } from "../../../lib/ledger";
import { formatDate, formatDateFull } from "../../../lib/date";
import { formatRM } from "../../../lib/currency";
import { seriesClass } from "../../../lib/series";
import { Avatar } from "../../../components/ui/Avatar";
import { StatusMark } from "../../../components/ui/StatusMark";
import styles from "./PayoutOrderList.module.css";

interface PayoutOrderListProps {
  bundle: GroupBundle;
  history: PayoutOrderChange[];
  currentUserId: string;
}

/** The agreed payout order, one row per round, with the reason on record for any change. */
export function PayoutOrderList({ bundle, history, currentUserId }: PayoutOrderListProps) {
  const members = getMembersWithUsers(bundle);
  const pot = bundle.group.contributionAmount * bundle.group.totalSlots;

  return (
    <ol className={`${styles.list} ${seriesClass(bundle.group.id)}`}>
      {bundle.rounds.map((round) => {
        const recipient = members.find((m) => m.member.id === round.recipientMemberId);
        const mine = recipient?.member.userId === currentUserId;
        const reason = reasonForRound(bundle, round.id, history);
        const current = round.status === "current" || round.status === "held";
        return (
          <li
            key={round.id}
            className={`${styles.row} ${current ? styles.current : ""} ${round.status === "paid-out" ? styles.done : ""}`}
            aria-current={current ? "step" : undefined}
          >
            <span className={`serial ${styles.number}`}>R{round.roundNumber.toString().padStart(2, "0")}</span>
            <Avatar initials={recipient?.user?.initials ?? "?"} size={34} self={mine} />
            <div className={styles.main}>
              <p className={styles.name}>
                {memberName(recipient, currentUserId)}
                {mine ? <span className={styles.yourTurn}>Your turn</span> : null}
              </p>
              <p className={styles.meta}>
                {round.status === "paid-out" ? (
                  <>
                    Paid out {formatDate(round.paidOutAt ?? round.scheduledDate)}
                    {round.paidOutRef ? (
                      <>
                        {" · "}
                        <span className="serial">{round.paidOutRef}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    {formatDateFull(round.scheduledDate)} · {formatRM(pot)}
                  </>
                )}
              </p>
              {reason ? (
                <p className={styles.reason}>
                  {round.movedUpFrom ? `Moved up from round ${round.movedUpFrom}. ` : "Order changed. "}
                  <span className={styles.reasonText}>“{reason}”</span>
                </p>
              ) : round.movedUpFrom ? (
                <p className={styles.reason}>Moved up from round {round.movedUpFrom}.</p>
              ) : null}
            </div>
            <div className={styles.state}>
              {round.status === "paid-out" ? (
                <StatusMark kind="done" showLabel label="Paid out" />
              ) : round.status === "held" ? (
                <StatusMark kind="blocked" showLabel label="On hold" />
              ) : current ? (
                <span className={styles.nowLabel}>This round</span>
              ) : (
                <StatusMark kind="upcoming" showLabel label="Upcoming" />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
