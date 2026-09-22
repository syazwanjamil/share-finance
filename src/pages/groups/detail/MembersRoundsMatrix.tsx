import { Fragment, useState } from "react";
import type { GroupBundle } from "../../../lib/api";
import { getMembersWithUsers, getPaymentForMemberRound } from "../../../lib/selectors";
import { Avatar } from "../../../components/ui/Avatar";
import { formatDate } from "../../../lib/date";
import styles from "./MembersRoundsMatrix.module.css";

interface MembersRoundsMatrixProps {
  bundle: GroupBundle;
}

const VISIBLE_ROWS = 5;

export function MembersRoundsMatrix({ bundle }: MembersRoundsMatrixProps) {
  const [showAll, setShowAll] = useState(false);
  const { group, rounds } = bundle;
  const windowRounds = rounds.slice(0, Math.min(6, rounds.length));
  const membersWithUsers = getMembersWithUsers(bundle).filter((m) => m.member.status === "active");
  const visibleMembers = showAll ? membersWithUsers : membersWithUsers.slice(0, VISIBLE_ROWS);
  const hiddenCount = membersWithUsers.length - visibleMembers.length;

  return (
    <div>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `1.6fr repeat(${windowRounds.length}, 1fr) 1.1fr` }}
      >
        <div className={styles.headerCell}>MEMBER</div>
        {windowRounds.map((r) => (
          <div
            key={r.id}
            className={`${styles.headerCell} ${styles.headerCellCenter} ${r.roundNumber === group.currentRound ? styles.headerCellCurrent : ""}`}
          >
            R{r.roundNumber}
          </div>
        ))}
        <div className={`${styles.headerCell} ${styles.headerCellRight}`}>RECEIVES</div>

        {visibleMembers.map(({ member, user }) => {
          const myRound = rounds.find((r) => r.recipientMemberId === member.id);
          const isOrganizer = member.role === "organizer";
          return (
            <Fragment key={member.id}>
              <div className={styles.memberCell}>
                <Avatar initials={user?.initials ?? "?"} size={22} />
                <div>
                  <div className={styles.memberName}>
                    {user?.name}
                    {isOrganizer ? " (you)" : ""}
                  </div>
                  <div className={styles.memberSub}>
                    {isOrganizer ? "organizer" : user?.mykadVerified ? "✓ verified" : ""}
                  </div>
                </div>
              </div>
              {windowRounds.map((r) => {
                const payment = getPaymentForMemberRound(bundle, member.id, r.roundNumber);
                const isCurrent = r.roundNumber === group.currentRound;
                let symbol = "○";
                let cls = styles.dotFuture;
                if (r.status !== "upcoming") {
                  if (payment?.status === "paid") {
                    symbol = "●";
                    cls = styles.dotPaid;
                  } else if (payment?.status === "paid-late") {
                    symbol = "◐";
                    cls = styles.dotLate;
                  } else if (payment?.status === "unpaid" || (isCurrent && !payment)) {
                    symbol = "✕";
                    cls = styles.dotUnpaid;
                  }
                }
                return (
                  <div
                    key={`${member.id}-${r.id}`}
                    className={`${styles.dotCell} ${cls} ${isCurrent ? styles.dotCellCurrent : ""}`}
                  >
                    {symbol}
                  </div>
                );
              })}
              <div className={styles.receivesCell}>
                {myRound
                  ? myRound.status === "paid-out"
                    ? `R${myRound.roundNumber} · paid out`
                    : myRound.status === "current"
                      ? `R${myRound.roundNumber} · this round`
                      : `R${myRound.roundNumber} · ${formatDate(myRound.scheduledDate)}`
                  : "—"}
              </div>
            </Fragment>
          );
        })}

        {hiddenCount > 0 ? (
          <div className={styles.moreRow}>
            <span>{hiddenCount} more members</span>
            <button type="button" className={styles.showAllLink} onClick={() => setShowAll(true)}>
              Show all
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.legend}>
        <span className={styles.dotPaid}>● paid</span>
        <span className={styles.dotLate}>◐ paid late</span>
        <span className={styles.dotUnpaid}>✕ unpaid</span>
        <span className={styles.dotFuture}>○ future round</span>
      </div>
    </div>
  );
}
