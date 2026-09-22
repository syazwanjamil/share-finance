import { useNavigate } from "react-router-dom";
import type { GroupBundle } from "../../lib/api";
import { StatusPill } from "../../components/ui/StatusPill";
import { RoundProgressBar } from "../../components/ui/RoundProgressBar";
import {
  computeRoundCollection,
  getMemberByUserId,
  getUserById,
  hasUserPaidCurrentRound,
  isOrganizer,
} from "../../lib/selectors";
import { formatRM } from "../../lib/currency";
import { formatMonthYear } from "../../lib/date";
import styles from "./GroupSummaryCard.module.css";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter((w) => /[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface GroupSummaryCardProps {
  bundle: GroupBundle;
  currentUserId: string;
}

export function GroupSummaryCard({ bundle, currentUserId }: GroupSummaryCardProps) {
  const navigate = useNavigate();
  const { group, rounds } = bundle;
  const organizer = isOrganizer(bundle, currentUserId);
  const paid = hasUserPaidCurrentRound(bundle, currentUserId);
  const collection = computeRoundCollection(bundle, group.currentRound);

  const myMember = getMemberByUserId(bundle, currentUserId);
  const myUpcomingRound = rounds.find(
    (r) => r.recipientMemberId === myMember?.id && (r.status === "current" || r.status === "upcoming"),
  );
  const isMyPayoutNext = myUpcomingRound?.status === "current";

  const organizerUser = getUserById(bundle, group.organizerId);

  return (
    <button type="button" className={styles.card} onClick={() => navigate(`/groups/${group.id}`)}>
      <div className={styles.top}>
        <div className={styles.identity}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--avatar-bg)",
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text)",
              flexShrink: 0,
            }}
          >
            {initialsFor(group.name)}
          </span>
          <div className={styles.names}>
            <span className={styles.name}>{group.name}</span>
            <span className={styles.meta}>
              {group.totalSlots} members · {formatRM(group.contributionAmount)}/{group.frequency === "monthly" ? "month" : "week"} · organizer:{" "}
              {organizer ? "you" : organizerUser?.name}
            </span>
          </div>
        </div>
        <div className={styles.pills}>
          {isMyPayoutNext ? <StatusPill variant="accent">your payout next</StatusPill> : null}
          {paid ? (
            <StatusPill variant="success">✓ paid</StatusPill>
          ) : (
            <StatusPill variant="warning">you haven't paid</StatusPill>
          )}
        </div>
      </div>

      <RoundProgressBar
        statuses={rounds.map((r) => r.status)}
        currentRound={group.currentRound}
        totalRounds={group.totalRounds}
      />

      <div className={styles.footer}>
        <span>
          Round {group.currentRound} of {group.totalRounds} · pool {formatRM(collection.pool)} ·{" "}
          {collection.paidCount} of {collection.totalCount} paid
        </span>
        {myUpcomingRound ? (
          <span>
            Your turn: round {myUpcomingRound.roundNumber} ({formatMonthYear(myUpcomingRound.scheduledDate)})
          </span>
        ) : null}
      </div>
    </button>
  );
}
