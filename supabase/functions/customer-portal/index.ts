import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed origins for redirect URLs (prevent open redirect attacks)
const ALLOWED_ORIGINS = [
  "https://saveme.space",
  "https://www.saveme.space",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

function isAllowedOrigin(origin: string | null): string {
  if (!origin) return ALLOWED_ORIGINS[0]; // Default to production

  // Check if origin matches any allowed origin
  const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
  for (const allowed of ALLOWED_ORIGINS) {
    if (normalizedOrigin === allowed.toLowerCase()) {
      return origin;
    }
  }

  // If not in allowlist, default to production origin
  console.warn(`Rejected untrusted origin: ${origin}`);
  return ALLOWED_ORIGINS[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customerId = customers.data[0].id;

    // Validate and sanitize origin to prevent open redirect attacks
    const requestOrigin = req.headers.get("origin");
    const safeOrigin = isAllowedOrigin(requestOrigin);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${safeOrigin}/subscription`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
