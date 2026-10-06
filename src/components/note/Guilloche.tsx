import styles from "./Guilloche.module.css";

function wave(phase: number, amplitude: number, wavelength: number, width = 400, mid = 10): string {
  let d = "";
  for (let x = 0; x <= width; x += 2) {
    const y = mid + amplitude * Math.sin((2 * Math.PI * x) / wavelength + phase);
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(2)}`;
  }
  return d;
}

const PATHS = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((phase) =>
  wave(phase, 6.5, 22),
);

/** A printed band of interlaced sine lines, the edge of every note. */
export function GuillocheBand({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.band} ${className ?? ""}`}
      viewBox="0 0 400 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS.map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

function ring(cx: number, cy: number, r: number, amp: number, waves: number, phase: number): string {
  let d = "";
  for (let i = 0; i <= 480; i++) {
    const t = (i / 480) * Math.PI * 2;
    const rr = r + amp * Math.sin(waves * t + phase);
    d += `${i === 0 ? "M" : "L"}${(cx + rr * Math.cos(t)).toFixed(1)} ${(cy + rr * Math.sin(t)).toFixed(1)}`;
  }
  return `${d}Z`;
}

// Two phase-shifted ring families interlace like a lathe pattern; three sine families of
// fine, tightly spaced lines run under the figure.
const UNDERPRINT_RINGS = Array.from({ length: 44 }, (_, i) =>
  ring(470, 150, 30 + i * 7, 2.2, 36 + Math.floor(i / 2) * 2, (i % 2) * Math.PI),
);
const UNDERPRINT_WAVES = Array.from({ length: 3 }, (_, family) =>
  Array.from({ length: 26 }, (_, i) => wave(family * ((2 * Math.PI) / 3), 3.2, 26, 620, 6 + i * 12)),
).flat();

/** Fine-line background print across the whole note face: concentric waved rings behind the
 *  rosette and long sine lines under the figure. Very low contrast, behind everything. */
export function Underprint({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {UNDERPRINT_WAVES.map((d, i) => (
        <path key={`w${i}`} d={d} />
      ))}
      {UNDERPRINT_RINGS.map((d, i) => (
        <path key={`r${i}`} d={d} />
      ))}
    </svg>
  );
}

/** Microprinted rule: reads as a fine line until you look closely. Decorative, never the only copy. */
export function Microprint({ text, animate }: { text: string; animate?: boolean }) {
  const line = `${text} · `.repeat(24);
  return (
    <div className={`${styles.micro} ${animate ? styles.inkIn : ""}`} aria-hidden="true">
      {line}
    </div>
  );
}
