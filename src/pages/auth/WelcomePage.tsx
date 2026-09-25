import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { ApiRequestError } from "../../lib/api";
import layout from "./AuthLayout.module.css";
import styles from "./WelcomePage.module.css";

export function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useAppData();
  const currentUser = useCurrentUser();
  const [selected, setSelected] = useState<"join" | "create">("join");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [inviteCode, setInviteCode] = useState(
    () => (location.state as { inviteCode?: string } | null)?.inviteCode ?? "",
  );
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  if (state.groups.length > 0) {
    return <Navigate to="/home" replace />;
  }

  async function handleFindGroup() {
    if (joining || !inviteCode.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      const bundle = await actions.joinGroup(inviteCode.trim());
      navigate(`/groups/${bundle.group.id}`);
    } catch (err) {
      setJoinError(err instanceof ApiRequestError ? err.message : "Couldn't find that group. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className={layout.page}>
      <div className={styles.wrap}>
        <div className={styles.heading}>Welcome{currentUser.name ? `, ${currentUser.name.split(" ")[0]}` : ""}</div>
        <p className={styles.sub}>Two ways to start. You can do both later.</p>

        <div className={styles.cards}>
          <button
            type="button"
            className={`${styles.optionCard} ${selected === "join" ? styles.optionCardSelected : ""}`}
            onClick={() => setSelected("join")}
          >
            <span className={`${styles.iconBubble} ${styles.iconBubbleAccent}`}>→</span>
            <span className={styles.optionTitle}>Join a group</span>
            <span className={styles.optionBody}>Someone sent you a code or a WhatsApp link.</span>
            <div className={styles.codeField}>
              <span className={styles.codeLabel}>INVITE CODE</span>
              <input
                className={styles.codeInput}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="KUTU-4F2M"
              />
            </div>
            {joinError && <p className={styles.joinError}>{joinError}</p>}
            <Button block onClick={handleFindGroup} disabled={joining || !inviteCode.trim()}>
              {joining ? "Finding…" : "Find group"}
            </Button>
          </button>

          <button
            type="button"
            className={`${styles.optionCard} ${selected === "create" ? styles.optionCardSelected : ""}`}
            onClick={() => setSelected("create")}
          >
            <span className={`${styles.iconBubble} ${styles.iconBubbleNeutral}`}>＋</span>
            <span className={styles.optionTitle}>Create a group</span>
            <span className={styles.optionBody}>
              You set the amount, frequency and payout order, then invite members.
            </span>
            <div className={styles.bullets}>
              <span>· You become the organizer</span>
              <span>· Identity check before first payout</span>
            </div>
            <Button variant="secondary" block onClick={() => navigate("/groups/new")}>
              Start setup
            </Button>
          </button>
        </div>

        {!bannerDismissed && (
          <div className={styles.banner}>
            <div className={styles.bannerText}>
              <span className={styles.bannerTitle}>Verify your identity (MyKad)</span>
              <span className={styles.bannerSub}>
                Required before you receive a payout. Takes 2 minutes.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <StatusPill variant="neutral">Do it later</StatusPill>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
