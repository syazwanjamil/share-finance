import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { PageHeader, Section } from "../../components/layout/Page";
import { Button, ButtonLink } from "../../components/ui/Button";
import { DetailList } from "../../components/ui/DetailList";
import { StatusMark } from "../../components/ui/StatusMark";
import { formatDateFull } from "../../lib/date";
import styles from "./AccountPage.module.css";

function displayPhone(e164: string): string {
  const local = e164.replace(/^\+60/, "");
  return `+60 ${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
}

export function AccountPage() {
  const navigate = useNavigate();
  const { actions } = useAppData();
  const user = useCurrentUser();

  async function handleLogout() {
    await actions.logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <PageHeader title="Account" lead="What members of your groups see, and what you need before your payout turn." />

      <Section title="You" id="you">
        <DetailList
          items={[
            { term: "Name", value: user.name },
            { term: "WhatsApp number", value: <span className="tabular">{displayPhone(user.phone)}</span> },
          ]}
        />
      </Section>

      <Section title="Before your payout" id="payout" lead="Both are needed before a pot can be sent to you.">
        <ul className={styles.checks}>
          <li className={styles.check}>
            <StatusMark kind={user.mykadVerified ? "done" : "waiting"} size={20} />
            <div className={styles.checkText}>
              <p className={styles.checkTitle}>MyKad identity check</p>
              <p className={styles.checkBody}>
                {user.mykadVerified
                  ? user.mykadVerifiedDate
                    ? `Passed on ${formatDateFull(user.mykadVerifiedDate)}.`
                    : "Passed."
                  : "Not done yet."}
              </p>
            </div>
          </li>
          <li className={styles.check}>
            <StatusMark kind={user.stripeConnectOnboarded ? "done" : "waiting"} size={20} />
            <div className={styles.checkText}>
              <p className={styles.checkTitle}>Payout account</p>
              <p className={styles.checkBody}>
                {user.stripeConnectOnboarded
                  ? "Set up with Stripe, in your name."
                  : "Not set up yet. Pots are sent through Stripe to an account in your name."}
              </p>
            </div>
            <ButtonLink to="/settings/payout" variant="secondary">
              {user.stripeConnectOnboarded ? "Update" : "Set up"}
            </ButtonLink>
          </li>
        </ul>
      </Section>

      <div>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" /> Log out
        </Button>
      </div>
    </>
  );
}
