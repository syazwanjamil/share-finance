import { Button } from "../../../components/ui/Button";
import type { PayoutOrderMethod } from "../../../types";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

interface StepPayoutOrderProps {
  draft: GroupDraft;
  onChange: (patch: Partial<GroupDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const OPTIONS: { id: PayoutOrderMethod; title: string; body: string }[] = [
  {
    id: "assigned",
    title: "I assign it",
    body: "Drag members into the order you agreed. Add a reason when someone needs an earlier turn.",
  },
  {
    id: "random",
    title: "Random draw",
    body: "The app shuffles once all slots are filled. Every member sees the same result and the draw timestamp.",
  },
  {
    id: "join-order",
    title: "Join order",
    body: "First to accept the invite goes first.",
  },
];

export function StepPayoutOrder({ draft, onChange, onNext, onBack }: StepPayoutOrderProps) {
  return (
    <>
      <div className={styles.title}>How is the payout order decided?</div>

      {OPTIONS.map((opt) => {
        const selected = draft.payoutOrderMethod === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className={`${styles.radioCard} ${selected ? styles.radioCardSelected : ""}`}
            onClick={() => onChange({ payoutOrderMethod: opt.id })}
          >
            <span className={`${styles.radioDot} ${selected ? styles.radioDotSelected : ""}`} />
            <span className={styles.radioText}>
              <span className={styles.radioTitle}>{opt.title}</span>
              <span className={styles.radioBody}>{opt.body}</span>
            </span>
          </button>
        );
      })}

      <div className={styles.tip}>
        <span className={styles.tipBody}>
          Whichever you pick, changes after lock-in need a written reason and notify all members.
        </span>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next: invite members</Button>
      </div>
    </>
  );
}
