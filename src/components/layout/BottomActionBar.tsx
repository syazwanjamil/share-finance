import { useNavigate } from "react-router-dom";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { getPaymentsDue } from "../../lib/selectors";
import { formatRM } from "../../lib/currency";
import { relativeDays } from "../../lib/date";
import { Button } from "../ui/Button";
import styles from "./BottomActionBar.module.css";

export function BottomActionBar() {
  const { state } = useAppData();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const due = getPaymentsDue(state.groups, currentUser.id);

  if (due.length === 0) return null;
  const next = due[0];

  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span className={styles.due}>
          Due {relativeDays(next.round.scheduledDate)} · {next.bundle.group.name}
        </span>
        <span className={styles.amount}>{formatRM(next.amount)}</span>
      </div>
      <Button onClick={() => navigate(`/pay/${next.bundle.group.id}/${next.round.roundNumber}`)}>
        Pay now
      </Button>
    </div>
  );
}
