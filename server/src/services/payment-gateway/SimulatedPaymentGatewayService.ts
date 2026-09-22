import crypto from "node:crypto";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  LookupPaymentResult,
  PaymentGatewayService,
} from "./PaymentGatewayService.js";

/** Simulates instant gateway success, matching the current frontend's mocked checkout flow. */
export class SimulatedPaymentGatewayService implements PaymentGatewayService {
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const gatewayRef = `SIM-${crypto.randomBytes(6).toString("hex")}`;
    void input;
    return { gatewayRef, redirectUrl: null };
  }

  async lookup(gatewayRef: string): Promise<LookupPaymentResult> {
    void gatewayRef;
    return { status: "succeeded" };
  }
}
