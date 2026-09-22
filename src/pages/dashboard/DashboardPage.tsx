import { useNavigate } from "react-router-dom";
import { useAppData } from "../../state/AppDataContext";
import { getPaymentsDue, getUpcomingPayouts } from "../../mock/selectors";
import { Button } from "../../components/ui/Button";
import { NextPaymentCard } from "./NextPaymentCard";
import { NextPayoutCard } from "./NextPayoutCard";
import { GroupSummaryCard } from "./GroupSummaryCard";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const { state } = useAppData();
  const due = getPaymentsDue(state.groups, state.currentUser.id);
  const payouts = getUpcomingPayouts(state.groups, state.currentUser.id);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.greeting}>
          <span className={styles.hi}>Hi, {state.currentUser.name.split(" ")[0]}</span>
          <span className={styles.subGreeting}>
            {state.groups.length} active groups · {due.length} payment{due.length === 1 ? "" : "s"} due this
            week
          </span>
        </div>
        <Button variant="secondary" onClick={() => navigate("/groups/new")}>
          ＋ New group
        </Button>
      </div>

      <div className={styles.cardsRow}>
        {due[0] ? <NextPaymentCard due={due[0]} /> : null}
        {payouts[0] ? <NextPayoutCard payout={payouts[0]} /> : null}
      </div>

      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>YOUR GROUPS</span>
        <button type="button" className={styles.link}>
          Join with a code
        </button>
      </div>

      <div className={styles.groupList}>
        {state.groups.map((bundle) => (
          <GroupSummaryCard key={bundle.group.id} bundle={bundle} currentUserId={state.currentUser.id} />
        ))}
      </div>
    </>
  );
}
