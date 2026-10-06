import { useId } from "react";
import type { ReactNode } from "react";
import styles from "./Switch.module.css";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span id={`${id}-label`} className={styles.label}>
          {label}
        </span>
        {description ? (
          <span id={`${id}-desc`} className={styles.description}>
            {description}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={`${styles.switch} ${checked ? styles.on : ""}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className={styles.knob} />
      </button>
    </div>
  );
}
