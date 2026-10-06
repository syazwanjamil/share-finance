import { Minus, Plus } from "lucide-react";
import styles from "./Stepper.module.css";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit: string;
}

export function Stepper({ value, onChange, min = 2, max = 30, unit }: StepperProps) {
  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.step}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Fewer ${unit}`}
      >
        <Minus size={18} aria-hidden="true" />
      </button>
      <output className={styles.value} aria-live="polite">
        <span className="figures">{value}</span> <span className={styles.unit}>{unit}</span>
      </output>
      <button
        type="button"
        className={styles.step}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`More ${unit}`}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
