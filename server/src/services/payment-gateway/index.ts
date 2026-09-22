import { config } from "../../config/env.js";
import { SimulatedPaymentGatewayService } from "./SimulatedPaymentGatewayService.js";
import type { PaymentGatewayService } from "./PaymentGatewayService.js";

function createPaymentGatewayService(): PaymentGatewayService {
  switch (config.PAYMENT_GATEWAY_PROVIDER) {
    case "simulated":
    default:
      // billplz | toyyibpay | curlec real implementations plug in here later,
      // selected by the same PAYMENT_GATEWAY_PROVIDER env var — no call-site changes.
      return new SimulatedPaymentGatewayService();
  }
}

export const paymentGatewayService: PaymentGatewayService = createPaymentGatewayService();
export type { PaymentGatewayService } from "./PaymentGatewayService.js";
