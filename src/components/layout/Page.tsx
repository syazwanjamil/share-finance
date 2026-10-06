import type { ReactNode } from "react";
import styles from "./Page.module.css";

interface PageHeaderProps {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}

export function PageHeader({ title, lead, actions, back }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {back ? <div className={styles.back}>{back}</div> : null}
      <div className={styles.row}>
        <div className={styles.titles}>
          <h1>{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}

interface SectionProps {
  title: ReactNode;
  id?: string;
  aside?: ReactNode;
  children: ReactNode;
  lead?: ReactNode;
}

export function Section({ title, id, aside, children, lead }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.sectionHead}>
        <div className={styles.titles}>
          <h2 id={headingId}>{title}</h2>
          {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
        </div>
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {children ? <div className={styles.emptyBody}>{children}</div> : null}
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}
