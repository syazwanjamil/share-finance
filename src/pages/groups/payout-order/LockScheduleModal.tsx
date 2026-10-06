import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { FormError, TextAreaField } from "../../../components/ui/Field";
import { ApiRequestError } from "../../../lib/api";
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
  onConfirm: (reason: string) => Promise<void>;
}

export function LockScheduleModal({ diff, totalMembers, onClose, onConfirm }: LockScheduleModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!reason.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save the new order. Please try again.");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="lock-title" describedBy="lock-desc">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.head}>
          <h2 id="lock-title">Confirm the new payout order</h2>
          <p id="lock-desc" className={styles.body}>
            All {totalMembers} members get a WhatsApp message with the new order and your reason.
          </p>
        </div>

        <ol className={styles.changes} aria-label="Changes">
          {diff.map((d) => (
            <li key={d.roundNumber} className={styles.change}>
              <span className={styles.changeRound}>
                <span className="serial">R{d.roundNumber.toString().padStart(2, "0")}</span>
                <span className={styles.changeDate}>{formatDate(d.scheduledDate)}</span>
              </span>
              <span className={styles.changeNames}>
                <span className={styles.oldName}>
                  <span className="visually-hidden">was </span>
                  {d.oldName}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
                <strong>
                  <span className="visually-hidden">now </span>
                  {d.newName}
                </strong>
              </span>
            </li>
          ))}
        </ol>

        <TextAreaField
          label="Reason, shared with the whole group"
          hint="Say who asked and why, and that the other member agreed."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. Aminah needs her turn earlier for her son's school fees. Farah agreed to swap."
          maxLength={500}
          data-autofocus
          error={touched && !reason.trim() ? "Add a reason. Members see it next to the change." : null}
        />

        {error ? <FormError>{error}</FormError> : null}

        <div className={styles.footer}>
          <Button type="submit" block disabled={saving}>
            {saving ? "Saving…" : `Save and tell ${totalMembers} members`}
          </Button>
          <Button variant="secondary" block onClick={onClose}>
            Keep editing
          </Button>
          <p className={styles.footerNote}>The change is recorded in the ledger with your name and the time.</p>
        </div>
      </form>
    </Modal>
  );
}
