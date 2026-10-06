import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { BrandMark } from "../../components/ui/BrandMark";
import { FormError, TextField } from "../../components/ui/Field";
import { ApiRequestError } from "../../lib/api";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import styles from "./AuthLayout.module.css";

export function ProfileNamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actions } = useAppData();
  const currentUser = useCurrentUser();
  const locationState = location.state as { next?: string; nextState?: unknown } | null;
  const next = locationState?.next ?? "/welcome";
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (currentUser.name && !submitting) {
    return <Navigate to="/welcome" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await actions.updateProfile({ name: trimmed });
      navigate(next, { replace: true, state: locationState?.nextState });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save your name. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <BrandMark />
      </div>
      <form className={styles.center} onSubmit={handleSubmit}>
        <div className={styles.centerHead}>
          <h1>What should we call you?</h1>
          <p className={styles.hint}>Everyone in your groups sees this name on the ledger and the payout order.</p>
        </div>
        <TextField
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Siti Aminah"
          autoComplete="name"
          maxLength={120}
          autoFocus
        />
        {error ? <FormError>{error}</FormError> : null}
        <Button block type="submit" disabled={!name.trim() || submitting}>
          {submitting ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
