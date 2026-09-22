import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppData } from "../../../state/AppDataContext";
import { ApiRequestError } from "../../../lib/api";
import type { GroupBundle } from "../../../lib/api";
import { StepBasics } from "./StepBasics";
import { StepPayoutOrder } from "./StepPayoutOrder";
import { StepInvite } from "./StepInvite";
import { initialDraft } from "./wizardTypes";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

export function GroupCreatePage() {
  const navigate = useNavigate();
  const { actions } = useAppData();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<GroupDraft>(initialDraft);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdBundle, setCreatedBundle] = useState<GroupBundle | null>(null);

  function patchDraft(patch: Partial<GroupDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function goToInvite() {
    if (createdBundle) {
      setStep(3);
      return;
    }
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const bundle = await actions.addGroup({
        name: draft.name,
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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.progress}>
          {[1, 2, 3].map((s) => (
            <span key={s} className={`${styles.segment} ${s <= step ? styles.segmentDone : ""}`} />
          ))}
        </div>

        {step === 1 && (
          <StepBasics
            draft={draft}
            onChange={patchDraft}
            onNext={() => setStep(2)}
            onBack={() => navigate("/welcome")}
          />
        )}
        {step === 2 && (
          <>
            {createError && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{createError}</p>}
            <StepPayoutOrder
              draft={draft}
              onChange={patchDraft}
              onNext={goToInvite}
              onBack={() => setStep(1)}
            />
          </>
        )}
        {step === 3 && createdBundle && <StepInvite bundle={createdBundle} onBack={() => setStep(2)} />}
      </div>
    </div>
  );
}
