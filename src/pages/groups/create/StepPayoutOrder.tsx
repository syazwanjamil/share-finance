import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import type { PayoutOrderMethod } from "../../../types";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

interface StepPayoutOrderProps {
  draft: GroupDraft;
  onChange: (patch: Partial<GroupDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  creating: boolean;
}

const OPTIONS: { id: PayoutOrderMethod; title: string; body: string }[] = [
  {
    id: "assigned",
    title: "I set the order",
    body: "You put members in the order the group agreed. If someone moves up, you add a reason everyone can read.",
  },
  {
    id: "random",
    title: "Random draw",
    body: "Once every slot is filled, the order is drawn once. Every member sees the same result and when it was drawn.",
  },
  {
    id: "join-order",
    title: "Order of joining",
    body: "The first member to accept the invite receives the first payout, and so on.",
  },
];

export function StepPayoutOrder({ draft, onChange, onNext, onBack, creating }: StepPayoutOrderProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.head}>
        <h1>How is the payout order decided?</h1>
        <p className={styles.lead}>After the order is set, any change needs a written reason, and every member is told.</p>
      </div>

      <fieldset className={styles.radios}>
        <legend className="visually-hidden">Payout order method</legend>
        {OPTIONS.map((opt) => {
          const selected = draft.payoutOrderMethod === opt.id;
          return (
            <label key={opt.id} className={`${styles.radio} ${selected ? styles.radioOn : ""}`}>
              <input
                type="radio"
                name="payout-order"
                value={opt.id}
                checked={selected}
                onChange={() => onChange({ payoutOrderMethod: opt.id })}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>
                <span className={styles.radioTitle}>{opt.title}</span>
                <span className={styles.radioBody}>{opt.body}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={creating}>
          {creating ? "Saving draft…" : "Save draft and invite members"}
        </Button>
      </div>
    </form>
  );
}
