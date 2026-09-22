import { Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Stepper } from "../../../components/ui/Stepper";
import { formatRM } from "../../../lib/currency";
import { formatMonthYear } from "../../../lib/date";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

interface StepBasicsProps {
  draft: GroupDraft;
  onChange: (patch: Partial<GroupDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepBasics({ draft, onChange, onNext, onBack }: StepBasicsProps) {
  const pool = draft.contributionAmount * draft.totalSlots;
  const endDate = draft.firstPayoutDate ? new Date(draft.firstPayoutDate) : null;
  endDate?.setMonth(endDate.getMonth() + (draft.totalSlots - 1));

  return (
    <>
      <div className={styles.title}>Group basics</div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>GROUP NAME</span>
        <input
          className={styles.input}
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>CONTRIBUTION EACH</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={draft.contributionAmount}
            onChange={(e) => onChange({ contributionAmount: Number(e.target.value) || 0 })}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>FREQUENCY</span>
          <select
            className={styles.select}
            value={draft.frequency}
            onChange={(e) => onChange({ frequency: e.target.value as GroupDraft["frequency"] })}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>MEMBERS / SLOTS</span>
          <Stepper value={draft.totalSlots} onChange={(v) => onChange({ totalSlots: v })} />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>FIRST PAYOUT DATE</span>
          <input
            className={styles.input}
            type="date"
            value={draft.firstPayoutDate}
            onChange={(e) => onChange({ firstPayoutDate: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryText}>
          <span className={styles.summaryLabel}>Pool paid out each round</span>
          <span className={styles.summarySub}>
            {draft.totalSlots} members × {formatRM(draft.contributionAmount)} · {draft.totalSlots} rounds
            {endDate ? ` · ends ${formatMonthYear(endDate.toISOString())}` : ""}
          </span>
        </div>
        <span className={styles.summaryValue}>{formatRM(pool)}</span>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={draft.lateFeeEnabled}
          onChange={(e) => onChange({ lateFeeEnabled: e.target.checked })}
          style={{ display: "none" }}
        />
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: draft.lateFeeEnabled ? "var(--accent)" : "transparent",
            border: draft.lateFeeEnabled ? "none" : "1.5px solid var(--border)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {draft.lateFeeEnabled ? <Check size={11} /> : null}
        </span>
        <span className={styles.checkboxText}>
          Charge a late fee of RM 20 after 3 days. Collected fees go to the pool, not to the organizer.
        </span>
      </label>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!draft.name.trim() || draft.contributionAmount <= 0 || !draft.firstPayoutDate}
        >
          Next: payout order
        </Button>
      </div>
    </>
  );
}
