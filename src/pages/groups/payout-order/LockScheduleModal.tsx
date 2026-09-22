import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { StatusPill } from "../../../components/ui/StatusPill";
import { formatDate } from "../../../lib/date";
import styles from "./LockScheduleModal.module.css";

export interface OrderDiffEntry {
  roundNumber: number;
  scheduledDate: string;
  oldName: string;
  newName: string;
}

interface LockScheduleModalProps {
  diff: OrderDiffEntry[];
  totalMembers: number;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const CHANNELS = ["WhatsApp", "in-app"] as const;

export function LockScheduleModal({
  diff,
  totalMembers,
  onClose,
  onConfirm,
}: LockScheduleModalProps) {
  const [reason, setReason] = useState(
    diff.length > 0
      ? `${diff[0].newName} asked for an earlier turn. ${diff[0].oldName} agreed to swap.`
      : "",
  );
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("WhatsApp");
  const [requireConfirm, setRequireConfirm] = useState(true);

  return (
    <Modal onClose={onClose} labelledBy="lock-schedule-title">
      <span id="lock-schedule-title" className={styles.title}>
        Lock this schedule?
      </span>
      <p className={styles.body}>
        All {totalMembers} members get a WhatsApp message with the new order and
        your reason.
      </p>

      <div className={styles.changesBox}>
        <span className={styles.changeLabel}>CHANGES</span>
        {diff.map((d) => (
          <div key={d.roundNumber} className={styles.changeRow}>
            <span>
              Round {d.roundNumber} · {formatDate(d.scheduledDate)}
            </span>
            <span>
              <span className={styles.oldName}>{d.oldName}</span> →{" "}
              <strong>{d.newName}</strong>
            </span>
          </div>
        ))}
      </div>

      <div className={styles.reasonBox}>
        <span className={styles.reasonLabel}>
          REASON (SHARED WITH THE GROUP)
        </span>
        <textarea
          className={styles.textarea}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className={styles.notifyRow}>
        <span className={styles.notifyLabel}>Notify by</span>
        <div className={styles.channels}>
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <StatusPill variant={channel === c ? "success" : "neutral"}>
                {c}
              </StatusPill>
            </button>
          ))}
        </div>
      </div>

      <label className={styles.confirmNote}>
        <input
          type="checkbox"
          checked={requireConfirm}
          onChange={(e) => setRequireConfirm(e.target.checked)}
        />
        Require the other member to confirm the swap before it takes effect
      </label>

      <div className={styles.footer}>
        <Button
          block
          disabled={!reason.trim()}
          onClick={() => onConfirm(reason)}
        >
          Lock &amp; notify {totalMembers} members
        </Button>
        <Button variant="secondary" block onClick={onClose}>
          Cancel
        </Button>
        <p className={styles.footerNote}>
          Every reorder stays in the ledger with your name and timestamp.
        </p>
      </div>
    </Modal>
  );
}
