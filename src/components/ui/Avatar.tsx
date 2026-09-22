import styles from "./Avatar.module.css";

interface AvatarProps {
  initials: string;
  size?: number;
  tone?: "neutral" | "accent";
}

export function Avatar({ initials, size = 30, tone = "neutral" }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${tone === "accent" ? styles.accent : ""}`}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
    >
      {initials}
    </span>
  );
}
