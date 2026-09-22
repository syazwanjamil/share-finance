import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppData } from "../../../state/AppDataContext";
import { generateInviteCode } from "../../../lib/inviteCode";
import { buildDraftGroupBundle } from "../../../lib/buildDraftGroup";
import { StepBasics } from "./StepBasics";
import { StepPayoutOrder } from "./StepPayoutOrder";
import { StepInvite } from "./StepInvite";
import { initialDraft } from "./wizardTypes";
import type { GroupDraft } from "./wizardTypes";
import styles from "./GroupCreatePage.module.css";

export function GroupCreatePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppData();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<GroupDraft>(initialDraft);
  const inviteCode = useMemo(() => generateInviteCode(), []);
  const [dispatched, setDispatched] = useState(false);

  function patchDraft(patch: Partial<GroupDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function goToInvite() {
    if (!dispatched) {
      const bundle = buildDraftGroupBundle(draft, inviteCode, state.currentUser.id);
      dispatch({ type: "ADD_GROUP", bundle });
      setDispatched(true);
    }
    setStep(3);
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
          <StepPayoutOrder
            draft={draft}
            onChange={patchDraft}
            onNext={goToInvite}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && <StepInvite draft={draft} inviteCode={inviteCode} onBack={() => setStep(2)} />}
      </div>
    </div>
  );
}
