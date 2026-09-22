import styles from "./Stepper.module.css";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function Stepper({ value, onChange, min = 2, max = 30 }: StepperProps) {
  return (
    <div className={styles.row}>
      <span className={styles.value}>{value}</span>
      <div className={styles.controls}>
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="Decrease"
        >
          −
        </button>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="Increase"
        >
          ＋
        </button>
      </div>
    </div>
  );
}
