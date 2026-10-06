import styles from "./Avatar.module.css";

interface AvatarProps {
  initials: string;
  size?: number;
  /** Set when the member is the viewer. */
  self?: boolean;
}

export function Avatar({ initials, size = 32, self }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${self ? styles.self : ""}`}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
