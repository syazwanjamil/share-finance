import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { BrandMark } from "../../components/ui/BrandMark";
import { FormError } from "../../components/ui/Field";
import { OtpInput } from "../../components/ui/OtpInput";
import { ApiRequestError, requestOtp, verifyOtp } from "../../lib/api";
import { useAppData } from "../../state/AppDataContext";
import styles from "./AuthLayout.module.css";

const RESEND_SECONDS = 24;

function displayPhone(e164: string): string {
  const local = e164.replace(/^\+60/, "");
  return `+60 ${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
}

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actions } = useAppData();
  const locationState = location.state as { phone?: string; inviteCode?: string } | null;
  const phone = locationState?.phone;
  const inviteCode = locationState?.inviteCode;
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!phone) return <Navigate to="/login" replace />;

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6 || submitting || !phone) return;
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(phone, code);
      await actions.refresh();
      navigate("/welcome", { state: inviteCode ? { inviteCode } : undefined });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't verify the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (seconds > 0 || !phone) return;
    setError(null);
    try {
      await requestOtp(phone);
      setSeconds(RESEND_SECONDS);
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't resend the code. Please try again.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <BrandMark />
      </div>
      <form className={styles.center} onSubmit={handleVerify}>
        <div className={styles.centerHead}>
          <h1>Enter your code</h1>
          <p className={styles.inlineRow} id="otp-sent-to">
            Sent on WhatsApp to <strong className="tabular">{displayPhone(phone)}</strong>
            <button type="button" className={styles.linkButton} onClick={() => navigate("/login")}>
              Change number
            </button>
          </p>
        </div>

        <OtpInput value={code} onChange={setCode} invalid={!!error} describedBy="otp-sent-to" />

        {error ? <FormError>{error}</FormError> : null}

        <Button type="submit" block disabled={code.length < 6 || submitting}>
          {submitting ? "Checking…" : "Verify"}
        </Button>

        <p className={styles.inlineRow} aria-live="polite">
          {seconds > 0 ? (
            <span className="tabular">
              {resent ? "New code sent. " : "Didn't get it? "}You can resend in 0:{seconds.toString().padStart(2, "0")}
            </span>
          ) : (
            <>
              Didn't get it?
              <button type="button" className={styles.linkButton} onClick={handleResend}>
                Send a new code
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
