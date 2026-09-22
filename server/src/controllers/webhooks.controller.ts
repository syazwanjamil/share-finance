import type { Request, Response } from "express";
import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { config } from "../config/env.js";
import { stripe } from "../lib/stripeClient.js";
import {
  createGatewayEvent,
  findGatewayEventById,
  updateGatewayEventStatus,
} from "../repositories/paymentGatewayEvent.repository.js";
import { finalizePaymentFromWebhook } from "../services/payment.service.js";
import { syncAccountStatus } from "../services/connect.service.js";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe) {
    res.status(503).send("Stripe not configured");
    return;
  }

  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature as string, config.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    req.log?.warn({ err }, "Stripe webhook signature verification failed");
    res.status(400).send("Invalid signature");
    return;
  }

  const existing = await findGatewayEventById(event.id);
  if (existing?.status === "processed") {
    res.status(200).json({ received: true });
    return;
  }

  const logRow =
    existing ??
    (await createGatewayEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
    }));

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
        await finalizePaymentFromWebhook(session.id, { success: true, paymentIntentId });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await finalizePaymentFromWebhook(session.id, {
          success: false,
          failureReason: event.type === "checkout.session.expired" ? "Checkout session expired" : "Payment failed",
        });
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await syncAccountStatus(account);
        break;
      }
      default:
        await updateGatewayEventStatus(logRow.id, "ignored");
        res.status(200).json({ received: true });
        return;
    }

    await updateGatewayEventStatus(logRow.id, "processed");
    res.status(200).json({ received: true });
  } catch (err) {
    req.log?.error({ err }, "Failed to process Stripe webhook event");
    await updateGatewayEventStatus(logRow.id, "failed", err instanceof Error ? err.message : String(err));
    // Still 200: the event is durably logged; retrying won't fix a bug in our handler.
    res.status(200).json({ received: true });
  }
}
