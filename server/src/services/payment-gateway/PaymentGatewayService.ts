export type GatewayPaymentMethod = "card";

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
  /** Hosted-checkout gateways (e.g. Stripe) require a redirect — null when not needed. */
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
 * instantly, for local dev without live Stripe keys; `StripePaymentGatewayService` is the
 * real implementation, selected via `PAYMENT_GATEWAY_PROVIDER`, with zero call-site changes.
 *
 * `lookup` is a read-through status check, not a confirmation trigger: for gateways whose
 * confirmation is webhook-driven (e.g. Stripe Checkout), the authoritative state change
 * happens from the webhook handler, and `lookup` is only used for polling/UI purposes.
 */
export interface PaymentGatewayService {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  lookup(gatewayRef: string): Promise<LookupPaymentResult>;
}
