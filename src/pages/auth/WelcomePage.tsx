import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { Button, ButtonLink } from "../../components/ui/Button";
import { BrandMark } from "../../components/ui/BrandMark";
import { TextField } from "../../components/ui/Field";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { ApiRequestError } from "../../lib/api";
import layout from "./AuthLayout.module.css";
import styles from "./WelcomePage.module.css";

export function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useAppData();
  const currentUser = useCurrentUser();
  const [inviteCode, setInviteCode] = useState(
    () => (location.state as { inviteCode?: string } | null)?.inviteCode ?? "",
  );
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  if (state.groups.length > 0) {
    return <Navigate to="/home" replace />;
  }

  async function handleFindGroup(e: FormEvent) {
    e.preventDefault();
    if (joining) return;
    if (!inviteCode.trim()) {
      setJoinError("Enter the invite code from your organizer.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const bundle = await actions.joinGroup(inviteCode.trim().toUpperCase());
      navigate(`/groups/${bundle.group.id}`);
    } catch (err) {
      setJoinError(err instanceof ApiRequestError ? err.message : "Couldn't find that group. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className={layout.page}>
      <div className={layout.top}>
        <BrandMark />
      </div>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h1>Welcome{firstName ? `, ${firstName}` : ""}</h1>
          <p className={styles.sub}>Join the group you were invited to, or start one of your own. You can do both later.</p>
        </div>

        <div className={styles.options}>
          <form className={styles.option} onSubmit={handleFindGroup}>
            <div className={styles.optionHead}>
              <ArrowRight size={20} aria-hidden="true" className={styles.optionIcon} />
              <h2>Join a group</h2>
            </div>
            <p className={styles.optionBody}>Someone sent you a code or a WhatsApp link.</p>
            <TextField
              label="Invite code"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setJoinError(null);
              }}
              placeholder="KUTU-4F2M"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              serial
              error={joinError}
            />
            <Button type="submit" block disabled={joining}>
              {joining ? "Finding group…" : "Find group"}
            </Button>
          </form>

          <div className={styles.option}>
            <div className={styles.optionHead}>
              <Plus size={20} aria-hidden="true" className={styles.optionIcon} />
              <h2>Start a group</h2>
            </div>
            <p className={styles.optionBody}>
              You set the amount, how often, and how the payout order is decided. Then you invite members. You become the
              organizer.
            </p>
            <ul className={styles.facts}>
              <li>Nobody is charged until you start the group.</li>
              <li>Members pass a MyKad check before they receive a payout.</li>
            </ul>
            <ButtonLink to="/groups/new" variant="secondary" block className={styles.bottom}>
              Set up a group
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
