import crypto from "node:crypto";
import type {
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentGatewayService,
} from "./PaymentGatewayService.js";

/** Simulates instant gateway success, matching the current frontend's mocked checkout flow. */
export class SimulatedPaymentGatewayService implements PaymentGatewayService {
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const gatewayRef = `SIM-${crypto.randomBytes(6).toString("hex")}`;
    void input;
    return { gatewayRef, redirectUrl: null };
  }

  async confirm(gatewayRef: string): Promise<ConfirmPaymentResult> {
    void gatewayRef;
    return { success: true };
  }
}
