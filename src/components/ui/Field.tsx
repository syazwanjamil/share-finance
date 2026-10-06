import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import styles from "./Field.module.css";

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: (ids: { inputId: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {children({ inputId, describedBy, invalid: !!error })}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  prefix?: ReactNode;
  serial?: boolean;
}

export function TextField({ label, hint, error, prefix, serial, className, ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ inputId, describedBy, invalid }) => (
        <div className={`${styles.control} ${invalid ? styles.invalid : ""}`}>
          {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
          <input
            id={inputId}
            className={`${styles.input} ${serial ? "serial" : ""} ${serial ? styles.serialInput : ""} ${className ?? ""}`}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...rest}
          />
        </div>
      )}
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
}

export function TextAreaField({ label, hint, error, className, ...rest }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ inputId, describedBy, invalid }) => (
        <div className={`${styles.control} ${invalid ? styles.invalid : ""}`}>
          <textarea
            id={inputId}
            className={`${styles.input} ${styles.textarea} ${className ?? ""}`}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...rest}
          />
        </div>
      )}
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
}

export function SelectField({ label, hint, error, children, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ inputId, describedBy, invalid }) => (
        <div className={`${styles.control} ${styles.selectControl} ${invalid ? styles.invalid : ""}`}>
          <select
            id={inputId}
            className={`${styles.input} ${styles.select}`}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...rest}
          >
            {children}
          </select>
        </div>
      )}
    </FieldShell>
  );
}

/** A labelled control that isn't a text input (stepper, switch group). */
export function FieldGroup({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <div className={styles.field} role="group" aria-labelledby={id}>
      <span id={id} className={styles.label}>
        {label}
      </span>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {children}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className={styles.error} role="alert">
      <AlertCircle size={15} aria-hidden="true" />
      {children}
    </p>
  );
}
