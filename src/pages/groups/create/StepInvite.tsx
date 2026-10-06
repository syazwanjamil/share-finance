import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { PersonRow } from "../../../components/ui/PersonRow";
import { StatusMark } from "../../../components/ui/StatusMark";
import { useCurrentUser } from "../../../state/AppDataContext";
import type { GroupBundle } from "../../../lib/api";
import styles from "./GroupCreatePage.module.css";

function buildInviteMessage(groupName: string, inviteCode: string) {
  return `Join my group "${groupName}" on Share Finance! Use invite code ${inviteCode} to sign up.`;
}

export function StepInvite({ bundle }: { bundle: GroupBundle }) {
  const currentUser = useCurrentUser();
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const filled = bundle.members.filter((m) => m.status === "active").length;
  const invited = bundle.members.filter((m) => m.status === "invited");
  const empty = bundle.members.filter((m) => m.status === "empty").length;
  const inviteMessage = buildInviteMessage(bundle.group.name, bundle.group.inviteCode);
  const needed = bundle.group.totalSlots - filled;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied("ok");
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied("failed");
    }
  }

  function handleShareToWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.form}>
      <div className={styles.head}>
        <h1>Invite members</h1>
        <p className={styles.lead}>Your group is saved as a draft. Nobody is charged until you start.</p>
      </div>

      <div className={styles.codeBox}>
        <span className={styles.codeLabel}>Invite code</span>
        <span className={`serial ${styles.codeValue}`}>{bundle.group.inviteCode}</span>
        <div className={styles.codeActions}>
          <Button onClick={handleShareToWhatsApp}>
            <MessageCircle size={18} aria-hidden="true" /> Share on WhatsApp
          </Button>
          <Button variant="secondary" onClick={handleCopy}>
            <Copy size={16} aria-hidden="true" /> Copy invite message
          </Button>
        </div>
        <p className={styles.copyStatus} aria-live="polite">
          {copied === "ok" ? "Copied. Paste it into your group chat." : null}
          {copied === "failed" ? `Couldn't copy. The code is ${bundle.group.inviteCode}.` : null}
        </p>
      </div>

      <section className={styles.slots} aria-labelledby="slots-heading">
        <div className={styles.slotsHead}>
          <h2 id="slots-heading">Members</h2>
          <span className="tabular">
            {filled} of {bundle.group.totalSlots} joined
          </span>
        </div>
        <ul className={styles.people}>
          <PersonRow
            initials={currentUser.initials}
            self
            name={`${currentUser.name} (you)`}
            meta="Organizer"
            trailing={currentUser.mykadVerified ? <StatusMark kind="done" showLabel label="MyKad checked" /> : undefined}
          />
          {invited.map((member) => (
            <PersonRow
              key={member.id}
              initials="?"
              name={member.invitedPhone ?? "Invited"}
              meta="Invited, hasn't joined yet"
              trailing={<StatusMark kind="waiting" showLabel label="Waiting" />}
            />
          ))}
        </ul>
        {empty > 0 ? (
          <p className={styles.emptySlots}>
            {empty} open slot{empty === 1 ? "" : "s"}
          </p>
        ) : null}
      </section>

      <div className={styles.startBlock}>
        <Button disabled block>
          Start the group
        </Button>
        <p className={styles.helper}>
          {needed > 0
            ? `You can start once all ${bundle.group.totalSlots} members have joined. ${needed} to go.`
            : "Everyone has joined."}
        </p>
      </div>
    </div>
  );
}
