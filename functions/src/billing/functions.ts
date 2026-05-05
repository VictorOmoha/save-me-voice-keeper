import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {withCors} from "../common/http";
import {verifyAuth} from "../common/auth";
import {
  getCheckoutPlanConfig,
  getSafeOrigin,
  sanitizeReturnUrl,
} from "./safety";

/**
 * Stripe Create Checkout Session
 */
export const createCheckout = functions.https.onRequest(
  withCors(async (req, res) => {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {plan} = req.body;
    const checkoutPlan = getCheckoutPlanConfig(plan);

    if (!checkoutPlan) {
      res.status(400).json({error: "Valid plan is required"});
      return;
    }

    // Get Stripe secret key from Firebase config
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      res.status(500).json({error: "Stripe not configured"});
      return;
    }

    // Dynamic import for Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    try {
      // Get or create Stripe customer
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(user.uid).get();
      let customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            firebaseUserId: user.uid,
          },
        });
        customerId = customer.id;

        // Save customer ID to Firestore
        await db.collection("users").doc(user.uid).set({
          stripeCustomerId: customerId,
        }, {merge: true});
      }

      // Create checkout session
      const requestOrigin = getSafeOrigin(req.headers.origin);
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: checkoutPlan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${requestOrigin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${requestOrigin}/subscription`,
        metadata: {
          firebaseUserId: user.uid,
          plan: checkoutPlan.plan,
        },
      });

      res.json({sessionId: session.id, url: session.url});
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({error: "Failed to create checkout session"});
    }
  })
);

/**
 * Stripe Customer Portal
 */
export const customerPortal = functions.https.onRequest(
  withCors(async (req, res) => {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {returnUrl} = req.body;

    // Get Stripe secret key from Firebase config
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      res.status(500).json({error: "Stripe not configured"});
      return;
    }

    // Dynamic import for Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    try {
      // Get Stripe customer ID from Firestore
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(user.uid).get();
      const customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
        res.status(400).json({error: "No subscription found"});
        return;
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: sanitizeReturnUrl(returnUrl, req.headers.origin, "/settings"),
      });

      res.json({url: session.url});
    } catch (error) {
      console.error("Customer portal error:", error);
      res.status(500).json({error: "Failed to create portal session"});
    }
  })
);

/**
 * Stripe Webhook Handler
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    res.status(500).json({error: "Stripe not configured"});
    return;
  }

  // Dynamic import for Stripe
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({error: "Missing signature"});
    return;
  }

  const rawBody = req.rawBody || req.body;
  if (!rawBody) {
    console.error("Stripe webhook: no rawBody available on request");
    res.status(400).json({error: "Missing request body"});
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    res.status(400).json({error: "Invalid signature"});
    return;
  }

  const db = admin.firestore();

  // Handle the event
  switch (event.type) {
  case "checkout.session.completed": {
    const session = event.data.object as { metadata?: { firebaseUserId?: string }; subscription?: string | null };
    const userId = session.metadata?.firebaseUserId;

    if (userId) {
      await db.collection("users").doc(userId).set({
        subscriptionStatus: "active",
        subscriptionId: session.subscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    }
    break;
  }

  case "customer.subscription.updated":
  case "customer.subscription.deleted": {
    const subscription = event.data.object as { customer?: string; status?: string; items?: { data?: Array<{ price?: { id?: string } }> } };
    const customerId = subscription.customer;

    // Find user by customer ID
    const usersSnapshot = await db.collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.set({
        subscriptionStatus: subscription.status,
        subscriptionTier: subscription.status === "active" ?
          getPlanFromPriceId(subscription.items?.data?.[0]?.price?.id || "") : "free",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    }
    break;
  }

  default:
    console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});

/**
 * Helper to determine plan tier from Stripe price ID
 */
function getPlanFromPriceId(priceId: string): string {
  // Map your Stripe price IDs to plan names
  const priceMap: Record<string, string> = {
    // Add your actual Stripe price IDs here
    "price_basic_monthly": "basic",
    "price_basic_yearly": "basic",
    "price_premium_monthly": "premium",
    "price_premium_yearly": "premium",
    "price_enterprise_monthly": "enterprise",
    "price_enterprise_yearly": "enterprise",
  };

  return priceMap[priceId] || "basic";
}

