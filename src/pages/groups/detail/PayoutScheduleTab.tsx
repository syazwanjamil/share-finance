import type { GroupBundle } from "../../../mock/groups";
import { getMembersWithUsers } from "../../../mock/selectors";
import { StatusPill } from "../../../components/ui/StatusPill";
import { formatDate } from "../../../lib/date";
import styles from "./GroupDetailPage.module.css";

export function PayoutScheduleTab({ bundle }: { bundle: GroupBundle }) {
  const membersWithUsers = getMembersWithUsers(bundle);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {bundle.rounds.map((r) => {
        const recipient = membersWithUsers.find((m) => m.member.id === r.recipientMemberId);
        return (
          <div
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid var(--border-subtle)",
              fontSize: 12,
            }}
          >
            <span>
              Round {r.roundNumber} · {formatDate(r.scheduledDate)} · {recipient?.user?.name}
            </span>
            <StatusPill variant={r.status === "paid-out" ? "success" : r.status === "current" ? "accent" : "neutral"}>
              {r.status === "paid-out" ? "paid out" : r.status === "current" ? "this round" : "upcoming"}
            </StatusPill>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyTab({ label }: { label: string }) {
  return <div className={styles.stub}>{label} — coming soon.</div>;
}
