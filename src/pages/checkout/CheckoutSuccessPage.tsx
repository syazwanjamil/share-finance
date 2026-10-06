import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Printer } from "lucide-react";
import { usePaymentFlow } from "../../state/PaymentFlowContext";
import { useCurrentUser, useGroupBundle } from "../../state/AppDataContext";
import { computeRoundCollection, getPaymentForUserRound } from "../../lib/selectors";
import { formatRM } from "../../lib/currency";
import { formatDateFull, formatTime } from "../../lib/date";
import { NoteFace, NoteWindow } from "../../components/note/NoteFace";
import { roundSerial } from "../../components/note/GroupNote";
import { PageHeader } from "../../components/layout/Page";
import { Button } from "../../components/ui/Button";
import { DetailList } from "../../components/ui/DetailList";
import styles from "./CheckoutLayout.module.css";

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { flow, reset } = usePaymentFlow();
  const currentUser = useCurrentUser();
  const bundle = useGroupBundle(flow.groupId ?? undefined);
  const valid = !!bundle && flow.roundNumber != null;

  useEffect(() => {
    if (!valid) navigate("/home", { replace: true });
  }, [valid, navigate]);

  if (!bundle || flow.roundNumber == null) return null;

  const collection = computeRoundCollection(bundle, flow.roundNumber);
  const payment = getPaymentForUserRound(bundle, currentUser.id, flow.roundNumber);
  const paidAt = payment?.paidAt ?? new Date().toISOString();

  function goToGroup() {
    const id = bundle!.group.id;
    reset();
    navigate(`/groups/${id}`);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Payment received"
        lead={`Your ${bundle.group.name} contribution for round ${flow.roundNumber} is in the pot.`}
      />

      <NoteFace
        groupId={bundle.group.id}
        groupName={bundle.group.name}
        serial={roundSerial(bundle, flow.roundNumber)}
        roundLabel={`Round ${flow.roundNumber} of ${bundle.group.totalRounds}`}
        potLabel="collected so far"
        pot={collection.collected}
        paidCount={collection.paidCount}
        totalCount={collection.totalCount}
        window={<NoteWindow caption="Your share" name={formatRM(flow.amount)} />}
      />

      <DetailList
        items={[
          { term: "Amount", value: formatRM(flow.amount) },
          { term: "Reference", value: payment?.ref ? <span className="serial">{payment.ref}</span> : "Being assigned" },
          { term: "Paid with", value: "Card, through Stripe" },
          { term: "Date", value: `${formatDateFull(paidAt)}, ${formatTime(paidAt)}` },
          { term: "This round so far", value: `${collection.paidCount} of ${collection.totalCount} paid`, emphasis: true },
        ]}
      />

      <p className={styles.lead}>
        A receipt is on its way to you on WhatsApp, and the payment now shows in the group ledger for every member.
      </p>

      <div className={styles.actionsRow} data-print-hide>
        <Button onClick={goToGroup}>Back to {bundle.group.name}</Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Print receipt
        </Button>
      </div>
    </div>
  );
}
