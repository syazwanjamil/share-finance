import { Button } from "../../../components/ui/Button";
import { StatusPill } from "../../../components/ui/StatusPill";
import { MemberRow } from "../../../components/ui/MemberRow";
import { useCurrentUser } from "../../../state/AppDataContext";
import type { GroupBundle } from "../../../lib/api";
import styles from "./GroupCreatePage.module.css";

interface StepInviteProps {
  bundle: GroupBundle;
  onBack: () => void;
}

export function StepInvite({ bundle, onBack }: StepInviteProps) {
  const currentUser = useCurrentUser();
  const filled = bundle.members.filter((m) => m.status === "active").length;
  const invited = bundle.members.filter((m) => m.status === "invited");
  const empty = bundle.members.filter((m) => m.status === "empty").length;

  return (
    <>
      <div className={styles.title}>Invite members</div>

      <div className={styles.codeBox}>
        <span className={styles.codeLabel}>INVITE CODE</span>
        <span className={styles.codeValue}>{bundle.group.inviteCode}</span>
        <div className={styles.codeActions}>
          <Button variant="secondary">Copy link</Button>
          <Button variant="success">Share to WhatsApp</Button>
        </div>
      </div>

      <div className={styles.slotsHeader}>
        <span className={styles.slotsHeaderLabel}>SLOTS FILLED</span>
        <span>
          {filled} of {bundle.group.totalSlots}
        </span>
      </div>

      <MemberRow
        initials={currentUser.initials}
        name={`${currentUser.name} (you)`}
        meta="Organizer"
        trailing={<StatusPill variant="success">✓ verified</StatusPill>}
      />
      {invited.map((member) => (
        <MemberRow
          key={member.id}
          initials="?"
          name={`${member.invitedPhone} — invited`}
          trailing={<StatusPill variant="neutral">remind</StatusPill>}
        />
      ))}
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
        Start group (needs {bundle.group.totalSlots} members)
      </Button>
      <p className={styles.helper}>Saved as a draft. Nobody is charged until you start.</p>
    </>
  );
}
