import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import styles from "./MemberRow.module.css";

interface MemberRowProps {
  initials: string;
  name: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
}

export function MemberRow({ initials, name, meta, trailing }: MemberRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.identity}>
        <Avatar initials={initials} />
        <div className={styles.names}>
          <span className={styles.name}>{name}</span>
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </div>
      </div>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}
