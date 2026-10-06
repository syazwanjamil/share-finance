import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, MessageCircle, Plus } from "lucide-react";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import {
  computeRoundCollection,
  getMyRound,
  getPaymentsDue,
  getRoundLineup,
  isOrganizer,
  memberName,
} from "../../lib/selectors";
import type { GroupBundle } from "../../lib/api";
import { ApiRequestError } from "../../lib/api";
import { formatRM } from "../../lib/currency";
import { daysFromToday, formatDate, formatDateFull, relativeDays } from "../../lib/date";
import { seriesClass } from "../../lib/series";
import { GroupNote } from "../../components/note/GroupNote";
import { EmptyState, PageHeader, Section } from "../../components/layout/Page";
import { Button, ButtonLink } from "../../components/ui/Button";
import { FormError, TextField } from "../../components/ui/Field";
import { StatusMark } from "../../components/ui/StatusMark";
import { Switch } from "../../components/ui/Switch";
import styles from "./DashboardPage.module.css";

function JoinForm({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const { actions } = useAppData();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (joining) return;
    if (!code.trim()) {
      setError("Enter the invite code from your organizer.");
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const bundle = await actions.joinGroup(code.trim().toUpperCase());
      onDone?.();
      navigate(`/groups/${bundle.group.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't find that group. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <form className={styles.joinForm} onSubmit={handleSubmit}>
      <TextField
        label="Invite code"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setError(null);
        }}
        placeholder="KUTU-4F2M"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        serial
        autoFocus
        error={error}
      />
      <Button type="submit" variant="secondary" disabled={joining}>
        {joining ? "Finding group…" : "Join group"}
      </Button>
    </form>
  );
}

function OrganizerTask({ bundle, currentUserId }: { bundle: GroupBundle; currentUserId: string }) {
  const { actions } = useAppData();
  const { group } = bundle;
  const lineup = getRoundLineup(bundle, group.currentRound);
  const waiting = [...lineup.failed, ...lineup.unpaid];
  const others = waiting.filter((w) => w.member.userId !== currentUserId);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remind() {
    setSending(true);
    setError(null);
    try {
      const { remindedCount } = await actions.remindUnpaid(group.id);
      setResult(`Reminder sent to ${remindedCount} on WhatsApp.`);
    } catch {
      setError("Couldn't send the reminders. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const names = others.map((w) => memberName(w, currentUserId)).join(", ");
  const youOwe = waiting.length > others.length;

  return (
    <li className={`${styles.task} ${seriesClass(group.id)}`}>
      <span className={styles.swatch} aria-hidden="true" />
      <div className={styles.taskText}>
        <Link to={`/groups/${group.id}`} className={styles.taskTitle}>
          {group.name} · Round {group.currentRound}
        </Link>
        {others.length > 0 ? (
          <p className={styles.taskBody}>
            <strong>
              {others.length} other{others.length === 1 ? "" : "s"} still to pay:
            </strong>{" "}
            {names}
            {youOwe ? `${names.endsWith(".") ? "" : "."} Your own contribution is due too.` : ""}
          </p>
        ) : youOwe ? (
          <p className={styles.taskBody}>Everyone else has paid. Only your contribution is left.</p>
        ) : (
          <p className={styles.taskBody}>Everyone has paid. The pot is ready to release.</p>
        )}
        <div aria-live="polite">
          {result ? (
            <p className={styles.taskDone}>
              <StatusMark kind="done" size={16} /> {result}
            </p>
          ) : null}
        </div>
        {error ? <FormError>{error}</FormError> : null}
      </div>
      <div className={styles.taskAction}>
        {others.length > 0 ? (
          <Button variant="secondary" onClick={remind} disabled={sending}>
            <MessageCircle size={16} aria-hidden="true" />
            {sending ? "Sending…" : `Remind ${others.length === 1 ? "them" : others.length === 2 ? "both" : `all ${others.length}`}`}
          </Button>
        ) : waiting.length > 0 ? null : (
          <ButtonLink to={`/groups/${group.id}/payout/${group.currentRound}`} variant="secondary">
            Release payout
          </ButtonLink>
        )}
      </div>
    </li>
  );
}

export function DashboardPage() {
  const { state, actions } = useAppData();
  const currentUser = useCurrentUser();
  const [showJoin, setShowJoin] = useState(false);
  const [autopayError, setAutopayError] = useState<string | null>(null);
  const due = getPaymentsDue(state.groups, currentUser.id);
  const organizing = state.groups.filter((b) => isOrganizer(b, currentUser.id));
  const firstName = currentUser.name.split(" ")[0] || "there";

  if (state.groups.length === 0) {
    return (
      <>
        <PageHeader title={`Hi, ${firstName}`} lead="You're not in a kutu yet." />
        <EmptyState
          title="Join the group you were invited to, or start your own"
          action={
            <ButtonLink to="/groups/new" variant="secondary">
              <Plus size={16} aria-hidden="true" /> Start a group
            </ButtonLink>
          }
        >
          <p>Your organizer's WhatsApp message has an invite code that starts with KUTU.</p>
          <div className={styles.emptyJoin}>
            <JoinForm />
          </div>
        </EmptyState>
      </>
    );
  }

  async function handleAutopay(groupId: string, enabled: boolean) {
    setAutopayError(null);
    try {
      await actions.setAutopay(groupId, enabled);
    } catch {
      setAutopayError("Couldn't change autopay. Please try again.");
    }
  }

  const summary = [
    `${state.groups.length} group${state.groups.length === 1 ? "" : "s"}`,
    due.length === 0 ? "nothing due from you" : `${due.length} payment${due.length === 1 ? "" : "s"} due from you`,
  ].join(" · ");

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName}`}
        lead={summary}
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowJoin((v) => !v)} aria-expanded={showJoin}>
              Join with a code
            </Button>
            <ButtonLink to="/groups/new" variant="secondary">
              <Plus size={16} aria-hidden="true" /> New group
            </ButtonLink>
          </>
        }
      />

      {showJoin ? (
        <div className={styles.joinPanel}>
          <JoinForm onDone={() => setShowJoin(false)} />
        </div>
      ) : null}

      {due.length > 0 ? (
        <Section title="Due from you" id="due">
          <ul className={styles.dueList}>
            {due.map((d, i) => {
              const late = daysFromToday(d.round.scheduledDate) < 0;
              return (
                <li key={d.bundle.group.id} className={`${styles.due} ${seriesClass(d.bundle.group.id)}`}>
                  <span className={styles.swatch} aria-hidden="true" />
                  <div className={styles.dueText}>
                    <p className={styles.dueGroup}>{d.bundle.group.name}</p>
                    <p className={styles.dueMeta}>
                      Round {d.round.roundNumber} contribution ·{" "}
                      <span className={late ? styles.late : undefined}>
                        {late ? "was due" : "due"} {formatDate(d.round.scheduledDate)} ({relativeDays(d.round.scheduledDate)})
                      </span>
                    </p>
                  </div>
                  <p className={`figures ${styles.dueAmount}`}>{formatRM(d.amount)}</p>
                  <div className={styles.dueActions}>
                    <ButtonLink to={`/pay/${d.bundle.group.id}/${d.round.roundNumber}`} variant={i === 0 ? "primary" : "secondary"}>
                      Pay {formatRM(d.amount)}
                    </ButtonLink>
                  </div>
                  <div className={styles.dueAutopay}>
                    <Switch
                      checked={!!state.autopay[d.bundle.group.id]}
                      onChange={(v) => handleAutopay(d.bundle.group.id, v)}
                      label="Autopay"
                      description="Pay future rounds of this group automatically"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {autopayError ? <FormError>{autopayError}</FormError> : null}
        </Section>
      ) : null}

      {organizing.length > 0 ? (
        <Section title="Groups you organize" id="organize" lead="What needs you this round.">
          <ul className={styles.tasks}>
            {organizing.map((bundle) => (
              <OrganizerTask key={bundle.group.id} bundle={bundle} currentUserId={currentUser.id} />
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Your groups" id="groups">
        <ul className={styles.notes}>
          {state.groups.map((bundle) => {
            const myRound = getMyRound(bundle, currentUser.id);
            const collection = computeRoundCollection(bundle, bundle.group.currentRound);
            return (
              <li key={bundle.group.id}>
                <Link to={`/groups/${bundle.group.id}`} className={styles.noteLink}>
                  <GroupNote bundle={bundle} currentUserId={currentUser.id} size="compact" headingLevel="p" animate={false} />
                  <span className={styles.noteFoot}>
                    <span>
                      {myRound
                        ? myRound.status === "paid-out"
                          ? `You received round ${myRound.roundNumber} on ${formatDate(myRound.paidOutAt ?? myRound.scheduledDate)}`
                          : myRound.status === "current" || myRound.status === "held"
                            ? `This round is yours: ${formatRM(collection.pool)}`
                            : `Your turn: round ${myRound.roundNumber}, ${formatDateFull(myRound.scheduledDate)}`
                        : "No payout round assigned yet"}
                    </span>
                    <span className={styles.open}>
                      Open <ChevronRight size={16} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
