import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "subtle";
}

export function Card({ variant = "default", className, ...rest }: CardProps) {
  const variantClass = variant === "highlight" ? styles.highlight : variant === "subtle" ? styles.subtle : "";
  return <div className={[styles.card, variantClass, className].filter(Boolean).join(" ")} {...rest} />;
}
