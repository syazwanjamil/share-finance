import type { GroupBundle } from "../../../lib/api";
import { getMembersWithUsers, getPaymentForMemberRound, memberName } from "../../../lib/selectors";
import { Avatar } from "../../../components/ui/Avatar";
import { StatusMark } from "../../../components/ui/StatusMark";
import type { MarkKind } from "../../../components/ui/StatusMark";
import { formatDate } from "../../../lib/date";
import { seriesClass } from "../../../lib/series";
import styles from "./MembersRoundsMatrix.module.css";

interface MembersRoundsMatrixProps {
  bundle: GroupBundle;
  currentUserId: string;
}

/** Every member against every round. Rows follow the payout order, so each member's own
 *  payout round steps down the table. */
export function MembersRoundsMatrix({ bundle, currentUserId }: MembersRoundsMatrixProps) {
  const { group, rounds } = bundle;
  const receivesAt = (memberId: string) => rounds.find((r) => r.recipientMemberId === memberId);
  const members = getMembersWithUsers(bundle)
    .filter((m) => m.member.status === "active")
    .sort((a, b) => (receivesAt(a.member.id)?.roundNumber ?? 99) - (receivesAt(b.member.id)?.roundNumber ?? 99));

  return (
    <div className={styles.wrap}>
      <div className={`${styles.scroller} ${seriesClass(group.id)}`} tabIndex={0} role="region" aria-label="Payments by round, scrolls sideways">
        <table className={styles.table}>
          <caption className="visually-hidden">Who has paid each round of {group.name}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.memberHead}>
                Member
              </th>
              {rounds.map((r) => (
                <th
                  key={r.id}
                  scope="col"
                  className={`${styles.roundHead} ${r.roundNumber === group.currentRound ? styles.current : ""}`}
                  aria-current={r.roundNumber === group.currentRound ? "true" : undefined}
                >
                  <span className="serial">R{r.roundNumber.toString().padStart(2, "0")}</span>
                  <span className={styles.roundDate}>{formatDate(r.scheduledDate)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((entry) => {
              const { member, user } = entry;
              const mine = member.userId === currentUserId;
              const myRound = receivesAt(member.id);
              return (
                <tr key={member.id} className={mine ? styles.mine : undefined}>
                  <th scope="row" className={styles.memberCell}>
                    <Avatar initials={user?.initials ?? "?"} size={28} self={mine} />
                    <span className={styles.memberText}>
                      <span className={styles.memberName}>{memberName(entry, currentUserId)}</span>
                      <span className={styles.memberSub}>
                        {member.role === "organizer" ? "Organizer · " : ""}
                        {myRound ? `Receives round ${myRound.roundNumber}` : "No payout round"}
                      </span>
                    </span>
                  </th>
                  {rounds.map((r) => {
                    const payment = getPaymentForMemberRound(bundle, member.id, r.roundNumber);
                    const kind: MarkKind =
                      r.status === "upcoming" && !payment?.paidAt ? "upcoming" : (payment?.status ?? "unpaid");
                    const receives = r.recipientMemberId === member.id;
                    return (
                      <td
                        key={r.id}
                        className={`${styles.cell} ${r.roundNumber === group.currentRound ? styles.current : ""} ${receives ? styles.receives : ""}`}
                      >
                        <StatusMark
                          kind={kind}
                          size={18}
                          label={`Round ${r.roundNumber}: ${kind === "upcoming" ? "not due yet" : kind.replace("-", " ")}${receives ? ", receives this round's pot" : ""}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className={styles.legend} aria-label="Key">
        <li>
          <StatusMark kind="paid" showLabel />
        </li>
        <li>
          <StatusMark kind="paid-late" showLabel />
        </li>
        <li>
          <StatusMark kind="unpaid" showLabel />
        </li>
        <li>
          <StatusMark kind="failed" showLabel />
        </li>
        <li>
          <StatusMark kind="upcoming" showLabel />
        </li>
        <li className={`${styles.legendReceives} ${seriesClass(group.id)}`}>
          <span className={styles.receivesSwatch} aria-hidden="true" />
          Their payout round
        </li>
      </ul>
    </div>
  );
}
