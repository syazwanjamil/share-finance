import type { ReactNode } from "react";
import { formatFigure } from "../../lib/currency";
import { seriesClass } from "../../lib/series";
import { GuillocheBand, Microprint, Underprint } from "./Guilloche";
import { Rosette } from "./Rosette";
import styles from "./NoteFace.module.css";

export type NoteStamp = "held" | "issued" | "specimen";

interface NoteFaceProps {
  groupId: string | null;
  groupName: string;
  /** Real references only: the invite code and round position. */
  serial?: string;
  roundLabel: string;
  potLabel: string;
  pot: number;
  paidCount: number;
  totalCount: number;
  /** Content of the see-through window, usually who receives the pot and when. */
  window?: ReactNode;
  stamp?: NoteStamp;
  size?: "full" | "compact";
  animate?: boolean;
  headingLevel?: "h2" | "p";
}

const STAMP_TEXT: Record<NoteStamp, string> = {
  held: "On hold",
  issued: "Paid out",
  specimen: "Specimen",
};

export function NoteFace({
  groupId,
  groupName,
  serial,
  roundLabel,
  potLabel,
  pot,
  paidCount,
  totalCount,
  window,
  stamp,
  size = "full",
  animate = true,
  headingLevel = "h2",
}: NoteFaceProps) {
  const Heading = headingLevel;
  const compact = size === "compact";
  const rosetteLabel = `${paidCount} of ${totalCount} members have paid`;

  return (
    <section
      className={`${styles.note} ${compact ? styles.compact : ""} ${seriesClass(groupId)}`}
      aria-label={`${groupName}, ${roundLabel}`}
    >
      <Underprint className={styles.underprint} />
      <GuillocheBand />
      <div className={styles.frame}>
        <header className={styles.head}>
          <Heading className={styles.groupName}>{groupName}</Heading>
          {serial ? <span className={`serial ${styles.serial}`}>{serial}</span> : null}
        </header>

        <div className={styles.body}>
          <div className={styles.value}>
            <p className={styles.potLabel}>
              {roundLabel} · {potLabel}
            </p>
            <p className={styles.figure}>
              <span className={styles.currency}>RM</span>
              <span className="figures">
                {formatFigure(pot)
                  .split(",")
                  .map((part, i) => (
                    <span key={i}>
                      {i > 0 ? <span className={styles.sep}>,</span> : null}
                      {part}
                    </span>
                  ))}
              </span>
            </p>
            {window ? <div className={styles.window}>{window}</div> : null}
          </div>

          <Rosette
            total={totalCount}
            inked={paidCount}
            size={compact ? 104 : 164}
            label={rosetteLabel}
            animate={animate}
          >
            <span className={styles.count}>
              <span className={`figures ${styles.countFigure}`}>
                {paidCount}
                <span className={styles.countShort}>/{totalCount}</span>
              </span>
              <span className={styles.countLabel}>of {totalCount} paid</span>
            </span>
          </Rosette>
        </div>

        <Microprint text={`${groupName} · ${roundLabel} · RM ${formatFigure(pot)} · Share Finance`} animate={animate} />
      </div>
      <GuillocheBand />

      {stamp ? (
        <span className={`${styles.stamp} ${styles[`stamp-${stamp}`]}`} aria-label={`Stamped: ${STAMP_TEXT[stamp]}`}>
          {STAMP_TEXT[stamp]}
        </span>
      ) : null}
    </section>
  );
}

/** The two lines inside a note's window: a caption and the name it points to. */
export function NoteWindow({ caption, name }: { caption: ReactNode; name: ReactNode }) {
  return (
    <>
      <span className={styles.windowCaption}>{caption}</span>
      <span className={styles.windowName}>{name}</span>
    </>
  );
}
