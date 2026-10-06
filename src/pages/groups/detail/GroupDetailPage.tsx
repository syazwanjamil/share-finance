import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowDownUp, ArrowLeft, Banknote, MessageCircle } from "lucide-react";
import { useAppData, useCurrentUser, useGroupBundle } from "../../../state/AppDataContext";
import { useOrderHistory } from "../../../state/useOrderHistory";
import {
  computeRoundCollection,
  getCurrentRound,
  getMyRound,
  getPaymentForUserRound,
  getRoundLineup,
  isOrganizer,
  memberName,
} from "../../../lib/selectors";
import type { MemberWithUser } from "../../../lib/selectors";
import { buildLedger } from "../../../lib/ledger";
import { formatRM } from "../../../lib/currency";
import { daysFromToday, formatDate, formatDateFull, relativeDays } from "../../../lib/date";
import { GroupNote } from "../../../components/note/GroupNote";
import { LedgerList } from "../../../components/ledger/LedgerList";
import { PageHeader, Section, EmptyState } from "../../../components/layout/Page";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { Notice } from "../../../components/ui/Notice";
import { PersonRow } from "../../../components/ui/PersonRow";
import { StatusMark } from "../../../components/ui/StatusMark";
import { TabPanel, Tabs } from "../../../components/ui/Tabs";
import { FormError } from "../../../components/ui/Field";
import { MembersRoundsMatrix } from "./MembersRoundsMatrix";
import { PayoutOrderList } from "./PayoutOrderList";
import styles from "./GroupDetailPage.module.css";

type TabId = "payments" | "order" | "ledger";

