import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import { ApiRequestError, requestOtp, toE164 } from "../../lib/api";
import styles from "./AuthLayout.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInviteField, setShowInviteField] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  async function proceed(inviteCodeToJoin?: string) {
    if (!phone.trim()) return;
    const e164Phone = toE164(phone);
    setError(null);
    setSubmitting(true);
    try {
      await requestOtp(e164Phone);
      navigate("/verify", {
        state: { phone: e164Phone, inviteCode: inviteCodeToJoin },
      });
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Couldn't send the code. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinue() {
    return proceed();
  }

  function handleContinueWithInvite() {
    if (!showInviteField) {
      setShowInviteField(true);
      return;
    }
    if (!inviteCode.trim()) return;
    return proceed(inviteCode.trim());
  }

  return (
    <div className={styles.page}>
      <div className={styles.split}>
        <div className={styles.marketing}>
          <div className={styles.marketingBrand}>
            <span className={styles.logo} />
            <span className={styles.brandName}>Kongsi Rezeki</span>
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
          <div className={styles.badges}>
            <StatusPill variant="success">🔒 BNM-licensed gateway</StatusPill>
            <StatusPill variant="neutral">Funds held in trust</StatusPill>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.title}>Sign in or sign up</div>
          <p className={styles.hint}>
            We'll text you a 6-digit code. No password to forget.
          </p>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>PHONE NUMBER</span>
            <div className={styles.fieldValue}>
              <span className={styles.countryCode}>🇲🇾 +60</span>
              <input
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="12-345 6789"
              />
            </div>
          </div>
          {error && <p className={styles.hint}>{error}</p>}
          <Button block onClick={handleContinue} disabled={submitting}>
            {submitting ? "Sending…" : "Continue"}
          </Button>
          <div className={styles.divider}>or</div>
          {showInviteField && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>INVITE CODE</span>
              <div className={styles.fieldValue}>
                <input
                  className={styles.input}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="KUTU-4F2M"
                />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            block
            type="button"
            onClick={handleContinueWithInvite}
            disabled={submitting || (showInviteField && !inviteCode.trim())}
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
        </div>
      </div>
    </div>
  );
}
