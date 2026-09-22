import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type PaymentMethod = "fpx" | "ewallet" | "qr" | "card";

interface PaymentFlowState {
  groupId: string | null;
  roundNumber: number | null;
  amount: number;
  method: PaymentMethod;
  autopay: boolean;
  status: "idle" | "confirming" | "success" | "failed";
}

interface PaymentFlowContextValue {
  flow: PaymentFlowState;
  startPayment: (groupId: string, roundNumber: number, amount: number) => void;
  setMethod: (method: PaymentMethod) => void;
  setAutopay: (autopay: boolean) => void;
  setStatus: (status: PaymentFlowState["status"]) => void;
  reset: () => void;
}

const initialFlow: PaymentFlowState = {
  groupId: null,
  roundNumber: null,
  amount: 0,
  method: "fpx",
  autopay: false,
  status: "idle",
};

const PaymentFlowContext = createContext<PaymentFlowContextValue | null>(null);

export function PaymentFlowProvider({ children }: { children: ReactNode }) {
  const [flow, setFlow] = useState<PaymentFlowState>(initialFlow);

  const value = useMemo<PaymentFlowContextValue>(
    () => ({
      flow,
      startPayment: (groupId, roundNumber, amount) =>
        setFlow((f) => ({ ...f, groupId, roundNumber, amount, status: "idle" })),
      setMethod: (method) => setFlow((f) => ({ ...f, method })),
      setAutopay: (autopay) => setFlow((f) => ({ ...f, autopay })),
      setStatus: (status) => setFlow((f) => ({ ...f, status })),
      reset: () => setFlow(initialFlow),
    }),
    [flow],
  );

  return <PaymentFlowContext.Provider value={value}>{children}</PaymentFlowContext.Provider>;
}

export function usePaymentFlow(): PaymentFlowContextValue {
  const ctx = useContext(PaymentFlowContext);
  if (!ctx) throw new Error("usePaymentFlow must be used within PaymentFlowProvider");
  return ctx;
}
