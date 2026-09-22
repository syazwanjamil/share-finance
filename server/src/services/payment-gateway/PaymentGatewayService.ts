export type GatewayPaymentMethod = "fpx" | "ewallet" | "qr";

export interface InitiatePaymentInput {
  amount: number;
  method: GatewayPaymentMethod;
  reference: string;
}

export interface InitiatePaymentResult {
  gatewayRef: string;
  /** Some real gateways require a redirect for FPX/bank login — null when not needed. */
  redirectUrl: string | null;
}

export interface ConfirmPaymentResult {
  success: boolean;
  failureReason?: string;
}

/**
 * Abstraction over the payment processor. `SimulatedPaymentGatewayService` resolves
 * instantly (mirroring the current frontend's simulated FPX/e-wallet/QR flow); a real
 * gateway (Billplz/ToyyibPay/Curlec/etc.) implements the same interface later and is
 * selected via `PAYMENT_GATEWAY_PROVIDER`, with zero call-site changes.
 */
export interface PaymentGatewayService {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  confirm(gatewayRef: string): Promise<ConfirmPaymentResult>;
}
