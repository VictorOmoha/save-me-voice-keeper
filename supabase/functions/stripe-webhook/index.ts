import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  // Initialize Supabase client with service role for admin access
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the raw body and signature for verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Webhook signature verification failed: ${message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, stripe, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, stripe, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, stripe, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Webhook processing error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to get user by Stripe customer email
async function getUserByEmail(supabase: any, email: string) {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return null;
  }
  return users.users.find((u: any) => u.email === email);
}

// Handle successful checkout
async function handleCheckoutCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  console.log("Processing checkout.session.completed");

  if (!session.customer || !session.subscription) {
    console.log("No customer or subscription in session");
    return;
  }

  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer.id;

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    console.error("Customer not found or has no email");
    return;
  }

  const user = await getUserByEmail(supabase, customer.email);
  if (!user) {
    console.error(`No user found for email: ${customer.email}`);
    return;
  }

  // Get subscription details
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = getPlanFromSubscription(subscription);

  // Upsert subscriber record
  const { error } = await supabase
    .from("subscribers")
    .upsert({
      user_id: user.id,
      email: customer.email,
      stripe_customer_id: customerId,
      subscription_tier: plan,
      subscribed: true,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "email"
    });

  if (error) {
    console.error("Error upserting subscriber:", error);
  } else {
    console.log(`Subscription created for ${customer.email}: ${plan}`);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  console.log("Processing subscription update");

  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    console.error("Customer not found or has no email");
    return;
  }

  const plan = getPlanFromSubscription(subscription);
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  const { error } = await supabase
    .from("subscribers")
    .upsert({
      email: customer.email,
      stripe_customer_id: customerId,
      subscription_tier: plan,
      subscribed: isActive,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "email"
    });

  if (error) {
    console.error("Error updating subscriber:", error);
  } else {
    console.log(`Subscription updated for ${customer.email}: ${plan}, active: ${isActive}`);
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  console.log("Processing subscription deletion");

  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    console.error("Customer not found or has no email");
    return;
  }

  const { error } = await supabase
    .from("subscribers")
    .update({
      subscribed: false,
      subscription_tier: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("email", customer.email);

  if (error) {
    console.error("Error canceling subscription:", error);
  } else {
    console.log(`Subscription canceled for ${customer.email}`);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  // Could log to a payments table or send confirmation email
}

// Handle failed payment
async function handlePaymentFailed(
  supabase: any,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  console.log(`Payment failed for invoice: ${invoice.id}`);

  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    return;
  }

  // Mark subscription as having payment issues
  const { error } = await supabase
    .from("subscribers")
    .update({
      payment_failed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("email", customer.email);

  if (error) {
    console.error("Error marking payment failed:", error);
  } else {
    console.log(`Payment failure recorded for ${customer.email}`);
  }
}

// Determine plan tier from subscription price
function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  const item = subscription.items.data[0];
  if (!item) return "free";

  const amount = item.price.unit_amount || 0;

  // Match prices from create-checkout function
  if (amount >= 4999) return "enterprise";
  if (amount >= 1999) return "premium";
  if (amount >= 999) return "basic";

  return "free";
}
