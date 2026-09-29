import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
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

  async function proceed(withInvite: boolean) {
    const nextPhoneError = validateMalaysianMobile(phone);
    const nextInviteError = withInvite ? validateInviteCode(inviteCode) : null;
    setPhoneError(nextPhoneError);
    setInviteError(nextInviteError);
    setError(null);
    if (nextPhoneError || nextInviteError) return;

    const e164Phone = toE164(phone);
    const inviteCodeToJoin = withInvite ? inviteCode.trim().toUpperCase() : undefined;
    setSubmitting(true);
    try {
      await requestOtp(e164Phone);
      navigate("/verify", {
        state: { phone: e164Phone, inviteCode: inviteCodeToJoin },
      });
    } catch (err) {
      const serverPhoneError = err instanceof ApiRequestError ? err.fieldErrors?.phone?.[0] : undefined;
      if (serverPhoneError) {
        setPhoneError(serverPhoneError);
      } else {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Couldn't send the code. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Enter submits with whichever path is active: plain phone, or phone + invite code once revealed.
  function handleContinue(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    return proceed(showInviteField);
  }

  return (
    <div className={styles.page}>
      <div className={styles.split}>
        <div className={styles.marketing}>
          <div className={styles.marketingBrand}>
            <span className={styles.logo} />
            <span className={styles.brandName}>Share Finance</span>
          </div>
          <div className={styles.headline}>
            Run your kutu
            <br />
            without the notebook.
          </div>
          <p className={styles.subcopy}>
            Contributions collected automatically, payout order agreed in the
            open, every ringgit in one ledger.
          </p>
        </div>

        <form className={styles.formPanel} onSubmit={handleContinue} noValidate>
          <div className={styles.title}>Sign in or sign up</div>
          <p className={styles.hint}>
            We'll text you a 6-digit code. No password to forget.
          </p>
          <label className={`${styles.field} ${phoneError ? styles.fieldInvalid : ""}`}>
            <span className={styles.fieldLabel}>PHONE NUMBER</span>
            <div className={styles.fieldValue}>
              <span className={styles.countryCode}>🇲🇾 +60</span>
              <input
                className={styles.input}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="12-345 6789"
                aria-label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? "phone-error" : undefined}
              />
            </div>
          </label>
          {phoneError && (
            <p id="phone-error" className={styles.fieldError} role="alert">
              {phoneError}
            </p>
          )}
          {error && <p className={styles.fieldError} role="alert">{error}</p>}
          <Button block type={showInviteField ? "button" : "submit"} onClick={showInviteField ? () => proceed(false) : undefined} disabled={submitting}>
            {submitting ? "Sending…" : "Continue"}
          </Button>
          <div className={styles.divider}>or</div>
          {showInviteField && (
            <>
              <label className={`${styles.field} ${inviteError ? styles.fieldInvalid : ""}`}>
                <span className={styles.fieldLabel}>INVITE CODE</span>
                <div className={styles.fieldValue}>
                  <input
                    className={styles.input}
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setInviteError(null);
                    }}
                    placeholder="KUTU-4F2M"
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoFocus
                    aria-invalid={!!inviteError}
                    aria-describedby={inviteError ? "invite-error" : undefined}
                  />
                </div>
              </label>
              {inviteError && (
                <p id="invite-error" className={styles.fieldError} role="alert">
                  {inviteError}
                </p>
              )}
            </>
          )}
          <Button
            variant="ghost"
            block
            type={showInviteField ? "submit" : "button"}
            onClick={
              showInviteField
                ? undefined
                : (e) => {
                    // The button becomes type="submit" on re-render; don't let this click submit.
                    e.preventDefault();
                    setShowInviteField(true);
                  }
            }
            disabled={submitting}
          >
            {submitting
              ? "Sending…"
              : showInviteField
                ? "Continue with this invite code"
                : "Continue with an invite code"}
          </Button>
          <p className={styles.legal}>
            By continuing you agree to the group terms. Your number is visible
            only to members of groups you join.
          </p>
        </form>
      </div>
    </div>
  );
}
