import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { FieldGroup, SelectField, TextField } from "../../../components/ui/Field";
import { Stepper } from "../../../components/ui/Stepper";
import { Switch } from "../../../components/ui/Switch";
import { formatRM } from "../../../lib/currency";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

interface StepBasicsProps {
  draft: GroupDraft;
  onChange: (patch: Partial<GroupDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepBasics({ draft, onChange, onNext, onBack }: StepBasicsProps) {
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    name: !draft.name.trim() ? "Give the group a name members will recognise." : null,
    amount: draft.contributionAmount <= 0 ? "Enter how much each member pays per round." : null,
    date: !draft.firstPayoutDate ? "Choose the date of the first payout." : null,
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (errors.name || errors.amount || errors.date) return;
    onNext();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.head}>
        <h1>Group basics</h1>
        <p className={styles.lead}>You can change these until the group starts. Nobody is charged before then.</p>
      </div>

      <TextField
        label="Group name"
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Ibu-Ibu Blok C"
        maxLength={60}
        autoFocus
        error={submitted ? errors.name : null}
      />

      <div className={styles.row}>
        <TextField
          label="Each member pays"
          prefix="RM"
          type="number"
          inputMode="decimal"
          min={1}
          value={draft.contributionAmount || ""}
          onChange={(e) => onChange({ contributionAmount: Number(e.target.value) || 0 })}
          placeholder="500"
          error={submitted ? errors.amount : null}
        />
        <SelectField
          label="How often"
          value={draft.frequency}
          onChange={(e) => onChange({ frequency: e.target.value as GroupDraft["frequency"] })}
        >
          <option value="monthly">Every month</option>
          <option value="weekly">Every week</option>
        </SelectField>
      </div>

      <div className={styles.row}>
        <FieldGroup label="Members" hint="One payout round per member.">
          <Stepper value={draft.totalSlots} onChange={(v) => onChange({ totalSlots: v })} unit="members" />
        </FieldGroup>
        <TextField
          label="First payout"
          type="date"
          value={draft.firstPayoutDate}
          onChange={(e) => onChange({ firstPayoutDate: e.target.value })}
          error={submitted ? errors.date : null}
        />
      </div>

      <div className={styles.potLine}>
        <span>Each round's pot</span>
        <strong className="figures">{formatRM(draft.contributionAmount * draft.totalSlots)}</strong>
      </div>

      <Switch
        checked={draft.lateFeeEnabled}
        onChange={(v) => onChange({ lateFeeEnabled: v })}
        label="Late fee"
        description="RM 20 if a member pays more than 3 days late. Late fees go into the pot, not to the organizer."
      />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onBack}>
          Cancel
        </Button>
        <Button type="submit">Next: payout order</Button>
      </div>
    </form>
  );
}
