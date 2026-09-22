import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { OtpInput } from "../../components/ui/OtpInput";
import { ApiRequestError, requestOtp, verifyOtp } from "../../lib/api";
import styles from "./AuthLayout.module.css";

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone =
    (location.state as { phone?: string } | null)?.phone ?? "+60123456789";
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyOtp(phone, code);
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      navigate("/welcome");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't verify the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (seconds > 0) return;
    setError(null);
    try {
      await requestOtp(phone);
      setSeconds(24);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't resend the code. Please try again.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.title}>Enter your code</div>
        <p className={styles.hint}>
          Sent to {phone} ·{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            change
          </a>
        </p>
        <OtpInput value={code} onChange={setCode} />
        {error && <p className={styles.hint}>{error}</p>}
        <p className={styles.hint}>
          {seconds > 0 ? (
            `Resend code in 0:${seconds.toString().padStart(2, "0")}`
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleResend();
              }}
            >
              Resend code
            </a>
          )}
        </p>
        <Button block disabled={code.length < 6 || submitting} onClick={handleVerify}>
          {submitting ? "Verifying…" : "Verify"}
        </Button>
      </div>
    </div>
  );
}
