import { config } from "../../config/env.js";
import { stripe } from "../../lib/stripeClient.js";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  LookupPaymentResult,
  PaymentGatewayService,
} from "./PaymentGatewayService.js";

function requireStripe() {
  if (!stripe) throw new Error("Stripe client not initialized (PAYMENT_GATEWAY_PROVIDER must be 'stripe')");
  return stripe;
}

/** Payment-in via Stripe Checkout (hosted redirect). Confirmation is webhook-driven; see webhooks.controller.ts. */
export class StripePaymentGatewayService implements PaymentGatewayService {
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const client = requireStripe();
    const returnUrl = `${config.FRONTEND_BASE_URL}/pay/${input.groupId}/${input.roundNumber}/return`;

    const session = await client.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "myr",
            unit_amount: Math.round(input.amount * 100),
            product_data: { name: `Round ${input.roundNumber} contribution` },
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&canceled=1`,
      metadata: {
        internalRef: input.reference,
        groupId: input.groupId,
        roundNumber: String(input.roundNumber),
        memberId: input.memberId,
      },
    });

    return { gatewayRef: session.id, redirectUrl: session.url };
  }

  async lookup(gatewayRef: string): Promise<LookupPaymentResult> {
    const client = requireStripe();
    const session = await client.checkout.sessions.retrieve(gatewayRef, { expand: ["payment_intent"] });

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (session.payment_status === "paid") {
      return { status: "succeeded", paymentIntentId };
    }
    if (session.status === "expired") {
      return { status: "failed", failureReason: "Checkout session expired", paymentIntentId };
    }
    return { status: "pending", paymentIntentId };
  }
}
