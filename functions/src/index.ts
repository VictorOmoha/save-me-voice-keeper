import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// CORS middleware
const corsHandler = cors({origin: true});

// Helper to wrap functions with CORS
const withCors = (
  handler: (req: functions.https.Request, res: functions.Response) => Promise<void>
) => {
  return (req: functions.https.Request, res: functions.Response) => {
    corsHandler(req, res, async () => {
      await handler(req, res);
    });
  };
};

// Verify Firebase Auth token
const verifyAuth = async (req: functions.https.Request): Promise<admin.auth.DecodedIdToken | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
};

/**
 * ElevenLabs Text-to-Speech Cloud Function
 */
export const elevenlabsTts = functions.https.onRequest(
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

    const {text, voiceId, modelId} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get API key from Firebase config
    const apiKey = functions.config().elevenlabs?.api_key;
    if (!apiKey) {
      res.status(500).json({error: "ElevenLabs API key not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "pNInz6obpgDQGcFmaJgB"}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: modelId || "eleven_turbo_v2",
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.9,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", errorText);
        res.status(response.status).json({
          error: "ElevenLabs API error",
          details: errorText,
        });
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      res.json({audioContent: base64Audio});
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

/**
 * Google Cloud Text-to-Speech Cloud Function
 */
export const googleCloudTts = functions.https.onRequest(
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

    const {text, voiceName, languageCode} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get API key from Firebase config
    const apiKey = functions.config().google?.tts_api_key;
    if (!apiKey) {
      res.status(500).json({error: "Google TTS API key not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: {text},
            voice: {
              languageCode: languageCode || "en-US",
              name: voiceName || "en-US-Neural2-F",
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.0,
              pitch: 0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google TTS API error:", errorText);
        res.status(response.status).json({
          error: "Google TTS API error",
          details: errorText,
        });
        return;
      }

      const data = await response.json();
      res.json({audioContent: data.audioContent});
    } catch (error) {
      console.error("Google TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

/**
 * MiniMax Text-to-Speech Cloud Function
 */
export const minimaxTts = functions.https.onRequest(
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

    const {text, voice_id, speed, vol, pitch} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get API key (JWT token) from Firebase config
    const apiKey = functions.config().minimax?.api_key;
    const groupId = functions.config().minimax?.group_id;

    if (!apiKey || !groupId) {
      res.status(500).json({error: "MiniMax API credentials not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "speech-01-turbo",
            text,
            stream: false,
            voice_setting: {
              voice_id: voice_id || "male-qn-qingse",
              speed: speed || 1.0,
              vol: vol || 1.0,
              pitch: pitch || 0,
            },
            audio_setting: {
              sample_rate: 32000,
              bitrate: 128000,
              format: "mp3",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MiniMax API error:", errorText);
        res.status(response.status).json({
          error: "MiniMax API error",
          details: errorText,
        });
        return;
      }

      const data = await response.json();

      if (data.audio_file) {
        // MiniMax returns base64 encoded audio
        res.json({audioContent: data.audio_file});
      } else if (data.extra_info?.audio_file) {
        res.json({audioContent: data.extra_info.audio_file});
      } else {
        console.error("MiniMax response missing audio:", data);
        res.status(500).json({error: "No audio content in response"});
      }
    } catch (error) {
      console.error("MiniMax TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

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

    const {priceId, successUrl, cancelUrl} = req.body;

    if (!priceId) {
      res.status(400).json({error: "Price ID is required"});
      return;
    }

    // Get Stripe secret key from Firebase config
    const stripeSecretKey = functions.config().stripe?.secret_key;
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
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl || `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.origin}/subscription`,
        metadata: {
          firebaseUserId: user.uid,
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
    const stripeSecretKey = functions.config().stripe?.secret_key;
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
        return_url: returnUrl || `${req.headers.origin}/settings`,
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
  const stripeSecretKey = functions.config().stripe?.secret_key;
  const webhookSecret = functions.config().stripe?.webhook_secret;

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

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
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
    const session = event.data.object as any;
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
    const subscription = event.data.object as any;
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
          getPlanFromPriceId(subscription.items.data[0]?.price?.id) : "free",
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

/**
 * AI Brain Dump Enhancement Function
 */
export const enhanceBrainDump = functions.https.onRequest(
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

    const {text, mode} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get OpenAI API key from Firebase config
    const openaiKey = functions.config().openai?.api_key;
    if (!openaiKey) {
      res.status(500).json({error: "OpenAI API key not configured"});
      return;
    }

    try {
      const systemPrompt = mode === "organize" ?
        "You are an assistant that organizes and structures messy thoughts into clear categories and action items." :
        "You are an assistant that helps expand and elaborate on ideas, providing additional context and suggestions.";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {role: "system", content: systemPrompt},
            {role: "user", content: text},
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        res.status(response.status).json({error: "OpenAI API error"});
        return;
      }

      const data = await response.json();
      const enhancedText = data.choices[0]?.message?.content;

      res.json({enhancedText});
    } catch (error) {
      console.error("Brain dump enhancement error:", error);
      res.status(500).json({error: "Failed to enhance text"});
    }
  })
);
