import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { useCurrentUser, useGroupBundle } from "../../../state/AppDataContext";
import { computeRoundCollection, getRecipient, getRoundByNumber, memberName } from "../../../lib/selectors";
import { formatRM } from "../../../lib/currency";
import { formatDateFull, formatTime } from "../../../lib/date";
import { NoteFace, NoteWindow } from "../../../components/note/NoteFace";
import { roundSerial } from "../../../components/note/GroupNote";
import { PageHeader } from "../../../components/layout/Page";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { DetailList } from "../../../components/ui/DetailList";
import layout from "../../checkout/CheckoutLayout.module.css";

interface ReceiptState {
  amount: number;
  recipientName?: string;
  roundNumber: number;
}

export function PayoutReceiptPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const bundle = useGroupBundle(groupId);
  const receiptState = location.state as ReceiptState | null;
  const valid = !!bundle && !!receiptState;

  useEffect(() => {
    if (!valid) navigate(`/groups/${groupId}`, { replace: true });
  }, [valid, navigate, groupId]);

  if (!bundle || !receiptState) return null;

  const { group } = bundle;
  const round = getRoundByNumber(bundle, receiptState.roundNumber);
  const collection = computeRoundCollection(bundle, receiptState.roundNumber);
  const nextRound = getRoundByNumber(bundle, receiptState.roundNumber + 1);
  const nextRecipient = getRecipient(bundle, nextRound);
  const sentAt = round?.paidOutAt ?? new Date().toISOString();

  return (
    <div className={layout.page}>
      <PageHeader title="Payout sent" lead={`Round ${receiptState.roundNumber} of ${group.totalRounds} is closed.`} />

      <NoteFace
        groupId={group.id}
        groupName={group.name}
        serial={roundSerial(bundle, receiptState.roundNumber)}
        roundLabel={`Round ${receiptState.roundNumber} of ${group.totalRounds}`}
        potLabel="paid out"
        pot={receiptState.amount}
        paidCount={collection.paidCount}
        totalCount={collection.totalCount}
        window={<NoteWindow caption="Sent to" name={receiptState.recipientName ?? "Recipient"} />}
        stamp="issued"
      />

      <DetailList
        items={[
          { term: "Sent to", value: receiptState.recipientName },
          { term: "Amount", value: formatRM(receiptState.amount) },
          {
            term: "Reference",
            value: round?.paidOutRef ? <span className="serial">{round.paidOutRef}</span> : "Being assigned",
          },
          { term: "Released by", value: "You" },
          { term: "Date", value: `${formatDateFull(sentAt)}, ${formatTime(sentAt)}` },
        ]}
      />

      <p className={layout.lead}>
        It's recorded in the group ledger, where every member can see it.{" "}
        {nextRound
          ? `Next: round ${nextRound.roundNumber} pays out ${formatDateFull(nextRound.scheduledDate)} to ${memberName(nextRecipient, currentUser.id)}.`
          : "This was the final round of the cycle."}
      </p>

      <div className={layout.actionsRow} data-print-hide>
        <ButtonLink to={`/groups/${group.id}`} variant="primary">
          Back to {group.name}
        </ButtonLink>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Print receipt
        </Button>
      </div>
    </div>
  );
}
