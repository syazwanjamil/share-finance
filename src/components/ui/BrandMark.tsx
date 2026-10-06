import styles from "./BrandMark.module.css";

/** Six-petal guilloche rosette plus the wordmark. */
export function BrandMark({ showName = true, size = 24 }: { showName?: boolean; size?: number }) {
  return (
    <span className={styles.brand}>
      <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false" className={styles.mark}>
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <ellipse cx="0" cy="-24" rx="10" ry="22" />
            <ellipse cx="0" cy="-24" rx="4.5" ry="17" />
          </g>
        ))}
      </svg>
      {showName ? <span className={styles.name}>Share Finance</span> : <span className="visually-hidden">Share Finance</span>}
    </span>
  );
}
