import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { BrandMark } from "../../components/ui/BrandMark";
import { FormError, TextField } from "../../components/ui/Field";
import { NoteFace, NoteWindow } from "../../components/note/NoteFace";
import { ApiRequestError, requestOtp, toE164, validateMalaysianMobile } from "../../lib/api";
import styles from "./AuthLayout.module.css";

const INVITE_CODE_PATTERN = /^KUTU-[A-Z0-9]{4}$/i;

function validateInviteCode(code: string): string | null {
  if (!code.trim()) return "Enter your invite code";
  if (!INVITE_CODE_PATTERN.test(code.trim())) return "Invite codes look like KUTU-4F2M";
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInviteField, setShowInviteField] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const nextPhoneError = validateMalaysianMobile(phone);
    const nextInviteError = showInviteField ? validateInviteCode(inviteCode) : null;
    setPhoneError(nextPhoneError);
    setInviteError(nextInviteError);
    setError(null);
    if (nextPhoneError || nextInviteError) return;

    const e164Phone = toE164(phone);
    const inviteCodeToJoin = showInviteField ? inviteCode.trim().toUpperCase() : undefined;
    setSubmitting(true);
    try {
      await requestOtp(e164Phone);
      navigate("/verify", { state: { phone: e164Phone, inviteCode: inviteCodeToJoin } });
    } catch (err) {
      const serverPhoneError = err instanceof ApiRequestError ? err.fieldErrors?.phone?.[0] : undefined;
      if (serverPhoneError) setPhoneError(serverPhoneError);
      else setError(err instanceof ApiRequestError ? err.message : "Couldn't send the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <BrandMark />
      </div>
      <div className={styles.split}>
        <div className={styles.story}>
          <h1 className={styles.headline}>Run your kutu without the notebook.</h1>
          <p className={styles.subcopy}>
            Contributions collected by card, payout order agreed in the open, every ringgit in one ledger the whole
            group can see.
          </p>
          <div className={styles.specimen}>
            <NoteFace
              groupId={null}
              groupName="Your kutu"
              roundLabel="Round 4 of 10"
              potLabel="pot"
              pot={5000}
              paidCount={7}
              totalCount={10}
              window={<NoteWindow caption="This round goes to" name="Whoever's turn it is" />}
              stamp="specimen"
              headingLevel="p"
            />
            <p className={styles.specimenNote}>
              An example group. Every member sees the same note: who has paid, and whose turn it is.
            </p>
          </div>
        </div>

        <form className={styles.formPanel} onSubmit={handleSubmit} noValidate>
          <div className={styles.formHead}>
            <h2>Sign in or sign up</h2>
            <p className={styles.hint}>We'll send a 6-digit code to your WhatsApp. No password to forget.</p>
          </div>

          <TextField
            label="Phone number"
            prefix="+60"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError(null);
            }}
            placeholder="12-345 6789"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            error={phoneError}
          />

          {showInviteField ? (
            <TextField
              label="Invite code"
              hint="From the WhatsApp message your organizer sent."
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setInviteError(null);
              }}
              placeholder="KUTU-4F2M"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              serial
              error={inviteError}
            />
          ) : null}

          {error ? <FormError>{error}</FormError> : null}

          <Button type="submit" block disabled={submitting}>
            {submitting ? "Sending code…" : showInviteField ? "Continue with invite code" : "Continue"}
          </Button>

          <Button
            variant="ghost"
            className={styles.inviteToggle}
            onClick={() => {
              setShowInviteField((v) => !v);
              setInviteError(null);
            }}
            aria-expanded={showInviteField}
          >
            {showInviteField ? "I don't have an invite code" : "I have an invite code"}
          </Button>

          <p className={styles.legal}>
            By continuing you agree to the group terms. Your number is visible only to members of groups you join.
          </p>
        </form>
      </div>
    </div>
  );
}
