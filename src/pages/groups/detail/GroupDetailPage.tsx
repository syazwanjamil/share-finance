import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData, useCurrentUser, useGroupBundle } from "../../../state/AppDataContext";
import {
  computePoolSummary,
  computeRoundCollection,
  getCurrentRound,
  getMembersWithUsers,
  isOrganizer,
} from "../../../lib/selectors";
import { StatusPill } from "../../../components/ui/StatusPill";
import { StatTile } from "../../../components/ui/StatTile";
import { PayoutSetupBanner } from "../../../components/PayoutSetupBanner";
import { Button } from "../../../components/ui/Button";
import { Tabs } from "../../../components/ui/Tabs";
import { formatRM } from "../../../lib/currency";
import { formatDate, formatMonthYear } from "../../../lib/date";
import { MembersRoundsMatrix } from "./MembersRoundsMatrix";
import { MemberTimeline } from "./MemberTimeline";
import { PayoutScheduleTab, EmptyTab } from "./PayoutScheduleTab";
import styles from "./GroupDetailPage.module.css";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter((w) => /[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const bundle = useGroupBundle(groupId);
  const { actions } = useAppData();
  const organizer = bundle ? isOrganizer(bundle, currentUser.id) : false;
  const [tab, setTab] = useState<string>(organizer ? "matrix" : "timeline");
  const [reminding, setReminding] = useState(false);
  const [remindError, setRemindError] = useState<string | null>(null);

  useEffect(() => {
    setTab(organizer ? "matrix" : "timeline");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const currentRound = bundle ? getCurrentRound(bundle) : undefined;
  const collection = bundle && currentRound ? computeRoundCollection(bundle, currentRound.roundNumber) : null;
  const poolSummary = useMemo(() => (bundle ? computePoolSummary(bundle) : null), [bundle]);
  const recipient =
    bundle && currentRound
      ? getMembersWithUsers(bundle).find((m) => m.member.id === currentRound.recipientMemberId)
      : undefined;

  if (!bundle) {
    return <div className={styles.stub}>Group not found.</div>;
  }

  const { group } = bundle;
  const unpaidCount = collection ? collection.totalCount - collection.paidCount : 0;

  async function handleRemindUnpaid() {
    setRemindError(null);
    setReminding(true);
    try {
      await actions.remindUnpaid(group.id);
    } catch {
      setRemindError("Couldn't send reminders — please try again.");
    } finally {
      setReminding(false);
    }
  }

  const tabs = organizer
    ? [
        { id: "matrix", label: "Members & rounds" },
        { id: "schedule", label: "Payout schedule" },
        { id: "ledger", label: "Ledger" },
        { id: "settings", label: "Settings" },
      ]
    : [
        { id: "timeline", label: "Timeline" },
        { id: "schedule", label: "Payout schedule" },
        { id: "ledger", label: "Ledger" },
        { id: "settings", label: "Settings" },
      ];

  return (
    <>
      {!currentUser.stripeConnectOnboarded && <PayoutSetupBanner />}
      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.avatar}>{initialsFor(group.name)}</span>
          <div className={styles.names}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{group.name}</span>
              {group.trustAccountVerified ? (
                <StatusPill variant="success">🔒 trust account verified</StatusPill>
              ) : null}
            </div>
            <span className={styles.meta}>
              {group.totalSlots} members · {formatRM(group.contributionAmount)} · round {group.currentRound} of{" "}
              {group.totalRounds} · you are the {organizer ? "organizer" : "member"}
            </span>
          </div>
        </div>
        {organizer ? (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => navigate(`/groups/${group.id}/payout-order`)}>
              Manage payout order
            </Button>
            {currentRound && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/groups/${group.id}/payout/${currentRound.roundNumber}`)}
              >
                Release payout
              </Button>
            )}
            <Button onClick={handleRemindUnpaid} disabled={unpaidCount === 0 || reminding}>
              {reminding ? "Sending…" : `Remind unpaid (${unpaidCount})`}
            </Button>
          </div>
        ) : null}
      </div>
      {remindError && (
        <div style={{ color: "var(--warning)", marginTop: "0.5rem" }}>{remindError}</div>
      )}

      {collection && currentRound && poolSummary ? (
        <div className={styles.statsRow}>
          <StatTile label="Pool this round" value={formatRM(collection.pool)} />
          <StatTile
            label="Collected"
            value={formatRM(collection.collected)}
            sub={`${collection.paidCount} of ${collection.totalCount} members`}
          />
          <StatTile
            label={`Pays out ${formatDate(currentRound.scheduledDate)} to`}
            value={recipient?.user?.name ?? "—"}
            sub={currentRound.priorityRequest ? `priority: ${currentRound.priorityRequest.reason.split(" — ")[0]}` : undefined}
          />
          <StatTile
            label="Cycle ends"
            value={formatMonthYear(poolSummary.endsAt)}
            sub={`${group.totalRounds - group.currentRound} rounds left`}
          />
        </div>
      ) : null}

      <Tabs tabs={tabs} activeId={tab} onChange={setTab} />

      <div className={styles.tabPanel}>
        {tab === "matrix" && <MembersRoundsMatrix bundle={bundle} />}
        {tab === "timeline" && <MemberTimeline bundle={bundle} currentUserId={currentUser.id} />}
        {tab === "schedule" && <PayoutScheduleTab bundle={bundle} />}
        {tab === "ledger" && <EmptyTab label="Ledger" />}
        {tab === "settings" && <EmptyTab label="Settings" />}
      </div>
    </>
  );
}
