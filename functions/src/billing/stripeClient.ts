import Stripe from "stripe";
import {BillingConfigurationError} from "./core";

let client: Stripe | undefined;

/** One Stripe client and API version for checkout, portal, and webhook paths. */
export const getStripeClient = (env: NodeJS.ProcessEnv = process.env): Stripe => {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new BillingConfigurationError("STRIPE_SECRET_KEY is required");
  if (!client) client = new Stripe(secret, {apiVersion: "2023-10-16"});
  return client;
};
