import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import { StatusPill } from "./ui/StatusPill";

export function PayoutSetupBanner() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        border: "1px solid var(--warning-border)",
        background: "var(--warning-bg)",
        borderRadius: "var(--radius-card)",
        padding: "12px 16px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusPill variant="warning">Payout account not set up</StatusPill>
        <span style={{ fontSize: 12.5, color: "var(--text)" }}>
          Set this up so you can receive money when it's your turn to be paid out.
        </span>
      </div>
      <Button variant="secondary" onClick={() => navigate("/settings/payout")}>
        Set up now
      </Button>
    </div>
  );
}
