import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { StatusPill } from "../../../components/ui/StatusPill";
import styles from "./PayoutOrderPage.module.css";

interface SortableOrderRowProps {
  id: string;
  roundNumber: number;
  memberName: string;
  memberInitials: string;
  changed: boolean;
  reason?: string;
  pendingRequestNote?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function SortableOrderRow({
  id,
  roundNumber,
  memberName,
  memberInitials,
  changed,
  reason,
  pendingRequestNote,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SortableOrderRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`${styles.row} ${changed ? styles.rowChanged : ""}`}
    >
      <div className={styles.rowLeft}>
        <span className={`${styles.roundNumber} ${changed ? styles.roundNumberChanged : ""}`}>
          {roundNumber}
        </span>
        <Avatar initials={memberInitials} />
        <div className={styles.names}>
          <span className={styles.memberName}>
            {memberName}
            {changed ? <StatusPill variant="accent">moved</StatusPill> : null}
          </span>
          {reason ? <span className={styles.reasonText}>Reason: {reason}</span> : null}
          {pendingRequestNote ? <span className={styles.reasonText}>{pendingRequestNote}</span> : null}
        </div>
      </div>
      <div className={styles.rowRight}>
        <button type="button" className={styles.iconButton} onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move up">
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Move down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </div>
    </div>
  );
}
