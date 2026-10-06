import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../../../state/AppDataContext";
import { ApiRequestError } from "../../../lib/api";
import type { GroupBundle } from "../../../lib/api";
import { addRounds, formatDateFull } from "../../../lib/date";
import { BrandMark } from "../../../components/ui/BrandMark";
import { FormError } from "../../../components/ui/Field";
import { NoteFace, NoteWindow } from "../../../components/note/NoteFace";
import { StepBasics } from "./StepBasics";
import { StepPayoutOrder } from "./StepPayoutOrder";
import { StepInvite } from "./StepInvite";
import { initialDraft } from "./wizardTypes";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

const STEPS = ["Basics", "Payout order", "Invite"];

export function GroupCreatePage() {
  const navigate = useNavigate();
  const { state, actions } = useAppData();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<GroupDraft>(initialDraft);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdBundle, setCreatedBundle] = useState<GroupBundle | null>(null);

  function patchDraft(patch: Partial<GroupDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function createDraft() {
    if (createdBundle) {
      setStep(3);
      return;
    }
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const bundle = await actions.addGroup({
        name: draft.name.trim(),
        contributionAmount: draft.contributionAmount,
        frequency: draft.frequency,
        totalSlots: draft.totalSlots,
        firstPayoutDate: draft.firstPayoutDate,
        lateFeeEnabled: draft.lateFeeEnabled,
        lateFeeAmount: 20,
        lateFeeGraceDays: 3,
        payoutOrderMethod: draft.payoutOrderMethod,
      });
      setCreatedBundle(bundle);
      setStep(3);
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : "Couldn't create the group. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const pot = draft.contributionAmount * draft.totalSlots;
  const lastPayout = draft.firstPayoutDate ? addRounds(draft.firstPayoutDate, draft.totalSlots - 1, draft.frequency) : null;
  const exitTo = state.groups.length > 0 ? "/home" : "/welcome";

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <BrandMark />
        <Link to={createdBundle ? `/groups/${createdBundle.group.id}` : exitTo} className={styles.exit}>
          {createdBundle ? "Go to the group" : "Cancel"}
        </Link>
      </header>

      <div className={styles.layout}>
        <main className={styles.formCol}>
          <ol className={styles.steps} aria-label="Steps">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const status = n < step ? "done" : n === step ? "current" : "todo";
              return (
                <li key={label} className={`${styles.step} ${styles[status]}`} aria-current={status === "current" ? "step" : undefined}>
                  <span className={`serial ${styles.stepNumber}`}>{n}</span>
                  {label}
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <StepBasics draft={draft} onChange={patchDraft} onNext={() => setStep(2)} onBack={() => navigate(exitTo)} />
          )}
          {step === 2 && (
            <>
              <StepPayoutOrder
                draft={draft}
                onChange={patchDraft}
                onNext={createDraft}
                onBack={() => setStep(1)}
                creating={creating}
              />
              {createError ? <FormError>{createError}</FormError> : null}
            </>
          )}
          {step === 3 && createdBundle && <StepInvite bundle={createdBundle} />}
        </main>

        <aside className={styles.previewCol} aria-label="Preview">
          <p className={styles.previewLabel}>How your group's note will look</p>
          <NoteFace
            groupId={createdBundle?.group.id ?? null}
            groupName={draft.name.trim() || "Your group"}
            serial={createdBundle ? `${createdBundle.group.inviteCode} · R01/${draft.totalSlots.toString().padStart(2, "0")}` : undefined}
            roundLabel={`Round 1 of ${draft.totalSlots}`}
            potLabel="pot"
            pot={pot}
            paidCount={0}
            totalCount={draft.totalSlots}
            window={
              <NoteWindow
                caption={draft.firstPayoutDate ? `First payout ${formatDateFull(draft.firstPayoutDate)}` : "First payout"}
                name={
                  draft.payoutOrderMethod === "random"
                    ? "Decided by the draw"
                    : draft.payoutOrderMethod === "join-order"
                      ? "The first member to join"
                      : "Whoever you put first"
                }
              />
            }
            stamp={createdBundle ? undefined : "specimen"}
            headingLevel="p"
            animate={false}
          />
          <p className={styles.previewNote}>
            {draft.totalSlots} members × RM {draft.contributionAmount.toLocaleString("en-MY")} {draft.frequency === "monthly" ? "a month" : "a week"}.
            {lastPayout ? ` Last payout ${formatDateFull(lastPayout.toISOString())}.` : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}
