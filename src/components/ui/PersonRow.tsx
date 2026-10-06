import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import styles from "./PersonRow.module.css";

interface PersonRowProps {
  initials: string;
  name: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  self?: boolean;
  as?: "li" | "div";
}

export function PersonRow({ initials, name, meta, trailing, self, as: Tag = "li" }: PersonRowProps) {
  return (
    <Tag className={styles.row}>
      <Avatar initials={initials} self={self} />
      <div className={styles.names}>
        <span className={styles.name}>{name}</span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </div>
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </Tag>
  );
}
