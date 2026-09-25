import type Stripe from "stripe";
import { ApiError } from "../lib/ApiError.js";
import { config } from "../config/env.js";
import { stripe } from "../lib/stripeClient.js";
import {
  findUserById,
  findUserByStripeConnectAccountId,
  setUserStripeConnectAccountId,
  updateUserConnectStatus,
} from "../repositories/user.repository.js";

function requireStripe() {
  if (!stripe) throw new Error("Stripe client not initialized (PAYMENT_GATEWAY_PROVIDER must be 'stripe')");
  return stripe;
}

export async function createOnboardingLink(userId: string): Promise<{ url: string }> {
  const client = requireStripe();
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("USER_NOT_FOUND", "User not found");

  let accountId = user.stripeConnectAccountId;
  if (!accountId) {
    const account = await client.accounts.create({
      type: "express",
      country: "MY",
      email: undefined,
      capabilities: { transfers: { requested: true } },
    });
    accountId = account.id;
    await setUserStripeConnectAccountId(userId, accountId);
  }

  const accountLink = await client.accountLinks.create({
    account: accountId,
    return_url: `${config.FRONTEND_BASE_URL}/settings/payout/return`,
    refresh_url: `${config.FRONTEND_BASE_URL}/settings/payout/refresh`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

export async function syncAccountStatus(account: Stripe.Account): Promise<void> {
  const user = await findUserByStripeConnectAccountId(account.id);
  if (!user) return; // event for an account not tracked by this app — ignore

  const detailsSubmitted = account.details_submitted ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  await updateUserConnectStatus(user.id, {
    stripeConnectDetailsSubmitted: detailsSubmitted,
    stripeConnectPayoutsEnabled: payoutsEnabled,
    stripeConnectOnboarded: detailsSubmitted && payoutsEnabled,
  });
}

export async function getOnboardingStatus(userId: string): Promise<{ onboarded: boolean; accountId: string | null }> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("USER_NOT_FOUND", "User not found");
  return { onboarded: user.stripeConnectOnboarded, accountId: user.stripeConnectAccountId };
}

// Dev/test helper: stands in for a completed Stripe Connect Express onboarding
// without a real Stripe round-trip, so payouts can be exercised in local/dev envs.
export async function simulateOnboarding(userId: string): Promise<{ onboarded: boolean; accountId: string | null }> {
  if (config.NODE_ENV === "production") {
    throw ApiError.forbidden("NOT_ALLOWED_IN_PRODUCTION", "Onboarding cannot be simulated in production");
  }
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("USER_NOT_FOUND", "User not found");

  const accountId = user.stripeConnectAccountId ?? `acct_sim_${userId.slice(0, 8)}`;
  if (!user.stripeConnectAccountId) {
    await setUserStripeConnectAccountId(userId, accountId);
  }
  await updateUserConnectStatus(userId, {
    stripeConnectDetailsSubmitted: true,
    stripeConnectPayoutsEnabled: true,
    stripeConnectOnboarded: true,
  });

  return { onboarded: true, accountId };
}
