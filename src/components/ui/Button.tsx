import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: ButtonVariant = "primary", block?: boolean, extra?: string): string {
  return [styles.button, styles[variant], block ? styles.block : "", extra].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** "primary" is the reserved colour: one per screen. */
  variant?: ButtonVariant;
  block?: boolean;
}

export function Button({ variant = "primary", block, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, block, className)} {...rest} />;
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  block?: boolean;
}

export function ButtonLink({ variant = "secondary", block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, block, className)} {...rest} />;
}
