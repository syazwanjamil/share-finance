import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import styles from "./PayoutOrderPage.module.css";

interface SortableOrderRowProps {
  id: string;
  roundNumber: number;
  dateLabel: string;
  memberName: string;
  memberInitials: string;
  changed: boolean;
  note?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function SortableOrderRow({
  id,
  roundNumber,
  dateLabel,
  memberName,
  memberInitials,
  changed,
  note,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SortableOrderRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${styles.row} ${changed ? styles.rowChanged : ""} ${isDragging ? styles.dragging : ""}`}
    >
      <span className={`serial ${styles.roundNumber}`}>R{roundNumber.toString().padStart(2, "0")}</span>
      <Avatar initials={memberInitials} size={32} />
      <div className={styles.names}>
        <span className={styles.memberName}>
          {memberName}
          {changed ? <span className={styles.moved}>Moved</span> : null}
        </span>
        <span className={styles.meta}>{dateLabel}</span>
        {note ? <span className={styles.note}>{note}</span> : null}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label={`Move ${memberName} to an earlier round`}
        >
          <ChevronUp size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={`Move ${memberName} to a later round`}
        >
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.grip}`}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${memberName} to reorder`}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
