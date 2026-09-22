export type GatewayPaymentMethod = "fpx" | "ewallet" | "qr" | "card";

export interface InitiatePaymentInput {
  amount: number;
  method: GatewayPaymentMethod;
  reference: string;
  groupId: string;
  roundNumber: number;
  memberId: string;
}

export interface InitiatePaymentResult {
  gatewayRef: string;
  /** Some real gateways require a redirect for FPX/bank login or hosted checkout — null when not needed. */
  redirectUrl: string | null;
}

export type PaymentLookupStatus = "pending" | "succeeded" | "failed";

export interface LookupPaymentResult {
  status: PaymentLookupStatus;
  failureReason?: string;
  paymentIntentId?: string;
}

/**
 * Abstraction over the payment processor. `SimulatedPaymentGatewayService` resolves
 * instantly (mirroring the current frontend's simulated FPX/e-wallet/QR flow); a real
 * gateway (Stripe/Billplz/ToyyibPay/Curlec/etc.) implements the same interface later and is
 * selected via `PAYMENT_GATEWAY_PROVIDER`, with zero call-site changes.
 *
 * `lookup` is a read-through status check, not a confirmation trigger: for gateways whose
 * confirmation is webhook-driven (e.g. Stripe Checkout), the authoritative state change
 * happens from the webhook handler, and `lookup` is only used for polling/UI purposes.
 */
export interface PaymentGatewayService {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  lookup(gatewayRef: string): Promise<LookupPaymentResult>;
}
