import { Button } from "../../../components/ui/Button";
import { StatusPill } from "../../../components/ui/StatusPill";
import { MemberRow } from "../../../components/ui/MemberRow";
import { useAppData } from "../../../state/AppDataContext";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

interface StepInviteProps {
  draft: GroupDraft;
  inviteCode: string;
  onBack: () => void;
}

export function StepInvite({ draft, inviteCode, onBack }: StepInviteProps) {
  const { state } = useAppData();
  const filled = Math.min(3, draft.totalSlots);
  const empty = Math.max(0, draft.totalSlots - filled);

  return (
    <>
      <div className={styles.title}>Invite members</div>

      <div className={styles.codeBox}>
        <span className={styles.codeLabel}>INVITE CODE</span>
        <span className={styles.codeValue}>{inviteCode}</span>
        <div className={styles.codeActions}>
          <Button variant="secondary">Copy link</Button>
          <Button variant="success">Share to WhatsApp</Button>
        </div>
      </div>

      <div className={styles.slotsHeader}>
        <span className={styles.slotsHeaderLabel}>SLOTS FILLED</span>
        <span>
          {filled} of {draft.totalSlots}
        </span>
      </div>

      <MemberRow
        initials={state.currentUser.initials}
        name={`${state.currentUser.name} (you)`}
        meta="Organizer"
        trailing={<StatusPill variant="success">✓ verified</StatusPill>}
      />
      <MemberRow
        initials="R"
        name="Rina H."
        trailing={<StatusPill variant="success">joined</StatusPill>}
      />
      <MemberRow
        initials="?"
        name="+60 19-882 1130 — invited"
        trailing={<StatusPill variant="neutral">remind</StatusPill>}
      />
      {empty > 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "7px 0" }}>
          {empty} empty slot{empty === 1 ? "" : "s"}
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
      <Button disabled block>
        Start group (needs {draft.totalSlots} members)
      </Button>
      <p className={styles.helper}>Saved as a draft. Nobody is charged until you start.</p>
    </>
  );
}
