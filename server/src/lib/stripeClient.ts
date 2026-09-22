import Stripe from "stripe";
import { config } from "../config/env.js";

export const stripe = config.PAYMENT_GATEWAY_PROVIDER === "stripe" ? new Stripe(config.STRIPE_SECRET_KEY) : null;
