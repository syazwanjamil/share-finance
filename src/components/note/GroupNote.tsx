import type { GroupBundle } from "../../lib/api";
import { computeRoundCollection, getCurrentRound, getRecipient, memberName } from "../../lib/selectors";
import { formatDate } from "../../lib/date";
import { NoteFace, NoteWindow } from "./NoteFace";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function roundSerial(bundle: GroupBundle, roundNumber: number): string {
  return `${bundle.group.inviteCode} · R${pad(roundNumber)}/${pad(bundle.group.totalRounds)}`;
}

interface GroupNoteProps {
  bundle: GroupBundle;
  currentUserId: string;
  size?: "full" | "compact";
  headingLevel?: "h2" | "p";
  animate?: boolean;
}

/** The current round of a group, printed as its note. */
export function GroupNote({ bundle, currentUserId, size = "full", headingLevel = "h2", animate }: GroupNoteProps) {
  const { group } = bundle;
  const round = getCurrentRound(bundle);
  const collection = computeRoundCollection(bundle, group.currentRound);
  const recipient = getRecipient(bundle, round);
  const name = memberName(recipient, currentUserId);

  return (
    <NoteFace
      groupId={group.id}
      groupName={group.name}
      serial={roundSerial(bundle, group.currentRound)}
      roundLabel={`Round ${group.currentRound} of ${group.totalRounds}`}
      potLabel="pot"
      pot={collection.pool}
      paidCount={collection.paidCount}
      totalCount={collection.totalCount}
      window={
        round ? (
          <NoteWindow caption={`Pays out ${formatDate(round.scheduledDate)} to`} name={name} />
        ) : undefined
      }
      stamp={round?.status === "held" ? "held" : undefined}
      size={size}
      headingLevel={headingLevel}
      animate={animate}
    />
  );
}
