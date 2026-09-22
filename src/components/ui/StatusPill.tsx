import type { ReactNode } from "react";
import styles from "./StatusPill.module.css";

export type StatusPillVariant = "success" | "warning" | "accent" | "accentOutline" | "neutral" | "dark";

interface StatusPillProps {
  children: ReactNode;
  variant?: StatusPillVariant;
}

export function StatusPill({ children, variant = "neutral" }: StatusPillProps) {
  return <span className={`${styles.pill} ${styles[variant]}`}>{children}</span>;
}
