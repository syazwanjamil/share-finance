import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { OtpInput } from "../../components/ui/OtpInput";
import styles from "./AuthLayout.module.css";

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as { phone?: string } | null)?.phone ?? "12-345 6789";
  const [code, setCode] = useState("419");
  const [seconds, setSeconds] = useState(24);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.title}>Enter your code</div>
        <p className={styles.hint}>
          Sent to +60 {phone} · <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>change</a>
        </p>
        <OtpInput value={code} onChange={setCode} />
        <p className={styles.hint}>
          {seconds > 0 ? `Resend code in 0:${seconds.toString().padStart(2, "0")}` : "Resend code"}
        </p>
        <Button block disabled={code.length < 6} onClick={() => navigate("/welcome")}>
          Verify
        </Button>
        <div className={styles.tip}>
          <span className={styles.tipTitle}>Also sent on WhatsApp</span>
          <span className={styles.tipBody}>
            If SMS is slow, check your WhatsApp from ShareFinance Verified.
          </span>
        </div>
      </div>
    </div>
  );
}
