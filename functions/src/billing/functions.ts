import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type Stripe from "stripe";
import {withCors} from "../common/http";
import {verifyAuth} from "../common/auth";
import {getCheckoutPlanConfig, getSafeOrigin, sanitizeReturnUrl} from "./safety";
import {BillingConfigurationError, customerBelongsToUser, loadPriceCatalog, normalizeLifecycle, type BillingEntitlement, type LifecycleEvent} from "./core";
import {getStripeClient} from "./stripeClient";

const configurationFailure = (res: functions.Response, error: unknown): boolean => {
  if (!(error instanceof BillingConfigurationError)) return false;
  console.error("Billing configuration error:", error.message);
  res.status(503).json({error: "Billing is not configured"});
  return true;
};

export const createCheckout = functions.https.onRequest(withCors(async (req, res) => {
  const user = await verifyAuth(req);
  if (!user) return void res.status(401).json({error: "Unauthorized"});
  if (req.method !== "POST") return void res.status(405).json({error: "Method not allowed"});
  try {
    const checkoutPlan = getCheckoutPlanConfig(req.body?.plan);
    if (!checkoutPlan) return void res.status(400).json({error: "Valid plan is required"});
    const stripe = getStripeClient();
    const db = admin.firestore();
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    let customerId = userDoc.data()?.stripeCustomerId as string | undefined;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customerBelongsToUser(customer as Stripe.Customer | Stripe.DeletedCustomer, user.uid)) {
        console.error("Checkout customer ownership mismatch", {uid: user.uid, customerId});
        return void res.status(409).json({error: "Billing customer ownership mismatch"});
      }
    } else {
      const customer = await stripe.customers.create({email: user.email || undefined, metadata: {firebaseUserId: user.uid}}, {idempotencyKey: `firebase-customer-${user.uid}`});
      customerId = customer.id;
      await userRef.set({stripeCustomerId: customerId}, {merge: true});
    }
    const requestOrigin = getSafeOrigin(req.headers.origin);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{price: checkoutPlan.priceId, quantity: 1}],
      mode: "subscription",
      success_url: `${requestOrigin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${requestOrigin}/subscription`,
      client_reference_id: user.uid,
      metadata: {firebaseUserId: user.uid, plan: checkoutPlan.plan},
      subscription_data: {metadata: {firebaseUserId: user.uid}},
    });
    res.json({sessionId: session.id, url: session.url});
  } catch (error) {
    if (configurationFailure(res, error)) return;
    console.error("Stripe checkout error:", error);
    res.status(500).json({error: "Failed to create checkout session"});
  }
}));

export const customerPortal = functions.https.onRequest(withCors(async (req, res) => {
  const user = await verifyAuth(req);
  if (!user) return void res.status(401).json({error: "Unauthorized"});
  if (req.method !== "POST") return void res.status(405).json({error: "Method not allowed"});
  try {
    const stripe = getStripeClient();
    const userDoc = await admin.firestore().collection("users").doc(user.uid).get();
    const customerId = userDoc.data()?.stripeCustomerId as string | undefined;
    if (!customerId) return void res.status(400).json({error: "No subscription found"});
    const customer = await stripe.customers.retrieve(customerId);
    if (!customerBelongsToUser(customer as Stripe.Customer | Stripe.DeletedCustomer, user.uid)) {
      console.error("Portal customer ownership mismatch", {uid: user.uid, customerId});
      return void res.status(403).json({error: "Billing customer ownership mismatch"});
    }
    const session = await stripe.billingPortal.sessions.create({customer: customerId, return_url: sanitizeReturnUrl(req.body?.returnUrl, req.headers.origin, "/settings")});
    res.json({url: session.url});
  } catch (error) {
    if (configurationFailure(res, error)) return;
    console.error("Customer portal error:", error);
    res.status(500).json({error: "Failed to create portal session"});
  }
}));

const customerIdOf = (value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null => typeof value === "string" ? value : value?.id || null;

const lifecycleFromEvent = (event: Stripe.Event): LifecycleEvent | null => {
  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    return {id: event.id, created: event.created, type: event.type, status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status, priceId: subscription.items.data[0]?.price.id, customerId: customerIdOf(subscription.customer), subscriptionId: subscription.id, currentPeriodEnd: subscription.current_period_end};
  }
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const line = invoice.lines.data.find((item) => Boolean(item.price?.id));
    return {id: event.id, created: event.created, type: event.type, status: "past_due", priceId: line?.price?.id, customerId: customerIdOf(invoice.customer), subscriptionId: typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id || null};
  }
  return null;
};

const findOwnerUid = async (db: FirebaseFirestore.Firestore, customerId: string): Promise<string | null> => {
  const snapshot = await db.collection("users").where("stripeCustomerId", "==", customerId).limit(2).get();
  if (snapshot.size !== 1) {
    console.error("Stripe customer must map to exactly one user", {customerId, matches: snapshot.size});
    return null;
  }
  return snapshot.docs[0].id;
};

const applyLifecycleEvent = async (db: FirebaseFirestore.Firestore, uid: string, event: LifecycleEvent): Promise<"processed" | "duplicate"> => {
  const catalog = loadPriceCatalog();
  const ledgerRef = db.collection("stripe_event_ledger").doc(event.id);
  const entitlementRef = db.collection("billing_entitlements").doc(uid);
  return db.runTransaction(async (transaction) => {
    if ((await transaction.get(ledgerRef)).exists) return "duplicate";
    const entitlementDoc = await transaction.get(entitlementRef);
    const previous = entitlementDoc.exists ? entitlementDoc.data() as BillingEntitlement : undefined;
    const next = normalizeLifecycle(uid, event, catalog, previous);
    transaction.create(ledgerRef, {eventId: event.id, eventType: event.type, eventCreated: event.created, uid, processedAt: admin.firestore.FieldValue.serverTimestamp(), stateApplied: !previous || next !== previous});
    if (next !== previous) {
      transaction.set(entitlementRef, {...next, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
      transaction.set(db.collection("users").doc(uid), {subscriptionTier: next.plan, subscriptionStatus: next.status, subscriptionActive: next.entitled, subscriptionId: next.stripeSubscriptionId, billingEntitlementVersion: next.schemaVersion, updatedAt: admin.firestore.FieldValue.serverTimestamp()}, {merge: true});
    }
    return "processed";
  });
};

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) return void res.status(503).json({error: "Billing is not configured"});
  let event: Stripe.Event;
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) return void res.status(400).json({error: "Missing signature"});
    event = getStripeClient().webhooks.constructEvent(req.rawBody || req.body, signature, webhookSecret);
  } catch (error) {
    if (configurationFailure(res, error)) return;
    console.error("Webhook signature verification failed:", error);
    return void res.status(400).json({error: "Invalid signature"});
  }
  try {
    const lifecycle = lifecycleFromEvent(event);
    if (!lifecycle) return void res.json({received: true, ignored: true});
    if (!lifecycle.customerId) return void res.status(400).json({error: "Event has no customer"});
    const db = admin.firestore();
    const uid = await findOwnerUid(db, lifecycle.customerId);
    if (!uid) return void res.status(409).json({error: "Customer ownership is not unique"});
    const result = await applyLifecycleEvent(db, uid, lifecycle);
    res.json({received: true, duplicate: result === "duplicate"});
  } catch (error) {
    if (configurationFailure(res, error)) return;
    console.error("Stripe webhook processing failed:", {eventId: event.id, error});
    res.status(500).json({error: "Webhook processing failed"});
  }
});
