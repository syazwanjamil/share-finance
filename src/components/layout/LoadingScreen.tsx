import { Rosette } from "../note/Rosette";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen({ label = "Loading your groups…" }: { label?: string }) {
  return (
    <div className={`${styles.screen} series-specimen`} role="status" aria-live="polite">
      <div className={styles.spin}>
        <Rosette total={6} inked={0} size={72} label="" animate={false} />
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
