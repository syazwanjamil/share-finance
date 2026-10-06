import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Lock, Shuffle } from "lucide-react";
import { useAppData, useCurrentUser, useGroupBundle } from "../../../state/AppDataContext";
import { useOrderHistory } from "../../../state/useOrderHistory";
import { getMembersWithUsers, isOrganizer, memberName } from "../../../lib/selectors";
import { reasonForRound } from "../../../lib/ledger";
import { formatDate, formatDateFull } from "../../../lib/date";
import { seriesClass } from "../../../lib/series";
import { PageHeader, EmptyState } from "../../../components/layout/Page";
import { Avatar } from "../../../components/ui/Avatar";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { SortableOrderRow } from "./SortableOrderRow";
import { LockScheduleModal } from "./LockScheduleModal";
import type { OrderDiffEntry } from "./LockScheduleModal";
import styles from "./PayoutOrderPage.module.css";

interface SlotEntry {
  roundNumber: number;
  roundId: string;
  scheduledDate: string;
  memberId: string;
}

export function PayoutOrderPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const bundle = useGroupBundle(groupId);
  const currentUser = useCurrentUser();
  const { actions } = useAppData();
  const history = useOrderHistory(groupId ? [groupId] : []);
  const groupHistory = groupId ? (history.byGroup[groupId] ?? []) : [];

  const membersWithUsers = useMemo(() => (bundle ? getMembersWithUsers(bundle) : []), [bundle]);

  // Paid-out rounds and the round now collecting are fixed; only rounds still to come can move.
  const lockedRounds = useMemo(() => (bundle ? bundle.rounds.filter((r) => r.status !== "upcoming") : []), [bundle]);
  const originalUnlocked = useMemo<SlotEntry[]>(
    () =>
      bundle
        ? bundle.rounds
            .filter((r) => r.status === "upcoming")
            .map((r) => ({
              roundNumber: r.roundNumber,
              roundId: r.id,
              scheduledDate: r.scheduledDate,
              memberId: r.recipientMemberId,
            }))
        : [],
    [bundle],
  );

  const [order, setOrder] = useState<SlotEntry[]>(originalUnlocked);
  const [showModal, setShowModal] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    setOrder(originalUnlocked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, originalUnlocked.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!bundle) {
    return (
      <EmptyState title="We couldn't find this group" action={<ButtonLink to="/home">Back to home</ButtonLink>}>
        It may have been removed, or you're not a member of it.
      </EmptyState>
    );
  }

  const { group } = bundle;
  if (!isOrganizer(bundle, currentUser.id)) {
    return (
      <EmptyState title="Only the organizer can change the payout order" action={<ButtonLink to={`/groups/${group.id}`}>Back to group</ButtonLink>}>
        You can see the agreed order, and the reason for every change, on the group page.
      </EmptyState>
    );
  }

  const byId = (id: string) => membersWithUsers.find((m) => m.member.id === id);
  const changed = new Set(order.filter((o, i) => o.memberId !== originalUnlocked[i]?.memberId).map((o) => o.roundNumber));

  function setAndAnnounce(next: SlotEntry[], message: string) {
    setOrder(next);
    setAnnouncement(message);
  }

  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const ids = order.map((slot) => slot.memberId);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const next = order.map((slot, i) => ({ ...slot, memberId: ids[i] }));
    setAndAnnounce(next, `${memberName(byId(ids[target]))} now receives round ${order[target].roundNumber}.`);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((o) => o.roundNumber.toString() === active.id);
    const newIndex = order.findIndex((o) => o.roundNumber.toString() === over.id);
    const ids = arrayMove(
      order.map((o) => o.memberId),
      oldIndex,
      newIndex,
    );
    const next = order.map((slot, i) => ({ ...slot, memberId: ids[i] }));
    setAndAnnounce(next, `${memberName(byId(ids[newIndex]))} now receives round ${order[newIndex].roundNumber}.`);
  }

  function handleShuffle() {
    const ids = order.map((o) => o.memberId);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setAndAnnounce(
      order.map((slot, i) => ({ ...slot, memberId: ids[i] })),
      "Remaining rounds shuffled.",
    );
  }

  const diff: OrderDiffEntry[] = order
    .filter((o, i) => o.memberId !== originalUnlocked[i]?.memberId)
    .map((o) => {
      const originalAtRound = originalUnlocked.find((orig) => orig.roundNumber === o.roundNumber);
      return {
        roundNumber: o.roundNumber,
        scheduledDate: o.scheduledDate,
        oldName: memberName(byId(originalAtRound?.memberId ?? "")),
        newName: memberName(byId(o.memberId)),
      };
    });

  async function handleConfirmLock(reason: string) {
    await actions.applyPayoutOrderChange(
      group.id,
      order.map((o) => ({ roundNumber: o.roundNumber, newRecipientMemberId: o.memberId })),
      reason,
    );
    setShowModal(false);
    navigate(`/groups/${group.id}`);
  }

  return (
    <div className={`${styles.page} ${seriesClass(group.id)}`}>
      <PageHeader
        back={
          <ButtonLink to={`/groups/${group.id}`} variant="ghost">
            <ArrowLeft size={16} aria-hidden="true" /> {group.name}
          </ButtonLink>
        }
        title="Change the payout order"
        lead="Drag a member, or use the arrows, to change who receives each remaining round. Every member sees the new order and your reason."
        actions={
          group.payoutOrderMethod === "random" && order.length > 1 ? (
            <Button variant="secondary" onClick={handleShuffle}>
              <Shuffle size={16} aria-hidden="true" /> Shuffle remaining rounds
            </Button>
          ) : undefined
        }
      />

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <section aria-labelledby="locked-heading" className={styles.block}>
        <h2 id="locked-heading" className={styles.blockHead}>
          <Lock size={16} aria-hidden="true" /> Fixed
          <span className={styles.blockNote}>Paid out, or collecting now</span>
        </h2>
        <ol className={styles.list}>
          {lockedRounds.map((r) => {
            const recipient = byId(r.recipientMemberId);
            return (
              <li key={r.id} className={`${styles.row} ${styles.rowLocked}`}>
                <span className={`serial ${styles.roundNumber}`}>R{r.roundNumber.toString().padStart(2, "0")}</span>
                <Avatar initials={recipient?.user?.initials ?? "?"} size={32} />
                <div className={styles.names}>
                  <span className={styles.memberName}>{memberName(recipient, currentUser.id)}</span>
                  <span className={styles.meta}>
                    {r.status === "paid-out"
                      ? `Paid out ${formatDate(r.paidOutAt ?? r.scheduledDate)}`
                      : `Collecting now · pays out ${formatDate(r.scheduledDate)}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="open-heading" className={styles.block}>
        <h2 id="open-heading" className={styles.blockHead}>
          Still to come
          <span className={styles.blockNote}>
            {order.length} round{order.length === 1 ? "" : "s"}
          </span>
        </h2>
        {order.length === 0 ? (
          <p className="muted">There are no rounds left to reorder.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order.map((o) => o.roundNumber.toString())} strategy={verticalListSortingStrategy}>
              <ol className={styles.list}>
                {order.map((slot, i) => {
                  const recipient = byId(slot.memberId);
                  const originalRound = bundle.rounds.find((r) => r.roundNumber === slot.roundNumber);
                  const isChanged = changed.has(slot.roundNumber);
                  const reasonOnRecord =
                    !isChanged && originalRound ? reasonForRound(bundle, originalRound.id, groupHistory) : undefined;
                  return (
                    <SortableOrderRow
                      key={slot.roundNumber}
                      id={slot.roundNumber.toString()}
                      roundNumber={slot.roundNumber}
                      dateLabel={formatDateFull(slot.scheduledDate)}
                      memberName={memberName(recipient, currentUser.id)}
                      memberInitials={recipient?.user?.initials ?? "?"}
                      changed={isChanged}
                      note={
                        isChanged
                          ? `Was ${memberName(byId(originalUnlocked[i].memberId), currentUser.id)}`
                          : reasonOnRecord
                            ? `Reason on record: “${reasonOnRecord}”`
                            : originalRound?.priorityRequest?.status === "pending"
                              ? `${memberName(byId(originalRound.priorityRequest.memberId))} asked for an earlier turn`
                              : undefined
                      }
                      onMoveUp={() => moveRow(i, -1)}
                      onMoveDown={() => moveRow(i, 1)}
                      canMoveUp={i > 0}
                      canMoveDown={i < order.length - 1}
                    />
                  );
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <div className={styles.footer} data-print-hide>
        <p className={styles.unsaved} aria-live="polite">
          {changed.size === 0
            ? "No changes yet"
            : `${changed.size} round${changed.size === 1 ? "" : "s"} changed`}
        </p>
        <div className={styles.footerActions}>
          {changed.size > 0 ? (
            <Button variant="ghost" onClick={() => setAndAnnounce(originalUnlocked, "Changes undone.")}>
              Undo all
            </Button>
          ) : null}
          <Button disabled={changed.size === 0} onClick={() => setShowModal(true)}>
            Review changes
          </Button>
        </div>
      </div>

      {showModal ? (
        <LockScheduleModal
          diff={diff}
          totalMembers={group.totalSlots}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmLock}
        />
      ) : null}
    </div>
  );
}
