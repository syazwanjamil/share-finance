import type { ReactNode } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import styles from "./Notice.module.css";

interface NoticeProps {
  tone?: "info" | "warning" | "failed";
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}

const ICONS = { info: Info, warning: AlertTriangle, failed: OctagonAlert };

export function Notice({ tone = "info", title, children, action }: NoticeProps) {
  const Icon = ICONS[tone];
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === "failed" ? "alert" : undefined}>
      <Icon size={18} className={styles.icon} aria-hidden="true" />
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
