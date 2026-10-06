import type { ReactNode } from "react";
import styles from "./Rosette.module.css";

interface RosetteProps {
  /** One petal per slot in the group. */
  total: number;
  /** Petals inked in the series colour (members who have paid this round). */
  inked: number;
  size?: number;
  /** Rendered in the hollow centre of the rosette. */
  children?: ReactNode;
  label: string;
  /** Ink the petals in on mount. Off for small repeated uses. */
  animate?: boolean;
}

const R_INNER = 44;
const R_OUTER = 92;
const LINES_PER_PETAL = 4;

function wavyRing(radius: number, amplitude: number, waves: number, phase: number): string {
  const steps = 360;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.sin(waves * t + phase);
    const x = (r * Math.cos(t)).toFixed(2);
    const y = (r * Math.sin(t)).toFixed(2);
    d += `${i === 0 ? "M" : "L"}${x} ${y}`;
  }
  return `${d}Z`;
}

/**
 * The collection meter: a guilloche rosette with one petal per member. Ghost linework is always
 * printed; a petal is inked over it once that member's contribution lands.
 */
export function Rosette({ total, inked, size = 148, children, label, animate = true }: RosetteProps) {
  const count = Math.max(1, total);
  const step = 360 / count;
  const centre = (R_INNER + R_OUTER) / 2;
  const radial = (R_OUTER - R_INNER) / 2;
  const arc = (2 * Math.PI * centre) / count;
  const tangential = Math.min(17, arc * 0.62);
  const waves = Math.max(24, count * 4);

  const petals = Array.from({ length: count }, (_, i) => i);
  const lines = Array.from({ length: LINES_PER_PETAL }, (_, k) => ({
    rx: tangential * (0.3 + (0.7 * k) / (LINES_PER_PETAL - 1)),
    ry: radial - k * 1.6,
  }));

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg className={styles.svg} viewBox="-100 -100 200 200" role="img" aria-label={label}>
        <g className={styles.ring}>
          <path d={wavyRing(97, 2.2, waves, 0)} />
          <path d={wavyRing(97, 2.2, waves, Math.PI)} />
          <circle r={R_INNER - 5} />
          <path d={wavyRing(R_INNER - 8, 1.2, Math.max(12, count * 2), 0)} />
        </g>
        {petals.map((i) => (
          <g key={`ghost-${i}`} className={styles.ghost} transform={`rotate(${i * step})`}>
            {lines.map((l, k) => (
              <ellipse key={k} cx={0} cy={-centre} rx={l.rx} ry={l.ry} />
            ))}
          </g>
        ))}
        {petals.slice(0, Math.min(inked, count)).map((i) => (
          <g
            key={`ink-${i}`}
            className={`${styles.ink} ${animate ? styles.animate : ""}`}
            transform={`rotate(${i * step})`}
            style={{ ["--i" as string]: i }}
          >
            {lines.map((l, k) => (
              <ellipse key={k} cx={0} cy={-centre} rx={l.rx} ry={l.ry} pathLength={1} />
            ))}
          </g>
        ))}
      </svg>
      {children ? <div className={styles.centre}>{children}</div> : null}
    </div>
  );
}
