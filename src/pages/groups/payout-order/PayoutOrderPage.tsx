import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAppData, useGroupBundle } from "../../../state/AppDataContext";
import { getMembersWithUsers } from "../../../mock/selectors";
import { Button } from "../../../components/ui/Button";
import { SortableOrderRow } from "./SortableOrderRow";
import { LockScheduleModal } from "./LockScheduleModal";
import type { OrderDiffEntry } from "./LockScheduleModal";
import styles from "./PayoutOrderPage.module.css";

interface SlotEntry {
  roundNumber: number;
  scheduledDate: string;
  memberId: string;
}

export function PayoutOrderPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const bundle = useGroupBundle(groupId);
  const { dispatch } = useAppData();

  const membersWithUsers = useMemo(() => (bundle ? getMembersWithUsers(bundle) : []), [bundle]);

  const lockedRounds = useMemo(
    () => (bundle ? bundle.rounds.filter((r) => r.status === "paid-out") : []),
    [bundle],
  );
  const originalUnlocked = useMemo(
    () =>
      bundle
        ? bundle.rounds
            .filter((r) => r.status !== "paid-out")
            .map((r) => ({ roundNumber: r.roundNumber, scheduledDate: r.scheduledDate, memberId: r.recipientMemberId }))
        : [],
    [bundle],
  );

  const [order, setOrder] = useState<SlotEntry[]>(originalUnlocked);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setOrder(originalUnlocked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!bundle) return <div>Group not found.</div>;

  const userById = (id: string) => membersWithUsers.find((m) => m.member.id === id);

  const changedRoundNumbers = new Set(
    order.filter((o, i) => o.memberId !== originalUnlocked[i]?.memberId).map((o) => o.roundNumber),
  );
  const dirtyCount = changedRoundNumbers.size;

  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = prev.map((slot) => slot.memberId);
      [next[index], next[target]] = [next[target], next[index]];
      return prev.map((slot, i) => ({ ...slot, memberId: next[i] }));
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.findIndex((o) => o.roundNumber.toString() === active.id);
      const newIndex = prev.findIndex((o) => o.roundNumber.toString() === over.id);
      const memberIds = arrayMove(
        prev.map((o) => o.memberId),
        oldIndex,
        newIndex,
      );
      return prev.map((slot, i) => ({ ...slot, memberId: memberIds[i] }));
    });
  }

  function handleShuffle() {
    setOrder((prev) => {
      const ids = prev.map((o) => o.memberId);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      return prev.map((slot, i) => ({ ...slot, memberId: ids[i] }));
    });
  }

  function handleReset() {
    setOrder(originalUnlocked);
  }

  const diff: OrderDiffEntry[] = order
    .filter((o, i) => o.memberId !== originalUnlocked[i]?.memberId)
    .map((o) => {
      const originalAtRound = originalUnlocked.find((orig) => orig.roundNumber === o.roundNumber);
      return {
        roundNumber: o.roundNumber,
        scheduledDate: o.scheduledDate,
        oldName: userById(originalAtRound?.memberId ?? "")?.user?.name ?? "—",
        newName: userById(o.memberId)?.user?.name ?? "—",
      };
    });

  function handleConfirmLock(reason: string) {
    dispatch({
      type: "APPLY_PAYOUT_ORDER_CHANGE",
      groupId: bundle!.group.id,
      changes: order.map((o) => ({ roundNumber: o.roundNumber, newRecipientMemberId: o.memberId, reason })),
      reason,
    });
    setShowModal(false);
    navigate(`/groups/${bundle!.group.id}`);
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Payout order</div>
          <div className={styles.subtitle}>
            Unlocked · drag or use the arrows to reorder rounds {lockedRounds.length + 1}–{bundle.group.totalRounds}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={handleShuffle}>
            Shuffle randomly
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className={styles.infoBox}>
        Rounds already paid out are locked. Members see every change and the reason you give.
      </div>

      {lockedRounds.map((r) => {
        const recipient = userById(r.recipientMemberId);
        return (
          <div key={r.id} className={`${styles.row} ${styles.rowLocked}`}>
            <div className={styles.rowLeft}>
              <span className={styles.roundNumber}>{r.roundNumber}</span>
              <div className={styles.names}>
                <span className={styles.memberName}>{recipient?.user?.name}</span>
              </div>
            </div>
            <span className={styles.reasonText}>paid out {r.paidOutAt ? new Date(r.paidOutAt).toDateString() : ""}</span>
          </div>
        );
      })}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={order.map((o) => o.roundNumber.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className={styles.list}>
            {order.map((slot, i) => {
              const recipient = userById(slot.memberId);
              const originalRound = bundle.rounds.find((r) => r.roundNumber === slot.roundNumber);
              const changed = changedRoundNumbers.has(slot.roundNumber);
              return (
                <SortableOrderRow
                  key={slot.roundNumber}
                  id={slot.roundNumber.toString()}
                  roundNumber={slot.roundNumber}
                  memberName={recipient?.user?.name ?? "—"}
                  memberInitials={recipient?.user?.initials ?? "?"}
                  changed={changed}
                  reason={changed ? originalRound?.priorityRequest?.reason : undefined}
                  pendingRequestNote={
                    !changed && originalRound?.priorityRequest?.status === "pending"
                      ? "1 priority request pending"
                      : undefined
                  }
                  onMoveUp={() => moveRow(i, -1)}
                  onMoveDown={() => moveRow(i, 1)}
                  canMoveUp={i > 0}
                  canMoveDown={i < order.length - 1}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className={styles.footer}>
        <span className={styles.unsavedText}>
          {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}{" "}
          {dirtyCount > 0 ? (
            <button type="button" className={styles.undoLink} onClick={handleReset}>
              undo
            </button>
          ) : null}
        </span>
        <Button disabled={dirtyCount === 0} onClick={() => setShowModal(true)}>
          Lock schedule &amp; notify
        </Button>
      </div>

      {showModal ? (
        <LockScheduleModal
          diff={diff}
          totalMembers={bundle.group.totalSlots}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmLock}
        />
      ) : null}
    </>
  );
}