export function GroupDetailPage() {
  const { groupId } = useParams();
  const currentUser = useCurrentUser();
  const bundle = useGroupBundle(groupId);
  const { actions } = useAppData();
  const organizer = bundle ? isOrganizer(bundle, currentUser.id) : false;
  const [tab, setTab] = useState<TabId>(organizer ? "payments" : "order");
  const [reminding, setReminding] = useState(false);
  const [remindResult, setRemindResult] = useState<string | null>(null);
  const [remindError, setRemindError] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const history = useOrderHistory(groupId ? [groupId] : []);

  useEffect(() => {
    setTab(organizer ? "payments" : "order");
    setRemindResult(null);
    setRemindError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const groupHistory = useMemo(() => (groupId ? (history.byGroup[groupId] ?? []) : []), [history.byGroup, groupId]);
  const ledger = useMemo(
    () => (bundle ? buildLedger(bundle, groupHistory, currentUser.id) : []),
    [bundle, groupHistory, currentUser.id],
  );

  if (!bundle) {
    return (
      <EmptyState
        title="We couldn't find this group"
        action={
          <ButtonLink to="/home" variant="secondary">
            Back to home
          </ButtonLink>
        }
      >
        It may have been removed, or you're not a member of it.
      </EmptyState>
    );
  }

  const { group } = bundle;
  const round = getCurrentRound(bundle);
  const collection = computeRoundCollection(bundle, group.currentRound);
  const lineup = getRoundLineup(bundle, group.currentRound);
  const stillToPay: MemberWithUser[] = [...lineup.failed, ...lineup.unpaid];
  const myPayment = getPaymentForUserRound(bundle, currentUser.id, group.currentRound);
  const iHavePaid = myPayment?.status === "paid" || myPayment?.status === "paid-late";
  const iOwe = stillToPay.some((e) => e.member.userId === currentUser.id);
  const othersToPay = stillToPay.filter((e) => e.member.userId !== currentUser.id);
  const myRound = getMyRound(bundle, currentUser.id);
  const held = round?.status === "held";
  const dueIn = round ? daysFromToday(round.scheduledDate) : 0;
  const needsPayoutSetup =
    !currentUser.stripeConnectOnboarded && !!myRound && myRound.status !== "paid-out";

  async function handleRemind() {
    setRemindError(null);
    setRemindResult(null);
    setReminding(true);
    try {
      const { remindedCount } = await actions.remindUnpaid(group.id);
      setRemindResult(
        remindedCount === 0
          ? "Nobody needed a reminder."
          : `Reminder sent on WhatsApp to ${remindedCount} member${remindedCount === 1 ? "" : "s"}.`,
      );
    } catch {
      setRemindError("Couldn't send the reminders. Please try again.");
    } finally {
      setReminding(false);
    }
  }

  function openLedger() {
    setTab("ledger");
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const frequencyLabel = group.frequency === "monthly" ? "monthly" : "weekly";
  const payPath = `/pay/${group.id}/${group.currentRound}`;

  return (
    <>
      <PageHeader
        back={
          <ButtonLink to="/home" variant="ghost" className={styles.back}>
            <ArrowLeft size={16} aria-hidden="true" /> Home
          </ButtonLink>
        }
        title={group.name}
        lead={
          <>
            {group.totalSlots} members · {formatRM(group.contributionAmount)} {frequencyLabel} · Round{" "}
            {group.currentRound} of {group.totalRounds} · {organizer ? "You're the organizer" : "You're a member"}
          </>
        }
        actions={
          organizer ? (
            <>
              <ButtonLink to={`/groups/${group.id}/payout-order`} variant="secondary">
                <ArrowDownUp size={16} aria-hidden="true" /> Payout order
              </ButtonLink>
              {round ? (
                <ButtonLink to={`/groups/${group.id}/payout/${round.roundNumber}`} variant="secondary">
                  <Banknote size={16} aria-hidden="true" /> Release payout
                </ButtonLink>
              ) : null}
            </>
          ) : null
        }
      />

      <div className={styles.top}>
        <div className={styles.roundCol}>
          <GroupNote bundle={bundle} currentUserId={currentUser.id} />

          {round ? (
            <section className={styles.round} aria-labelledby="round-heading">
              <div className={styles.roundHead}>
                <h2 id="round-heading">This round</h2>
                <p className={styles.roundMeta}>
                  <span className={dueIn < 0 && stillToPay.length > 0 ? styles.overdue : undefined}>
                    {dueIn < 0 ? "Was due" : "Due"} {formatDate(round.scheduledDate)} ({relativeDays(round.scheduledDate)})
                  </span>
                  {" · "}
                  {formatRM(collection.collected)} of {formatRM(collection.pool)} collected
                </p>
              </div>

              {held ? (
                <Notice
                  tone="failed"
                  title="This payout is on hold"
                  action={
                    organizer ? (
                      <ButtonLink to={`/groups/${group.id}/payout/${round.roundNumber}`} variant="secondary">
                        Review hold
                      </ButtonLink>
                    ) : undefined
                  }
                >
                  The organizer paused it. Every member was told why on WhatsApp.
                </Notice>
              ) : null}

              {stillToPay.length > 0 ? (
                <div className={styles.toPay}>
                  <h3 className={styles.toPayHead}>
                    Still to pay <span className="tabular">({stillToPay.length})</span>
                  </h3>
                  <ul className={styles.people}>
                    {stillToPay.map((entry) => {
                      const mine = entry.member.userId === currentUser.id;
                      const failed = lineup.failed.includes(entry);
                      return (
                        <PersonRow
                          key={entry.member.id}
                          initials={entry.user?.initials ?? "?"}
                          self={mine}
                          name={memberName(entry, currentUser.id)}
                          meta={failed ? "Card payment didn't go through" : `${formatRM(group.contributionAmount)} due`}
                          trailing={
                            <StatusMark kind={failed ? "failed" : "unpaid"} showLabel />
                          }
                        />
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className={styles.allPaid}>
                  <StatusMark kind="paid" size={20} />
                  Everyone has paid this round. The pot is complete.
                </p>
              )}

              <div className={styles.primary}>
                {iOwe ? (
                  <ButtonLink to={payPath} variant="primary">
                    Pay your {formatRM(group.contributionAmount)}
                  </ButtonLink>
                ) : null}
                {organizer && othersToPay.length > 0 ? (
                  <>
                    <Button variant={iOwe ? "secondary" : "primary"} onClick={handleRemind} disabled={reminding}>
                      <MessageCircle size={18} aria-hidden="true" />
                      {reminding
                        ? "Sending reminders…"
                        : `Remind ${othersToPay.length === 1 ? memberName(othersToPay[0]) : `${othersToPay.length} members`} on WhatsApp`}
                    </Button>
                    <p className={styles.primaryNote}>
                      Everyone who hasn't paid gets a payment reminder on WhatsApp{iOwe ? ", including you" : ""}.
                    </p>
                  </>
                ) : null}
                {organizer && stillToPay.length === 0 && !held ? (
                  <ButtonLink to={`/groups/${group.id}/payout/${round.roundNumber}`} variant="primary">
                    <Banknote size={18} aria-hidden="true" /> Review and release payout
                  </ButtonLink>
                ) : null}

                {!organizer && iHavePaid ? (
                  <p className={styles.youPaid}>
                    <StatusMark kind={myPayment?.status ?? "paid"} size={20} />
                    You paid{myPayment?.paidAt ? ` on ${formatDate(myPayment.paidAt)}` : ""}. Thank you.
                  </p>
                ) : null}
                <div aria-live="polite" className={styles.live}>
                  {remindResult ? (
                    <p className={styles.sent}>
                      <StatusMark kind="done" size={18} /> {remindResult}
                    </p>
                  ) : null}
                </div>
                {remindError ? <FormError>{remindError}</FormError> : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.latest} aria-labelledby="latest-heading">
          <div className={styles.latestHead}>
            <h2 id="latest-heading">Latest in the ledger</h2>
            <Button variant="ghost" onClick={openLedger}>
              Full ledger
            </Button>
          </div>
          {ledger.length > 0 ? (
            <LedgerList entries={ledger.slice(0, 6)} caption={`Latest ledger entries for ${group.name}`} compact />
          ) : (
            <p className="muted">Nothing recorded yet.</p>
          )}
          <p className={styles.latestNote}>Every member sees this same ledger.</p>
        </aside>
      </div>

      {needsPayoutSetup && myRound ? (
        <Notice
          tone="warning"
          title={`Set up your payout account before your turn in round ${myRound.roundNumber}`}
          action={
            <ButtonLink to="/settings/payout" variant="secondary">
              Set up payouts
            </ButtonLink>
          }
        >
          Your pot of {formatRM(collection.pool)} is due {formatDateFull(myRound.scheduledDate)}. We can only send it to
          an account in your name.
        </Notice>
      ) : null}

      <div ref={tabsRef} className={styles.tabs}>
        <Tabs
          idBase="group"
          label="Group records"
          activeId={tab}
          onChange={(id) => setTab(id as TabId)}
          tabs={[
            { id: "payments", label: "Payments by round" },
            { id: "order", label: "Payout order" },
            { id: "ledger", label: "Ledger" },
          ]}
        />
        {tab === "payments" ? (
          <TabPanel idBase="group" id="payments">
            <MembersRoundsMatrix bundle={bundle} currentUserId={currentUser.id} />
          </TabPanel>
        ) : null}
        {tab === "order" ? (
          <TabPanel idBase="group" id="order">
            <Section
              title="Who receives each round"
              lead="Agreed in the open. Any change carries a reason that everyone can read."
              aside={
                organizer ? (
                  <ButtonLink to={`/groups/${group.id}/payout-order`} variant="secondary">
                    Change order
                  </ButtonLink>
                ) : undefined
              }
            >
              <PayoutOrderList bundle={bundle} history={groupHistory} currentUserId={currentUser.id} />
            </Section>
          </TabPanel>
        ) : null}
        {tab === "ledger" ? (
          <TabPanel idBase="group" id="ledger">
            {history.error ? <FormError>{history.error} Contributions and payouts below are complete.</FormError> : null}
            {ledger.length > 0 ? (
              <LedgerList entries={ledger} caption={`Ledger for ${group.name}`} />
            ) : (
              <EmptyState title="Nothing in the ledger yet">
                Contributions, payouts and payout-order changes appear here as they happen.
              </EmptyState>
            )}
          </TabPanel>
        ) : null}
      </div>
    </>
  );
}
