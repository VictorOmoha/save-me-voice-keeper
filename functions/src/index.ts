import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import {GoogleAuth} from "google-auth-library";
import {createSharedMemory} from "./sharedMemory/create";
import {searchSharedMemories} from "./sharedMemory/search";
import {getSharedMemory} from "./sharedMemory/get";
import {listSharedMemories} from "./sharedMemory/list";
import {updateSharedMemory} from "./sharedMemory/update";
import {batchCreateSharedMemories} from "./sharedMemory/batchCreate";
import {SharedMemoryCreateInput, SharedMemorySearchInput} from "./sharedMemory/types";

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

// Verify Firebase Auth token OR agent API key
const verifyAuth = async (req: functions.https.Request): Promise<admin.auth.DecodedIdToken | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];

  // Agent API key path — allows OpenClaw / Hermes to call shared-memory endpoints
  // without a Firebase ID token. Key is stored in AGENT_API_KEY env var.
  const agentApiKey = process.env.AGENT_API_KEY;
  if (agentApiKey && token === agentApiKey) {
    const agentUserId = process.env.AGENT_USER_ID || "nia-openclaw-agent";
    return {
      uid: agentUserId,
      aud: "saveme-f5af0",
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: "agent-key",
      sub: agentUserId,
      firebase: { identities: {}, sign_in_provider: "agent-key" },
    } as admin.auth.DecodedIdToken;
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
};

/**
 * Fetch with retry — retries on 503/429 with exponential backoff
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 503 && res.status !== 429) return res;
    lastError = new Error(`Gemini returned ${res.status} on attempt ${attempt + 1}`);
    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[fetchWithRetry] ${res.status} — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError!;
};

export const sharedMemoryCreate = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const input = req.body as SharedMemoryCreateInput;
    if (!input?.title || !input?.content || !input?.type || !input?.source) {
      res.status(400).json({error: "title, content, type, and source are required"});
      return;
    }

    try {
      const db = admin.firestore();
      const result = await createSharedMemory(user.uid, input, db);
      res.json({ok: true, ...result});
    } catch (error) {
      console.error("sharedMemoryCreate error:", error);
      res.status(500).json({error: "Failed to create shared memory"});
    }
  })
);

export const sharedMemorySearch = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const input = (req.body || {}) as SharedMemorySearchInput;

    try {
      const db = admin.firestore();
      const results = await searchSharedMemories(user.uid, input, db);
      res.json({ok: true, results});
    } catch (error) {
      console.error("sharedMemorySearch error:", error);
      res.status(500).json({error: "Failed to search shared memories"});
    }
  })
);

export const sharedMemoryGet = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const id = req.body?.id;
    if (!id) {
      res.status(400).json({error: "id is required"});
      return;
    }

    try {
      const db = admin.firestore();
      const memory = await getSharedMemory(user.uid, id, db);
      if (!memory) {
        res.status(404).json({error: "Memory not found"});
        return;
      }
      res.json({ok: true, memory});
    } catch (error) {
      console.error("sharedMemoryGet error:", error);
      res.status(500).json({error: "Failed to get shared memory"});
    }
  })
);

export const sharedMemoryList = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const input = (req.body || {}) as SharedMemorySearchInput;

    try {
      const db = admin.firestore();
      const memories = await listSharedMemories(user.uid, input, db);
      res.json({ok: true, memories});
    } catch (error) {
      console.error("sharedMemoryList error:", error);
      res.status(500).json({error: "Failed to list shared memories"});
    }
  })
);

export const sharedMemoryUpdate = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const id = req.body?.id;
    const patch = req.body?.patch;
    if (!id || !patch) {
      res.status(400).json({error: "id and patch are required"});
      return;
    }

    try {
      const db = admin.firestore();
      const result = await updateSharedMemory(user.uid, id, patch, db);
      if (!result.ok && result.reason === "not_found") {
        res.status(404).json({error: "Memory not found"});
        return;
      }
      if (!result.ok) {
        res.status(403).json({error: "Forbidden"});
        return;
      }
      res.json({ok: true});
    } catch (error) {
      console.error("sharedMemoryUpdate error:", error);
      res.status(500).json({error: "Failed to update shared memory"});
    }
  })
);

export const sharedMemoryBatchCreate = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const memories = req.body?.memories as SharedMemoryCreateInput[] | undefined;
    if (!Array.isArray(memories) || memories.length === 0) {
      res.status(400).json({error: "memories array is required"});
      return;
    }

    try {
      const db = admin.firestore();
      const result = await batchCreateSharedMemories(user.uid, memories, db);
      res.json({ok: true, ...result});
    } catch (error) {
      console.error("sharedMemoryBatchCreate error:", error);
      res.status(500).json({error: "Failed to batch create shared memories"});
    }
  })
);

/**
 * Transcribe audio to text using Gemini — lightweight, no agent logic.
 * Used by Brain Dump capture to get a raw transcript from recorded audio.
 */
export const transcribeAudio = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {audioData, audioMimeType} = req.body;
    if (!audioData) {
      res.status(400).json({error: "audioData is required"});
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(500).json({error: "Gemini API key not configured"});
      return;
    }

    try {
      const transcribeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            systemInstruction: {parts: [{text: "You are a precise audio transcription service. Your ONLY job is to listen to audio and output the exact words spoken. Never add commentary, labels, timestamps, or formatting. If multiple sentences are spoken, write them all. If no speech is detected, return exactly: [NO_SPEECH]"}]},
            contents: [{
              parts: [
                {inlineData: {mimeType: audioMimeType || "audio/webm", data: audioData}},
                {text: "Transcribe this audio."},
              ],
            }],
            generationConfig: {maxOutputTokens: 2048, temperature: 0},
          }),
        }
      );

      if (!transcribeRes.ok) {
        const errText = await transcribeRes.text();
        console.error("[transcribeAudio] Gemini error:", transcribeRes.status, errText.substring(0, 200));
        res.status(500).json({error: "Transcription failed"});
        return;
      }

      const data = await transcribeRes.json();
      const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      console.log("[transcribeAudio] Result:", JSON.stringify(transcript).substring(0, 200));

      if (!transcript || transcript === "[NO_SPEECH]" || transcript === ".") {
        res.json({transcript: "", detected: false});
      } else {
        res.json({transcript, detected: true});
      }
    } catch (error) {
      console.error("[transcribeAudio] Exception:", error);
      res.status(500).json({error: "Transcription failed"});
    }
  })
);

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

    // Get API key from environment
    const apiKey = process.env.ELEVENLABS_API_KEY;
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
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
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
    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;

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

/**
 * Public Demo TTS - Rate-limited Google Cloud TTS proxy for landing page
 * No auth required, but limited to short texts and throttled per IP
 */
const demoRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Google Cloud TTS voice options for demo
const DEMO_VOICES: Record<string, { name: string; languageCode: string }> = {
  rachel: {name: "en-US-Studio-O", languageCode: "en-US"},       // Warm female
  adam: {name: "en-US-Studio-M", languageCode: "en-US"},          // Professional male
  aria: {name: "en-US-Neural2-F", languageCode: "en-US"},         // Expressive female
  josh: {name: "en-US-Neural2-D", languageCode: "en-US"},         // Deep male
};

export const demoTts = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    // Rate limit: 10 requests per minute per IP
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const ipKey = typeof clientIp === "string" ? clientIp : String(clientIp);
    const now = Date.now();
    const limit = demoRateLimitMap.get(ipKey);

    if (limit && limit.resetAt > now) {
      if (limit.count >= 10) {
        res.status(429).json({error: "Rate limit exceeded. Try again in a minute."});
        return;
      }
      limit.count++;
    } else {
      demoRateLimitMap.set(ipKey, {count: 1, resetAt: now + 60000});
    }

    // Clean up old entries periodically
    if (demoRateLimitMap.size > 1000) {
      for (const [key, val] of demoRateLimitMap) {
        if (val.resetAt < now) demoRateLimitMap.delete(key);
      }
    }

    const {text, voice} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Limit text length for demo (prevent abuse)
    if (text.length > 500) {
      res.status(400).json({error: "Text too long for demo (max 500 chars)"});
      return;
    }

    // Resolve voice name from friendly key or use default
    const voiceConfig = DEMO_VOICES[voice || "rachel"] || DEMO_VOICES.rachel;

    try {
      // Use Application Default Credentials (service account) — no API key needed
      const auth = new GoogleAuth({scopes: ["https://www.googleapis.com/auth/cloud-platform"]});
      const accessToken = await auth.getAccessToken();

      const response = await fetch(
        "https://texttospeech.googleapis.com/v1/text:synthesize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            input: {text},
            voice: {
              languageCode: voiceConfig.languageCode,
              name: voiceConfig.name,
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
        console.error("Demo TTS Google error:", response.status, errorText);
        res.status(response.status).json({error: "Google TTS API error", details: errorText});
        return;
      }

      const data = await response.json() as { audioContent?: string };

      // Google TTS returns base64 audioContent directly
      res.json({audioContent: data.audioContent});
    } catch (error) {
      console.error("Demo TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// VOICE AGENT — Conversational AI for SaveMe.Space
// Gemini 2.5 Flash (function calling) + ElevenLabs TTS
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const VOICE_AGENT_TOOLS = [
  {
    functionDeclarations: [
      // ── App Control ────────────────────────────────────────────────────────
      {
        name: "navigateApp",
        description: "Navigate the user to a different page or section of the app.",
        parameters: {
          type: "OBJECT",
          properties: {
            route: {
              type: "STRING",
              enum: ["/dashboard", "/all-entries", "/insights", "/settings", "/brain-dump", "/subscription"],
              description: "The route to navigate to",
            },
          },
          required: ["route"],
        },
      },
      {
        name: "navigateToCategory",
        description: "Navigate to a specific category view.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {type: "STRING", description: "Category name (e.g. Health, Finance, Documents)"},
          },
          required: ["category"],
        },
      },
      {
        name: "openEntryForm",
        description: "Open the form to create a new entry.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {type: "STRING", description: "Pre-select a category (optional)"},
          },
        },
      },
      {
        name: "openEntry",
        description: "Open or view a specific entry by ID or title.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {type: "STRING", description: "Entry ID (if known)"},
            title: {type: "STRING", description: "Entry title to find and open"},
          },
        },
      },
      {
        name: "closeEntry",
        description: "Close the current entry or modal and go back to the previous page. Use when user says 'close', 'go back', 'exit', 'back', 'close this', 'close the entry'.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {type: "STRING", description: "Optional reason (ignored)"},
          },
        },
      },
      {
        name: "scrollPage",
        description: "Scroll the current page. Use when user says 'scroll down', 'scroll up', 'go to top', 'go to bottom', 'scroll to the bottom', 'show me more', 'keep going'.",
        parameters: {
          type: "OBJECT",
          properties: {
            direction: {type: "STRING", enum: ["down", "up", "top", "bottom"], description: "Scroll direction: down/up by one screen, or jump to top/bottom"},
          },
          required: ["direction"],
        },
      },
      {
        name: "startBrainDump",
        description: "Navigate to the Brain Dump page and start voice capture. Use when user says 'brain dump', 'start brain dump', 'open brain dump', 'capture my thoughts'.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {type: "STRING", description: "Optional reason (ignored)"},
          },
        },
      },
      {
        name: "processBrainDump",
        description: "Process and structure the current brain dump text into notes, action items, and key points. Use when user says 'process', 'structure this', 'organize my thoughts', 'analyze'.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {type: "STRING", description: "Optional reason (ignored)"},
          },
        },
      },
      {
        name: "saveBrainDump",
        description: "Save the processed brain dump to the vault. Use when user says 'save this', 'save the brain dump', 'save my notes'.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {type: "STRING", description: "Category to save under (optional, e.g. Work, Personal, Health)"},
          },
        },
      },
      // ── Vault Operations ───────────────────────────────────────────────────
      {
        name: "saveEntry",
        description: `Save a new entry to the user's vault.
Use 'content' for general notes, reminders, ideas, or anything that's just a block of text.
Use 'fields' (array of {key, value} pairs) for structured data: contacts, finance, medical, recipes, credentials, etc.
Examples:
- "Remember to call Mom tomorrow" → content only
- "Save John's contact: phone 555-1234, email john@gmail.com" → fields [{key:"Phone",value:"555-1234"},{key:"Email",value:"john@gmail.com"}]
- "Note: meeting at 3pm about the budget" → content only
- "Save my blood pressure: 120/80, pulse 72" → fields [{key:"Blood Pressure",value:"120/80"},{key:"Pulse",value:"72 bpm"}]`,
        parameters: {
          type: "OBJECT",
          properties: {
            title: {type: "STRING", description: "Short title or summary"},
            content: {type: "STRING", description: "Main text content — use for general notes and reminders"},
            category: {type: "STRING", description: "Category (e.g. Personal, Work, Health, Finance, Contacts, Ideas)"},
            fields: {
              type: "ARRAY",
              description: "Structured key-value pairs — use for contacts, finance, medical, etc.",
              items: {
                type: "OBJECT",
                properties: {
                  key: {type: "STRING", description: "Field name (e.g. Phone, Email, Amount)"},
                  value: {type: "STRING", description: "Field value"},
                },
                required: ["key", "value"],
              },
            },
          },
          required: ["title"],
        },
      },
      {
        name: "searchEntries",
        description: "Search the vault by keywords or topic.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {type: "STRING", description: "What to search for"},
            limit: {type: "NUMBER", description: "Max results (default 5)"},
          },
          required: ["query"],
        },
      },
      {
        name: "getRecentEntries",
        description: "Get the most recently saved entries.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: {type: "NUMBER", description: "How many to fetch (default 5)"},
            category: {type: "STRING", description: "Filter by category (optional)"},
          },
        },
      },
      {
        name: "updateEntry",
        description: "Update an existing entry by ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {type: "STRING", description: "Entry ID"},
            title: {type: "STRING", description: "New title (optional)"},
            content: {type: "STRING", description: "New content (optional)"},
            category: {type: "STRING", description: "New category (optional)"},
          },
          required: ["id"],
        },
      },
      {
        name: "deleteEntry",
        description: "Delete an entry by ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {type: "STRING", description: "Entry ID to delete"},
          },
          required: ["id"],
        },
      },
      // ── Settings Operations ───────────────────────────────────────────────
      {
        name: "updateTheme",
        description: "Change the app's color theme. Use when user says 'dark mode', 'light mode', 'switch theme', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            theme: {type: "STRING", enum: ["light", "dark", "system"], description: "The theme to set"},
          },
          required: ["theme"],
        },
      },
      {
        name: "updateProfile",
        description: "Update the user's profile info (display name or phone). Use when user says 'change my name', 'update my profile', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            fullName: {type: "STRING", description: "New display name"},
            phone: {type: "STRING", description: "New phone number"},
          },
        },
      },
      {
        name: "toggleNotification",
        description: "Enable or disable a notification type. Use when user says 'turn on/off notifications', 'disable email alerts', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            type: {type: "STRING", enum: ["email_notifications", "push_notifications", "reminder_notifications", "automation_notifications"], description: "Which notification type"},
            enabled: {type: "BOOLEAN", description: "true to enable, false to disable"},
          },
          required: ["type", "enabled"],
        },
      },
      {
        name: "updateVoiceSettings",
        description: "Change voice/speech settings. Use when user says 'change language', 'set speech rate', 'switch to Google voice', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            voice_language: {type: "STRING", enum: ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-PT", "ja-JP", "ko-KR", "zh-CN"], description: "Speech recognition language"},
            tts_service: {type: "STRING", enum: ["elevenlabs", "google", "minimax", "browser"], description: "Text-to-speech provider"},
            voice_speech_rate: {type: "NUMBER", description: "Speech rate (0.5 to 2.0)"},
            voice_volume: {type: "NUMBER", description: "TTS volume (0 to 1)"},
            voice_continuous_listening: {type: "BOOLEAN", description: "Whether to keep listening after responses"},
            voice_auto_speak: {type: "BOOLEAN", description: "Whether to auto-speak responses"},
            voice_audio_cue_enabled: {type: "BOOLEAN", description: "Whether to play end-of-speech tone"},
          },
        },
      },
      {
        name: "exportUserData",
        description: "Export all of the user's data as a downloadable file. Use when user says 'export my data', 'download my entries', 'backup my data'.",
        parameters: {
          type: "OBJECT",
          properties: {
            format: {type: "STRING", enum: ["json", "csv"], description: "Export format (default json)"},
          },
        },
      },
      // ── Memory Operations ─────────────────────────────────────────────────
      {
        name: "rememberFact",
        description: "Store a personal fact or preference about the user for future reference. Use when user says 'remember that...', 'keep in mind...', 'note that I...', 'my X is Y'. Also use proactively when the user reveals personal information worth remembering (names of family members, preferences, important dates, recurring habits).",
        parameters: {
          type: "OBJECT",
          properties: {
            content: {
              type: "STRING",
              description: "The fact to remember, written in third person. E.g., 'Victor\\'s wife is named Sarah', 'Victor prefers dark mode', 'Victor has a dentist appointment every 6 months'",
            },
            category: {
              type: "STRING",
              enum: ["personal", "health", "finance", "work", "contacts", "preferences", "schedule"],
              description: "Category of the fact",
            },
            overrides: {
              type: "STRING",
              description: "If this corrects a previous fact, describe what it replaces. E.g., 'wife name was Sarah'",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "recallMemories",
        description: "Search Nova's memory for relevant facts about the user. Use BEFORE answering questions about the user's preferences, history, or personal details. Use when the user asks 'do you remember...', 'what do you know about me', 'what\\'s my...'. Also use proactively when context would improve your response.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "What to search for in memory. E.g., 'wife name', 'health preferences', 'work schedule'",
            },
            category: {
              type: "STRING",
              enum: ["personal", "health", "finance", "work", "contacts", "preferences", "schedule"],
              description: "Optional category filter",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "forgetMemory",
        description: "Remove a specific memory about the user. Use when user says 'forget that...', 'delete that memory', 'that\\'s no longer true', 'remove what you know about...'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "Description of what to forget. E.g., 'my wife\\'s name', 'my old address'",
            },
          },
          required: ["query"],
        },
      },
      // ── Agentic Intelligence Tools ──────────────────────────────────────────
      {
        name: "getEntityGraph",
        description: "Look up people, projects, organizations, or topics in the user's knowledge graph. Returns entities and their connected entries. Use when user asks 'who is involved in X', 'what do I know about X', 'tell me about X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {type: "STRING", description: "Entity name or topic to look up"},
            type: {type: "STRING", enum: ["person", "project", "organization", "topic", "location", "event"], description: "Filter by entity type (optional)"},
          },
          required: ["query"],
        },
      },
      {
        name: "getRelatedEntries",
        description: "Get entries related to a specific entry or topic. Shows connections, shared entities, and recent updates. Use proactively when user mentions a known person or project to provide context.",
        parameters: {
          type: "OBJECT",
          properties: {
            entryId: {type: "STRING", description: "Entry ID to find relations for (optional)"},
            topic: {type: "STRING", description: "Topic to find related entries for (optional)"},
            limit: {type: "NUMBER", description: "Max results (default 5)"},
          },
        },
      },
      {
        name: "prepareBriefing",
        description: "Synthesize a briefing about a person, project, or topic. Gathers all related entries, action items, and memories into a concise summary. Use when user says 'prepare me for my meeting with X', 'what's the status of Y', 'brief me on Z', 'catch me up on X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            subject: {type: "STRING", description: "Who/what to brief about"},
            type: {type: "STRING", enum: ["meeting_prep", "project_status", "person_summary", "topic_review"], description: "Type of briefing (optional)"},
            timeframe: {type: "STRING", description: "Time window, e.g. 'last week', 'last month' (optional)"},
          },
          required: ["subject"],
        },
      },
      {
        name: "getActivitySummary",
        description: "Get a summary of what the user has been working on. Use when user asks 'what was I working on', 'what happened last week', 'summary of my activity', 'what have I saved recently'.",
        parameters: {
          type: "OBJECT",
          properties: {
            timeframe: {type: "STRING", enum: ["today", "yesterday", "this_week", "last_week", "this_month"], description: "Time period"},
          },
          required: ["timeframe"],
        },
      },
      {
        name: "getUpcomingDeadlines",
        description: "Get upcoming deadlines and action items. Use when user asks 'what's due', 'any deadlines', 'what do I need to do', 'my tasks', 'what's pending'.",
        parameters: {
          type: "OBJECT",
          properties: {
            timeframe: {type: "STRING", enum: ["today", "tomorrow", "this_week", "next_week"], description: "Time window (default: this_week)"},
            status: {type: "STRING", enum: ["open", "in_progress", "all"], description: "Filter by status (default: open)"},
          },
        },
      },
      {
        name: "updateActionItem",
        description: "Update the status of an action item. Use when user says 'mark X as done', 'I completed X', 'I finished X', 'cancel the task about X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {type: "STRING", description: "Description of the action item to update"},
            status: {type: "STRING", enum: ["open", "in_progress", "completed", "cancelled"], description: "New status"},
          },
          required: ["query", "status"],
        },
      },
      {
        name: "setReminder",
        description: "Set a reminder for the user. Use when user says 'remind me to X', 'set a reminder for X', 'don't let me forget X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            text: {type: "STRING", description: "What to remind about"},
            when: {type: "STRING", description: "When to remind: 'tomorrow', 'in 2 hours', 'next Monday', 'Friday at 3pm'"},
            entryId: {type: "STRING", description: "Link to an entry (optional)"},
          },
          required: ["text", "when"],
        },
      },
      // ── Print ──────────────────────────────────────────────────────────────
      {
        name: "printEntry",
        description: "Print one or more entries. Use when user says 'print', 'print this entry', 'print my [title]', 'print entries in [category]'. Searches for the entry by title or category and opens the browser print dialog.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: {type: "STRING", description: "Entry title or partial title to find and print"},
            id: {type: "STRING", description: "Entry ID to print (if known)"},
            category: {type: "STRING", description: "Print all entries in this category"},
          },
        },
      },
    ],
  },
];

const buildVoiceAgentSystemPrompt = (
  displayName: string,
  memorySummary?: string | null,
  lastConversationSummary?: string | null,
  activePatterns?: string[] | null
) => `
You are Nova — the conversational AI built into SaveMe.Space, a personal knowledge vault.
You are talking to ${displayName}. Be warm, sharp, and concise.

## CRITICAL RULES
1. NEVER describe what you are going to do. ALWAYS call the tool immediately.
   Wrong: "Sure, I'll navigate to Books for you!"
   Right: [call navigateToCategory tool immediately, then say "Done — opening Books."]
2. ALWAYS match the user's VERB to the right tool. The verb IS the action:
   - "print" → printEntry (NEVER saveEntry)
   - "save" / "remember" / "note" → saveEntry
   - "create" / "new" / "add" → openEntryForm
   - "find" / "search" / "what did I save about" → searchEntries
   - "delete" / "remove" → deleteEntry
   - "edit" / "update" / "change" → updateEntry
   - "open" / "go to" / "show me" → navigateToCategory or navigateApp
3. If the user's request contains the word "print" anywhere, call printEntry. Do NOT create or save an entry.

## Tools — call them immediately, no hesitation
- "open", "go to", "show me", "take me to" a category → navigateToCategory
- "go to insights / settings / dashboard / brain dump" → navigateApp
- "save this", "remember this", "note that" → saveEntry
- "what did I save about X", "find X" → searchEntries
- "show recent", "what did I save lately" → getRecentEntries
- "create entry", "new entry", "add entry" → openEntryForm
- "open [title]", "view [title]" → searchEntries to find, then openEntry
- "close", "go back", "exit", "back" → closeEntry
- "scroll down", "scroll up", "go to top", "go to bottom", "show me more" → scrollPage
- "brain dump", "capture my thoughts" → startBrainDump
- "process", "structure this", "organize" → processBrainDump
- "print", "print this", "print my X", "print entries" → printEntry

## Greeting
If the user's message starts with "__nova_greet__:", extract the name after the colon and greet them warmly.
Example: "__nova_greet__:Victor" → "Hey Victor! Good to have you back. What do you want to save or find today?"
Keep it short, warm, natural. One sentence. No tools. Use their actual name.

## Category Intelligence — Nova auto-files entries
When you save an entry, the system auto-predicts the category using the user's history.
- ALWAYS confirm the category in your response: "Saved '[title]' under [Category]."
- If the entry result includes category_was_predicted: true, you predicted it — state it confidently: "Saved under [Category]."
- If user says "wrong category", "that should be X", "move it to X" → call updateEntry with corrected category IMMEDIATELY
- Never ask "what category should this go in?" — just predict and confirm. Let the user correct you if needed.

## saveEntry — content vs structured fields
Detect intent automatically:
- General note/reminder/idea → use 'content' field only
- Structured data (contact, finance, health, recipe, credential) → use 'fields' array with key-value pairs
Ask yourself: "Does this have named pieces of data?" If yes → fields. If it's just text → content.
Examples:
- "Remember my dentist is at 9am Friday" → content
- "Save David's number: 917-555-0192" → fields: [{key:"Phone",value:"917-555-0192"}], category: Contacts
- "Log my weight: 185 lbs" → fields: [{key:"Weight",value:"185 lbs"}], category: Health
- "Note: finish the proposal by EOD" → content, category: Work

## Settings
- User says "dark mode", "light mode", "switch theme" → call updateTheme NOW
- User says "change my name to X", "update my profile" → call updateProfile NOW
- User says "turn on/off [email/push/reminder/automation] notifications" → call toggleNotification NOW
- User says "change language to Spanish", "set speech rate to 1.5" → call updateVoiceSettings NOW
- User says "export my data", "download my entries", "backup" → call exportUserData NOW

## Agentic Intelligence — Proactive Context
You have access to a knowledge graph and entry connections. Use them proactively:
- When the user mentions a person or project by name, call getRelatedEntries BEFORE responding to gather context.
- When asked "prepare me for X", "brief me on X", "what's the status of X" → call prepareBriefing NOW.
- When asked "what was I working on", "my activity", "what did I do" → call getActivitySummary NOW.
- When asked "who's involved in X", "what do I know about X" → call getEntityGraph NOW.
- After saving an entry, if you know the topic has related entries, mention the connection naturally.
- Chain tools when needed. E.g., "prepare for meeting with James" → prepareBriefing("James", "meeting_prep").

## Temporal Intelligence — Deadlines & Reminders
- When asked "what's due", "my tasks", "what do I need to do" → call getUpcomingDeadlines NOW.
- When user says "I finished X", "mark X as done" → call updateActionItem NOW.
- When user says "remind me to X" → call setReminder NOW.
- When user mentions a deadline ("by Friday", "due next week"), save the entry normally — the system auto-extracts action items.

## Memory
You have persistent memory. You remember things about ${displayName} across conversations.
${memorySummary ? `
### What you know about ${displayName}:
${memorySummary}
` : `You don't know much about ${displayName} yet. Pay attention to personal details they share and use rememberFact to store them.`}
${lastConversationSummary ? `### Last conversation:\n${lastConversationSummary}\n` : ""}
### Memory rules:
- When the user shares personal info (names of family, preferences, habits, dates), call rememberFact silently.
- When the user says "remember that..." or "keep in mind...", call rememberFact.
- When you need context about the user to answer well, call recallMemories first.
- When the user corrects a fact ("actually it's X, not Y"), call rememberFact with the overrides field.
- When the user says "forget" something, call forgetMemory.
- Write memories in third person: "${displayName} prefers..." not "You prefer..."
- Do NOT tell the user you're storing a memory unless they explicitly asked you to. Just do it silently.
${activePatterns?.length ? `
### Learned Patterns (apply silently when relevant):
${activePatterns.join("\n")}
` : ""}
## After calling tools
Confirm briefly: "Done — opening Books." / "Got it, saved." / "Found 3 entries about that."
Keep responses short. This is voice — no lists, no markdown.
`.trim();

// ── Memory helpers ───────────────────────────────────────────────────────────

async function rebuildMemoryProfile(userId: string, db: admin.firestore.Firestore) {
  const memoriesRef = db.collection("nova_memories");
  const snap = await memoriesRef
    .where("user_id", "==", userId)
    .where("active", "==", true)
    .orderBy("confidence", "desc")
    .limit(20)
    .get();

  const facts: string[] = [];
  const patterns: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.type === "pattern") patterns.push(data.content);
    else facts.push(data.content);
  }

  const topFacts = facts.slice(0, 15);
  const topPatterns = patterns.slice(0, 5);
  const memorySummary = [
    ...topFacts.map((f) => `- ${f}`),
    ...(topPatterns.length ? ["\nPatterns:", ...topPatterns.map((p) => `- ${p}`)] : []),
  ].join("\n");

  await db.collection("nova_user_profile").doc(userId).set({
    user_id: userId,
    memory_summary: memorySummary || "",
    top_facts: topFacts,
    patterns: topPatterns,
    memory_count: snap.size,
    last_updated: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}

async function mirrorFactToSharedMemory(
  userId: string,
  fact: {content: string; category?: string},
  db: admin.firestore.Firestore
) {
  const existing = await db.collection("shared_memories")
    .where("user_id", "==", userId)
    .where("content", "==", fact.content)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!existing.empty) return;

  await createSharedMemory(userId, {
    title: fact.content.length > 80 ? `${fact.content.slice(0, 77)}...` : fact.content,
    content: fact.content,
    summary: fact.content,
    type: "fact",
    source: "system",
    sourceAgent: "nova",
    createdBy: "nova_memory_extraction",
    tags: fact.category ? [fact.category, "auto-memory"] : ["auto-memory"],
    project: "save-me",
    confidence: 0.75,
    verification: "agent_suggested",
    visibility: "shared_with_agents",
    metadata: {
      pipeline: "extractAndStoreMemories",
      category: fact.category || null,
    },
  }, db);
}

async function extractAndStoreMemories(
  userText: string,
  userId: string,
  db: admin.firestore.Firestore
) {
  // Skip very short inputs
  if (!userText || userText.trim().length < 10) return;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return;

  try {
    // Use Gemini to intelligently detect personal facts worth remembering
    const res = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: `Analyze this user statement and extract personal facts worth remembering long-term.

Statement: "${userText}"

Rules:
- Only extract DURABLE facts (names, preferences, habits, important dates, relationships, job info)
- Skip transient info (what they're doing right now, commands, questions)
- Write each fact in third person: "User's wife is Sarah" not "My wife is Sarah"
- Return JSON array: [{"content": "string", "category": "personal|health|finance|work|contacts|preferences|schedule"}]
- Return empty array [] if nothing worth remembering
- Be selective — only genuinely useful long-term facts`}]}],
        generationConfig: {maxOutputTokens: 256, temperature: 0.1, responseMimeType: "application/json"},
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let facts: ExtractedMemoryFact[];
    try {
      const parsed = JSON.parse(rawText);
      facts = Array.isArray(parsed)
        ? parsed.filter((fact): fact is ExtractedMemoryFact => Boolean(fact && typeof fact === "object" && typeof fact.content === "string"))
        : [];
    } catch {
      return;
    }

    if (!Array.isArray(facts) || facts.length === 0) return;

    const memoriesRef = db.collection("nova_memories");
    let memoryAdded = false;

    for (const fact of facts) {
      if (!fact.content) continue;

      // Check for duplicates
      const existing = await memoriesRef
        .where("user_id", "==", userId)
        .where("active", "==", true)
        .where("content", "==", fact.content)
        .limit(1)
        .get();

      if (existing.empty) {
        await memoriesRef.add({
          user_id: userId,
          type: "fact",
          content: fact.content,
          category: fact.category || null,
          source: "inferred",
          confidence: 0.75,
          access_count: 0,
          last_accessed: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          superseded_by: null,
          active: true,
        });

        try {
          await mirrorFactToSharedMemory(userId, fact, db);
        } catch (mirrorErr) {
          console.warn("[extractAndStoreMemories] Shared memory mirror failed:", mirrorErr);
        }

        memoryAdded = true;
      }
    }

    if (memoryAdded) {
      await rebuildMemoryProfile(userId, db);
    }
  } catch (err) {
    console.warn("[extractAndStoreMemories] AI extraction failed:", err);
  }
}

// ── Tool executor ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY INTELLIGENCE — Nova learns your categories over time
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Predict the best category for an entry based on user's history + learned patterns.
 * Returns { predicted, confidence } — confidence >= 0.7 means Nova is sure enough to auto-file.
 */
async function predictCategory(
  userId: string,
  title: string,
  content: string,
  db: admin.firestore.Firestore,
  geminiKey: string
): Promise<{predicted: string; confidence: number}> {
  try {
    // Fetch user's category history (last 60 entries)
    const entriesSnap = await db.collection("entries")
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(60)
      .get();

    if (entriesSnap.empty) return {predicted: "Personal", confidence: 0.5};

    // Build category frequency + examples map
    const categoryCounts: Record<string, number> = {};
    const categoryExamples: Record<string, string[]> = {};
    for (const d of entriesSnap.docs) {
      const data = d.data();
      const cat = (data.category || "Personal") as string;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (!categoryExamples[cat]) categoryExamples[cat] = [];
      if (categoryExamples[cat].length < 3 && data.title) {
        categoryExamples[cat].push(data.title as string);
      }
    }

    const categoryList = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => {
        const examples = (categoryExamples[cat] || []).join(", ");
        return `${cat} (${count} entries${examples ? `, e.g. "${examples}"` : ""})`;
      })
      .join("\n");

    // Fetch learned patterns from corrections/feedback
    const patternsSnap = await db.collection("user_category_patterns")
      .where("user_id", "==", userId)
      .orderBy("weight", "desc")
      .limit(30)
      .get();

    const learnedPatterns = patternsSnap.docs.map((d) => {
      const data = d.data();
      return `"${data.signal}" → ${data.category} (strength: ${Math.round((data.weight || 1) * 10) / 10})`;
    }).join("\n");

    const prompt = `You are Nova, predicting the best category for a personal knowledge vault entry.

User's existing categories:
${categoryList}
${learnedPatterns ? `\nLearned patterns from this user's corrections:\n${learnedPatterns}` : ""}

Entry to categorize:
Title: "${title}"
Content: "${(content || "").slice(0, 200)}"

Rules:
- Pick from the user's EXISTING categories whenever possible
- Only suggest a new category if no existing one fits at all
- Confidence 0.9+ = very obvious (e.g. "blood pressure" → Health)
- Confidence 0.7-0.89 = good fit with some reasoning
- Confidence < 0.7 = uncertain, do not auto-file

Return JSON only: {"category": "string", "confidence": 0.0}`;

    const res = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: prompt}]}],
        generationConfig: {
          maxOutputTokens: 64,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) return {predicted: "Personal", confidence: 0.5};

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText);
    return {
      predicted: (parsed.category as string) || "Personal",
      confidence: (parsed.confidence as number) || 0.5,
    };
  } catch (err) {
    console.warn("[predictCategory] Failed:", err);
    return {predicted: "Personal", confidence: 0.5};
  }
}

/**
 * Record a category correction/confirmation to strengthen Nova's learning model.
 * Call this when: (a) user corrects Nova's category prediction, or (b) Nova's prediction is confirmed.
 */
async function recordCategorySignal(
  userId: string,
  title: string,
  content: string,
  correctCategory: string,
  wasCorrection: boolean,
  db: admin.firestore.Firestore
): Promise<void> {
  try {
    // Extract signals from title + content (lowercased words, 3+ chars)
    const text = `${title} ${content || ""}`.toLowerCase();
    const signals = [...new Set(
      text.split(/\W+/).filter((w) => w.length >= 3 && w.length <= 20)
    )].slice(0, 15);

    const weight = wasCorrection ? 1.5 : 1.0; // corrections carry more weight

    const batch = db.batch();
    for (const signal of signals) {
      const docId = `${userId}_${signal}_${correctCategory}`.replace(/[^a-z0-9_]/g, "_");
      const ref = db.collection("user_category_patterns").doc(docId);
      batch.set(ref, {
        user_id: userId,
        signal,
        category: correctCategory,
        weight: admin.firestore.FieldValue.increment(weight),
        count: admin.firestore.FieldValue.increment(1),
        was_correction: wasCorrection,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    }
    await batch.commit();
  } catch (err) {
    console.warn("[recordCategorySignal] Failed:", err);
  }
}

import { ok, fail, novaAction } from "./voiceToolResults";
import { handleAppControlTool } from "./voiceTools/appControl";
import { handleSettingsTool } from "./voiceTools/settings";
import { handleMemoryTool } from "./voiceTools/memory";
import { handleIntelligenceTool } from "./voiceTools/intelligence";
import { summarizeToolArgs, validateToolArgs } from "./voiceToolValidation";

interface StructuredFieldInput {
  key: string;
  value: string;
}

interface EntrySearchRecord {
  id: string;
  title?: string;
  fields?: Record<string, unknown>;
}

interface ExtractedMemoryFact {
  content: string;
  category?: string;
}

interface ConversationPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface ConversationTurnRecord {
  role: string;
  parts: ConversationPart[];
}

interface ActionExecutionRecord {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

interface ExtractedEntityRecord {
  name?: string;
  type?: string;
  aliases?: string[];
}

interface ExtractedActionItemRecord {
  text?: string;
  priority?: string;
  due_date?: string;
  assignee?: string;
}

interface UserPatternRecord {
  description?: string;
  trigger_conditions?: string;
  suggested_action?: string;
  confidence?: number;
}

const isStructuredFieldInput = (value: unknown): value is StructuredFieldInput => {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).key === "string" &&
    typeof (value as Record<string, unknown>).value === "string",
  );
};

const toStructuredFieldInputs = (value: unknown): StructuredFieldInput[] => {
  return Array.isArray(value) ? value.filter(isStructuredFieldInput) : [];
};

const toEntrySearchRecord = (doc: admin.firestore.QueryDocumentSnapshot): EntrySearchRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : undefined,
    fields: data.fields && typeof data.fields === "object" ? data.fields as Record<string, unknown> : undefined,
  };
};

async function executeVoiceTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const db = admin.firestore();
  const entriesRef = db.collection("entries");

  const validation = validateToolArgs(toolName, args);
  if (!validation.valid) {
    console.warn(`[VoiceTool] Validation failed for ${toolName}`, {
      userId,
      args: summarizeToolArgs(args),
      error: validation.error,
    });
    return fail(validation.error || `Invalid arguments for ${toolName}`);
  }

  console.log(`[VoiceTool] Executing ${toolName}`, {
    userId,
    args: summarizeToolArgs(args),
  });

  // ── App control tools — return commands for the frontend to execute ────────
  const appControlResult = await handleAppControlTool(toolName, args, userId, entriesRef);
  if (appControlResult) {
    return appControlResult;
  }

  // ── Vault operations ───────────────────────────────────────────────────────
  switch (toolName) {
  case "saveEntry": {
    let fields: Record<string, string> = {};
    let field_definitions: Array<{ id: string; name: string; type: string }> = [];
    const structuredFields = toStructuredFieldInputs(args.fields);
    const title = typeof args.title === "string" ? args.title : "Untitled";
    const content = typeof args.content === "string" ? args.content : "";
    const requestedCategory = typeof args.category === "string" ? args.category : "";

    if (structuredFields.length > 0) {
      // Structured entry — build fields map + definitions from key-value pairs
      for (const f of structuredFields) {
        const id = f.key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        fields[id] = f.value;
        field_definitions.push({id, name: f.key, type: "text"});
      }
    } else {
      // General content entry
      fields = {content};
      field_definitions = [{id: "content", name: "Content", type: "textarea"}];
    }

    // ── Category Intelligence: predict if not explicitly provided ──────────
    let finalCategory: string = requestedCategory;
    let categoryWasPredicted = false;
    const geminiKey = process.env.GEMINI_API_KEY;

    if ((!finalCategory || finalCategory === "Personal") && geminiKey) {
      const contentForPrediction = content
        || structuredFields.map((f) => `${f.key}: ${f.value}`).join(", ");

      const prediction = await predictCategory(userId, title, contentForPrediction, db, geminiKey);

      if (prediction.confidence >= 0.7 && prediction.predicted !== "Personal") {
        finalCategory = prediction.predicted;
        categoryWasPredicted = true;
      } else if (!finalCategory) {
        finalCategory = prediction.predicted || "Personal";
      }
    }

    if (!finalCategory) finalCategory = "Personal";
    fields["category"] = finalCategory;

    const docRef = await entriesRef.add({
      title: args.title,
      fields,
      field_definitions,
      category: finalCategory,
      user_id: userId,
      processed: false,
      category_predicted: categoryWasPredicted,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record signal to strengthen future predictions
    if (geminiKey) {
      const contentText = content || structuredFields.map((f) => `${f.value}`).join(" ");
      recordCategorySignal(userId, title, contentText, finalCategory, false, db).catch(() => {});
    }

    const actionData = {
      id: docRef.id,
      title,
      category: finalCategory,
      content: content || null,
      fields: structuredFields.length ? structuredFields : null,
    };

    return novaAction("save_entry", actionData, {
      id: docRef.id,
      title,
      category: finalCategory,
      category_was_predicted: categoryWasPredicted,
    });
  }

  case "searchEntries": {
    const limit = typeof args.limit === "number" ? args.limit : 5;
    const snap = await entriesRef
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(50)
      .get();
    const q = String(args.query || "").toLowerCase();
    const results = snap.docs
      .map(toEntrySearchRecord)
      .filter((entry) =>
        (entry.title && entry.title.toLowerCase().includes(q)) ||
        (typeof entry.fields?.content === "string" && entry.fields.content.toLowerCase().includes(q)) ||
        (typeof entry.fields?.category === "string" && entry.fields.category.toLowerCase().includes(q))
      )
      .slice(0, limit)
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        content: typeof entry.fields?.content === "string" ? entry.fields.content : undefined,
        category: typeof entry.fields?.category === "string" ? entry.fields.category : undefined,
      }));
    const actionData = { query: args.query, results: results.slice(0, 5), count: results.length };
    return novaAction("search", actionData, { results, count: results.length });
  }

  case "getRecentEntries": {
    const limit = typeof args.limit === "number" ? args.limit : 5;
    let q = entriesRef.where("user_id", "==", userId).orderBy("updated_at", "desc").limit(limit);
    const categoryFilter = typeof args.category === "string" ? args.category : undefined;
    if (categoryFilter) {
      q = entriesRef
        .where("user_id", "==", userId)
        .where("fields.category", "==", categoryFilter)
        .orderBy("updated_at", "desc")
        .limit(limit);
    }
    const snap = await q.get();
    const results = snap.docs.map((d) => {
      const data = d.data();
      const docFields = data.fields && typeof data.fields === "object" ? data.fields as Record<string, unknown> : undefined;
      return {
        id: d.id,
        title: typeof data.title === "string" ? data.title : undefined,
        content: typeof docFields?.content === "string" ? docFields.content : undefined,
        category: typeof docFields?.category === "string" ? docFields.category : undefined,
      };
    });
    return ok({ results, count: results.length });
  }

  case "updateEntry": {
    const entryId = typeof args.id === "string" ? args.id : "";
    const title = typeof args.title === "string" ? args.title : undefined;
    const content = typeof args.content === "string" ? args.content : undefined;
    const category = typeof args.category === "string" ? args.category : undefined;

    const updateData: Record<string, unknown> = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (title) updateData.title = title;

    // Fetch existing entry to compare and merge
    const existingDoc = await entriesRef.doc(entryId).get();
    const existingData = existingDoc.data() || {};
    const currentFields = existingData.fields && typeof existingData.fields === "object"
      ? existingData.fields as Record<string, unknown>
      : {};

    if (content || category) {
      updateData.fields = {
        ...currentFields,
        ...(content ? {content} : {}),
        ...(category ? {category} : {}),
      };
    }

    // Category correction learning — if category changed, record it as a correction
    const oldCategory = typeof existingData.category === "string" ? existingData.category : undefined;
    if (category && oldCategory && category !== oldCategory) {
      updateData.category = category;
      updateData.category_predicted = false;

      const entryTitle = title || (typeof existingData.title === "string" ? existingData.title : "");
      const entryContent = content || (typeof currentFields.content === "string" ? currentFields.content : "");
      recordCategorySignal(userId, entryTitle, entryContent, category, true, db).catch(() => {});
    } else if (category && !oldCategory) {
      updateData.category = category;
    }

    await entriesRef.doc(entryId).update(updateData);
    const actionData = {
      id: entryId,
      title: title || null,
      category: category || null,
      content: content || null,
    };
    return novaAction("update_entry", actionData, { id: entryId });
  }

  case "deleteEntry": {
    const entryId = typeof args.id === "string" ? args.id : "";
    const delDoc = await entriesRef.doc(entryId).get();
    const delData = delDoc.data() || {};
    const delTitle = typeof delData.title === "string" ? delData.title : "Entry";
    await entriesRef.doc(entryId).delete();
    return novaAction("delete_entry", { id: entryId, title: delTitle }, { id: entryId, title: delTitle });
  }
  }

  // ── Settings operations ──────────────────────────────────────────────────
  const settingsResult = await handleSettingsTool(toolName, args, userId, db);
  if (settingsResult) {
    return settingsResult;
  }

  // ── Memory operations ──────────────────────────────────────────────────
  const memoryResult = await handleMemoryTool(toolName, args, userId, db, rebuildMemoryProfile);
  if (memoryResult) {
    return memoryResult;
  }

  // ── Agentic intelligence operations ───────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;

  const intelligenceResult = await handleIntelligenceTool(toolName, args, userId, db, entriesRef, {
    executeVoiceTool,
    fetchWithRetry,
    GEMINI_API,
    geminiKey,
  });
  if (intelligenceResult) {
    return intelligenceResult;
  }

  return fail(`Unknown tool: ${toolName}`);
}

// ── Voice Agent Function ──────────────────────────────────────────────────────
/**
 * Canonical Nova backend execution endpoint.
 *
 * Ownership boundary:
 * - accepts transcript/audio + session context
 * - executes tool calls
 * - returns conversational response, tool execution results, and optional canonical appCommand payloads
 *
 * Frontend contract:
 * - `actionsExecuted[*].result.success` is required
 * - `actionsExecuted[*].result.appCommand` is the only supported UI trigger channel
 * - `appCommands` is derived from tool results and consumed by useVoiceAgent
 */
export const voiceAgent = functions.runWith({ timeoutSeconds: 60, memory: "512MB", minInstances: 1 }).https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(500).json({error: "Gemini API key not configured"});
      return;
    }

    const {transcript, audioData, audioMimeType: inputAudioMimeType, conversationHistory: clientHistory = [], sessionId: incomingSessionId, debugToolOverride} = req.body;
    if (!transcript?.trim() && !audioData) {
      res.status(400).json({error: "Transcript or audio data is required"});
      return;
    }

    const db = admin.firestore();
    const displayName = user.name || user.email?.split("@")[0] || "there";

    // Load conversation from session if client didn't send history (e.g. page refresh)
    let conversationHistory = clientHistory;
    let currentSessionId: string | null = incomingSessionId || null;
    if (currentSessionId && (!conversationHistory || conversationHistory.length === 0)) {
      try {
        const sessionDoc = await db.collection("nova_conversations").doc(currentSessionId).get();
        if (sessionDoc.exists && sessionDoc.data()?.user_id === user.uid) {
          conversationHistory = sessionDoc.data()?.turns || [];
          console.log(`[VoiceAgent] Restored ${conversationHistory.length} turns from session ${currentSessionId}`);
        }
      } catch (sessionErr) {
        console.warn("[VoiceAgent] Could not load session:", sessionErr);
      }
    }

    // Load Nova's memory profile for this user (single Firestore read)
    let memorySummary: string | null = null;
    let lastConversationSummary: string | null = null;
    try {
      const profileDoc = await db.collection("nova_user_profile").doc(user.uid).get();
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        memorySummary = profileData?.memory_summary || null;
        lastConversationSummary = profileData?.last_conversation_summary || null;
      }
    } catch (profileErr) {
      console.warn("[VoiceAgent] Could not load memory profile:", profileErr);
    }

    try {
      let userText: string = transcript?.trim() || "";

      // ── Transcribe audio if no text transcript provided ──────────────────
      // Note: For audio transcription in BrainDump, use the dedicated transcribeAudio function instead

      // Build user message parts — audio or text
      const userParts: ConversationPart[] = audioData
        ? [{inlineData: {mimeType: inputAudioMimeType || "audio/webm", data: audioData}}]
        : [{text: userText}];

      // Cap history to last 10 turns to prevent large payloads
      const cappedHistory = conversationHistory.slice(-10);

      // Build contents array from history + new user message
      const contents: ConversationTurnRecord[] = [
        ...cappedHistory,
        {role: "user", parts: userParts},
      ];

      let responseText = "";
      const actionsExecuted: ActionExecutionRecord[] = [];

      // ── Explicit authenticated tool path for briefing/client integrations ──
      const ALLOWED_DIRECT_TOOLS = new Set([
        "prepareBriefing",
        "getActivitySummary",
        "getUpcomingDeadlines",
        "getRelatedEntries",
      ]);

      if (
        debugToolOverride?.tool &&
        typeof debugToolOverride.tool === "string" &&
        ALLOWED_DIRECT_TOOLS.has(debugToolOverride.tool)
      ) {
        const directStartedAt = Date.now();
        const directResult = await executeVoiceTool(
          debugToolOverride.tool,
          debugToolOverride.args || {},
          user.uid
        );
        console.log("[VoiceAgent] Direct tool completed", {
          tool: debugToolOverride.tool,
          success: directResult?.success,
          latencyMs: Date.now() - directStartedAt,
          args: summarizeToolArgs(debugToolOverride.args || {}),
        });
        actionsExecuted.push({
          tool: debugToolOverride.tool,
          args: debugToolOverride.args || {},
          result: directResult,
        });
        const directData = directResult.data && typeof directResult.data === "object"
          ? directResult.data as Record<string, unknown>
          : {};
        responseText =
          (typeof directData.briefing === "string" ? directData.briefing : undefined) ||
          (typeof directData.message === "string" ? directData.message : undefined) ||
          (typeof directResult.message === "string" ? directResult.message : undefined) ||
          `Completed ${debugToolOverride.tool}.`;

        const cleanHistory = [
          ...cappedHistory,
          {role: "user", parts: [{text: transcript?.trim() || `[direct tool] ${debugToolOverride.tool}`}]},
          {role: "model", parts: [{text: responseText}]},
        ];

        try {
          const sessionTurns = cleanHistory.slice(-10);
          const sessionActions = actionsExecuted.map((action) => ({
            tool: action.tool,
            args: action.args,
            result_summary: action.result?.success ? "success" : "failed",
            timestamp: Date.now(),
          }));

          if (currentSessionId) {
            const updateData: Record<string, unknown> = {
              turns: sessionTurns,
              turn_count: sessionTurns.length,
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (sessionActions.length > 0) {
              updateData.actions = admin.firestore.FieldValue.arrayUnion(...sessionActions);
            }
            await db.collection("nova_conversations").doc(currentSessionId).update(updateData);
          } else {
            const sessionDoc = await db.collection("nova_conversations").add({
              user_id: user.uid,
              turns: sessionTurns,
              turn_count: sessionTurns.length,
              actions: sessionActions,
              active: true,
              started_at: admin.firestore.FieldValue.serverTimestamp(),
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
              ended_at: null,
              summary: null,
            });
            currentSessionId = sessionDoc.id;
          }
        } catch (sessionErr) {
          console.warn("[VoiceAgent] Could not save direct-tool session:", sessionErr);
        }

        res.json({
          transcript: transcript?.trim() || "",
          responseText,
          audioContent: null,
          audioMimeType: null,
          actionsExecuted,
          conversationHistory: cleanHistory,
          appCommands: actionsExecuted.map((a) => a.result).filter((result) => result?.success && result?.appCommand),
          sessionId: currentSessionId,
        });
        return;
      }

      // ── Load active user patterns for agentic behavior ───────────────────
      let activePatterns: string[] = [];
      try {
        const patternsSnap = await db.collection("user_patterns")
          .where("user_id", "==", user.uid)
          .where("active", "==", true)
          .where("confidence", ">=", 0.7)
          .orderBy("confidence", "desc")
          .limit(5)
          .get();
        activePatterns = patternsSnap.docs.map((d) => `- ${d.data().description}: ${d.data().suggested_action}`);
      } catch (pErr: unknown) {
        console.warn("[VoiceAgent] Patterns query skipped:", pErr instanceof Error ? pErr.message : pErr);
      }

      // ── Gemini function calling loop (max 6 iterations for agentic chaining) ──
      let keepLooping = true;
      let loopCount = 0;
      while (keepLooping && loopCount < 6) {
        loopCount++;
        const geminiRes = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            systemInstruction: {parts: [{text: buildVoiceAgentSystemPrompt(displayName, memorySummary, lastConversationSummary, activePatterns)}]},
            tools: VOICE_AGENT_TOOLS,
            toolConfig: {functionCallingConfig: {mode: "AUTO"}},
            contents,
            generationConfig: {maxOutputTokens: 512, temperature: 0.5},
          }),
        });

        if (!geminiRes.ok) {
          const err = await geminiRes.text();
          throw new Error(`Gemini error: ${err}`);
        }

        const geminiData = await geminiRes.json();
        const candidate = geminiData.candidates?.[0];

        // Gracefully handle blocked/empty responses instead of throwing
        if (!candidate || !candidate.content) {
          const blockReason = geminiData.promptFeedback?.blockReason || candidate?.finishReason || "unknown";
          console.warn("[VoiceAgent] Gemini returned no content, reason:", blockReason);
          responseText = "Sorry, I couldn't process that. Could you try again?";
          keepLooping = false;
          break;
        }

        const parts = candidate.content?.parts || [];
        const hasFunctionCall = parts.some((part: ConversationPart) => part.functionCall);

        if (hasFunctionCall) {
          // Add model's function call turn to history
          contents.push({role: "model", parts});

          // Execute all tool calls
          const functionResponses: ConversationPart[] = [];
          for (const part of parts) {
            if (!part.functionCall) continue;
            const {name, args} = part.functionCall;
            console.log(`[VoiceAgent] Tool: ${name}`, args);
            let result: Record<string, unknown>;
            const toolStartedAt = Date.now();
            try {
              result = await executeVoiceTool(name, args, user.uid);
              console.log("[VoiceAgent] Tool completed", {
                tool: name,
                success: result?.success,
                appCommand: result?.appCommand || null,
                latencyMs: Date.now() - toolStartedAt,
                args: summarizeToolArgs(args || {}),
              });
            } catch (toolErr: unknown) {
              const toolMessage = toolErr instanceof Error ? toolErr.message : String(toolErr);
              console.error(`[VoiceAgent] Tool ${name} failed:`, toolMessage);
              result = fail(`Tool ${name} failed: ${toolMessage || "unknown error"}`);
            }
            actionsExecuted.push({tool: name, args, result});
            functionResponses.push({
              functionResponse: {name, response: result},
            });
          }

          // Add tool results back into contents
          contents.push({role: "user", parts: functionResponses});
        } else {
          // Final text response
          responseText = parts
            .filter((part: ConversationPart) => part.text)
            .map((part: ConversationPart) => part.text)
            .join("");
          contents.push({role: "model", parts: [{text: responseText}]});
          keepLooping = false;
        }
      }

      // ── Auto-extract memories from user input (fire-and-forget) ────────────
      if (userText) {
        extractAndStoreMemories(userText, user.uid, db).catch((err) => {
          console.warn("[VoiceAgent] Memory extraction failed:", err);
        });
      }

      // ── TTS — Gemini TTS (Kore voice) ────────────────────────────────────────
      let audioContent: string | null = null;
      let audioMimeType = "audio/mpeg";
      if (responseText) {
        try {
          const ttsRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                contents: [{parts: [{text: responseText}]}],
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: "Kore"}}},
                },
              }),
            }
          );
          if (ttsRes.ok) {
            const ttsData = await ttsRes.json();
            const inlineData = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (inlineData?.data) {
              audioContent = inlineData.data;
              audioMimeType = inlineData.mimeType || "audio/pcm";
              console.log("[VoiceAgent] Gemini TTS success, mimeType:", audioMimeType);
            } else {
              console.warn("[VoiceAgent] Gemini TTS: no audio data in response");
            }
          } else {
            const errText = await ttsRes.text();
            console.warn("[VoiceAgent] Gemini TTS error:", ttsRes.status, errText);
          }
        } catch (ttsErr) {
          console.warn("[VoiceAgent] Gemini TTS exception:", ttsErr);
        }
      }

      // Separate canonical app commands from broader tool results.
      const appCommands = actionsExecuted
        .map((a) => a.result)
        .filter((result) => result?.success && result?.appCommand);

      // Replace audio parts in history with text placeholder (audio can't be stored in history)
      const cleanHistory = contents.map((turn: ConversationTurnRecord) => ({
        ...turn,
        parts: turn.parts.map((part: ConversationPart) =>
          part.inlineData ? {text: "[voice message]"} : part
        ),
      }));

      // ── Save conversation session ──────────────────────────────────────────
      try {
        const sessionTurns = cleanHistory.slice(-10);
        const sessionActions = actionsExecuted.map((action) => ({
          tool: action.tool,
          args: action.args,
          result_summary: action.result?.success ? "success" : "failed",
          timestamp: Date.now(),
        }));

        if (currentSessionId) {
          const updateData: Record<string, unknown> = {
            turns: sessionTurns,
            turn_count: sessionTurns.length,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          };
          if (sessionActions.length > 0) {
            updateData.actions = admin.firestore.FieldValue.arrayUnion(...sessionActions);
          }
          await db.collection("nova_conversations").doc(currentSessionId).update(updateData);
        } else {
          const sessionDoc = await db.collection("nova_conversations").add({
            user_id: user.uid,
            turns: sessionTurns,
            turn_count: sessionTurns.length,
            actions: sessionActions,
            active: true,
            started_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            ended_at: null,
            summary: null,
          });
          currentSessionId = sessionDoc.id;
        }
      } catch (sessionErr) {
        console.warn("[VoiceAgent] Could not save session:", sessionErr);
      }

      res.json({
        transcript: userText,
        responseText,
        audioContent,
        audioMimeType,
        actionsExecuted,
        appCommands,
        conversationHistory: cleanHistory,
        sessionId: currentSessionId,
      });
    } catch (error: unknown) {
      console.error("[VoiceAgent] Error:", error);
      res.status(500).json({error: "Voice agent failed", detail: error instanceof Error ? error.message : String(error)});
    }
  })
);

// ─────────────────────────────────────────────────────────────────────────────

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
    const openaiKey = process.env.OPENAI_API_KEY;
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

// ─────────────────────────────────────────────────────────────────────────────
// ── AGENTIC INTELLIGENCE LAYER ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are an entity and relationship extraction engine for a personal knowledge vault.
Given an entry's title and content, extract structured information.

Return a JSON object with:
{
  "entities": [{"name": "string", "type": "person|project|organization|topic|location|event", "aliases": ["string"]}],
  "tags": ["string"],  // 3-7 topical tags
  "action_items": [{"text": "string", "priority": "high|medium|low", "due_date": "string or null", "assignee": "string or null"}],
  "summary": "one sentence summary",
  "category_suggestion": "string"
}

Rules:
- Extract REAL entities only — names of people, projects, companies, places, events mentioned.
- Tags should be topical keywords, not entity names.
- Action items are things that need to be DONE — look for "need to", "must", "should", "have to", "by Friday", deadlines.
- Due dates should be relative descriptions like "Friday", "next week", "end of month".
- If no entities/action items found, return empty arrays.
- Always return valid JSON.`;

/**
 * Deep Entry Processing — Firestore Trigger
 * Fires when any entry is created or updated.
 * Enriches the entry with entities, tags, action items, summary, and cross-links.
 */
export const processEntryDeep = functions.firestore
  .document("entries/{entryId}")
  .onWrite(async (change, context) => {
    const entryId = context.params.entryId;
    const entry = change.after.exists ? change.after.data() : null;

    // Skip if deleted, already processed, or no data
    if (!entry || entry.processed === true) return;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("[processEntryDeep] No GEMINI_API_KEY — skipping");
      return;
    }

    const db = admin.firestore();
    const userId = entry.user_id;
    if (!userId) return;

    try {
      // Build content string from entry
      const contentParts: string[] = [entry.title || ""];
      if (entry.fields) {
        for (const [key, value] of Object.entries(entry.fields)) {
          if (typeof value === "string" && value.trim()) {
            contentParts.push(`${key}: ${value}`);
          }
        }
      }
      const fullContent = contentParts.join("\n");

      if (fullContent.trim().length < 10) {
        // Too short to process meaningfully
        await change.after.ref.update({processed: true});
        return;
      }

      // Call Gemini for extraction
      const geminiRes = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          systemInstruction: {parts: [{text: EXTRACTION_SYSTEM_PROMPT}]},
          contents: [{role: "user", parts: [{text: `Entry title: "${entry.title}"\n\nContent:\n${fullContent}`}]}],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        console.error("[processEntryDeep] Gemini error:", await geminiRes.text());
        return;
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      let extracted: Record<string, unknown>;
      try {
        const parsed = JSON.parse(rawText);
        extracted = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
      } catch {
        console.warn("[processEntryDeep] Failed to parse Gemini JSON:", rawText.substring(0, 200));
        await change.after.ref.update({processed: true});
        return;
      }

      const entities: ExtractedEntityRecord[] = Array.isArray(extracted.entities)
        ? extracted.entities as ExtractedEntityRecord[]
        : [];
      const tags: string[] = Array.isArray(extracted.tags)
        ? extracted.tags.filter((tag): tag is string => typeof tag === "string")
        : [];
      const actionItems: ExtractedActionItemRecord[] = Array.isArray(extracted.action_items)
        ? extracted.action_items as ExtractedActionItemRecord[]
        : [];
      const summary = typeof extracted.summary === "string" ? extracted.summary : "";

      // ── Upsert entities into entity_graph ─────────────────────────────────
      const entityIds: string[] = [];

      for (const entity of entities) {
        if (!entity.name) continue;
        const entityName = entity.name.trim();
        const entityType = entity.type || "topic";

        // Check if entity already exists
        const existingSnap = await db.collection("entity_graph")
          .where("user_id", "==", userId)
          .where("name", "==", entityName)
          .limit(1)
          .get();

        let entityId: string;
        if (existingSnap.empty) {
          const newEntity = await db.collection("entity_graph").add({
            user_id: userId,
            name: entityName,
            type: entityType,
            aliases: entity.aliases || [],
            metadata: {},
            mention_count: 1,
            last_mentioned: admin.firestore.FieldValue.serverTimestamp(),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          entityId = newEntity.id;
        } else {
          entityId = existingSnap.docs[0].id;
          await existingSnap.docs[0].ref.update({
            mention_count: admin.firestore.FieldValue.increment(1),
            last_mentioned: admin.firestore.FieldValue.serverTimestamp(),
            aliases: admin.firestore.FieldValue.arrayUnion(...(entity.aliases || [])),
          });
        }

        entityIds.push(entityId);

        // Create junction record
        await db.collection("entry_entities").add({
          user_id: userId,
          entry_id: entryId,
          entity_id: entityId,
          entity_name: entityName,
          entity_type: entityType,
          context_snippet: fullContent.substring(0, 200),
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // ── Find related entries by shared entities ───────────────────────────
      const linkedEntryIds: Set<string> = new Set();

      for (const entityId of entityIds) {
        const relatedSnap = await db.collection("entry_entities")
          .where("user_id", "==", userId)
          .where("entity_id", "==", entityId)
          .limit(20)
          .get();

        for (const d of relatedSnap.docs) {
          const relEntryId = d.data().entry_id;
          if (relEntryId !== entryId) {
            linkedEntryIds.add(relEntryId);
          }
        }
      }

      // Create entry_links for related entries
      for (const targetId of Array.from(linkedEntryIds).slice(0, 10)) {
        // Check if link already exists
        const existingLink = await db.collection("entry_links")
          .where("user_id", "==", userId)
          .where("source_entry_id", "==", entryId)
          .where("target_entry_id", "==", targetId)
          .limit(1)
          .get();

        if (existingLink.empty) {
          // Count shared entities for strength
          const sharedEntities = await db.collection("entry_entities")
            .where("user_id", "==", userId)
            .where("entry_id", "==", targetId)
            .get();
          const targetEntityIds = sharedEntities.docs.map((d) => d.data().entity_id);
          const shared = entityIds.filter((id) => targetEntityIds.includes(id));
          const strength = Math.min(shared.length / Math.max(entityIds.length, 1), 1.0);

          await db.collection("entry_links").add({
            user_id: userId,
            source_entry_id: entryId,
            target_entry_id: targetId,
            link_type: "related",
            strength,
            reason: `Shared entities: ${shared.length}`,
            auto_generated: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // ── Write action items to dedicated collection ────────────────────────
      for (const item of actionItems) {
        if (!item.text) continue;

        let dueDate: admin.firestore.Timestamp | null = null;
        if (item.due_date) {
          const parsed = parseFuzzyDate(item.due_date);
          if (parsed) dueDate = admin.firestore.Timestamp.fromDate(parsed);
        }

        await db.collection("action_items").add({
          user_id: userId,
          entry_id: entryId,
          text: item.text,
          priority: item.priority || "medium",
          status: "open",
          due_date: dueDate,
          assignee: item.assignee || null,
          completed_at: null,
          follow_up_date: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // ── Update the entry with enrichment data ─────────────────────────────
      await change.after.ref.update({
        tags,
        action_items: actionItems,
        entities: entityIds,
        linked_entries: Array.from(linkedEntryIds).slice(0, 10),
        summary,
        processed: true,
      });

      console.log(`[processEntryDeep] Enriched entry ${entryId}: ${entities.length} entities, ${tags.length} tags, ${actionItems.length} action items, ${linkedEntryIds.size} links`);
    } catch (error) {
      console.error("[processEntryDeep] Error:", error);
      // Mark as processed to avoid infinite retries
      try {
        await change.after.ref.update({processed: true});
      } catch { /* ignore */ }
    }
  });

/**
 * Parse fuzzy date strings like "Friday", "next week", "end of month" into Date objects.
 */
function parseFuzzyDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase().trim();
  const now = new Date();

  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  // Day of week
  for (const [day, num] of Object.entries(dayMap)) {
    if (lower.includes(day)) {
      const daysAhead = (num - now.getDay() + 7) % 7 || 7;
      const result = new Date(now);
      result.setDate(result.getDate() + daysAhead);
      result.setHours(17, 0, 0, 0); // Default EOD
      return result;
    }
  }

  if (lower.includes("tomorrow")) {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    result.setHours(17, 0, 0, 0);
    return result;
  }
  if (lower.includes("today") || lower.includes("eod") || lower.includes("end of day")) {
    const result = new Date(now);
    result.setHours(17, 0, 0, 0);
    return result;
  }
  if (lower.includes("next week")) {
    const result = new Date(now);
    result.setDate(result.getDate() + 7);
    result.setHours(17, 0, 0, 0);
    return result;
  }
  if (lower.includes("end of month") || lower.includes("eom")) {
    const result = new Date(now.getFullYear(), now.getMonth() + 1, 0, 17, 0, 0);
    return result;
  }
  if (lower.includes("end of week") || lower.includes("eow")) {
    const daysToFri = (5 - now.getDay() + 7) % 7 || 7;
    const result = new Date(now);
    result.setDate(result.getDate() + daysToFri);
    result.setHours(17, 0, 0, 0);
    return result;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check Reminders — Scheduled Function
 * Runs every 15 minutes. Finds due reminders and writes notifications.
 */
export const checkReminders = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      const dueReminders = await db.collection("reminders")
        .where("status", "==", "pending")
        .where("trigger_at", "<=", now)
        .limit(50)
        .get();

      if (dueReminders.empty) return;

      const batch = db.batch();
      for (const doc of dueReminders.docs) {
        const reminder = doc.data();

        // Create notification for the user
        const notifRef = db.collection("pending_notifications").doc();
        batch.set(notifRef, {
          user_id: reminder.user_id,
          type: "reminder",
          text: reminder.text,
          entry_id: reminder.entry_id || null,
          reminder_id: doc.id,
          status: "pending",
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark reminder as sent
        batch.update(doc.ref, {status: "sent"});
      }

      await batch.commit();
      console.log(`[checkReminders] Processed ${dueReminders.size} due reminders`);
    } catch (error) {
      console.error("[checkReminders] Error:", error);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze Patterns — Scheduled Function
 * Runs daily. Detects behavioral patterns from recent entries.
 */
export const analyzePatterns = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const db = admin.firestore();
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("[analyzePatterns] No GEMINI_API_KEY");
      return;
    }

    try {
      // Get users who have entries
      const recentEntries = await db.collection("entries")
        .where("created_at", ">=", admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 86400000)))
        .orderBy("created_at", "desc")
        .limit(500)
        .get();

      // Group by user
      const userEntries: Record<string, Array<{title?: unknown; category?: unknown; tags?: unknown; created_at?: unknown}>> = {};
      for (const doc of recentEntries.docs) {
        const data = doc.data();
        const uid = data.user_id;
        if (!userEntries[uid]) userEntries[uid] = [];
        if (userEntries[uid].length < 50) {
          userEntries[uid].push({title: data.title, category: data.category || data.fields?.category, tags: data.tags, created_at: data.created_at});
        }
      }

      for (const [userId, entries] of Object.entries(userEntries)) {
        if (entries.length < 5) continue; // Need minimum data

        const analysisPrompt = `Analyze these ${entries.length} entries from the last 30 days and detect behavioral patterns.

Entries:
${entries.map((entry) => `- "${entry.title}" [${entry.category || "uncategorized"}] tags: ${Array.isArray(entry.tags) ? entry.tags.join(", ") || "none" : "none"}`).join("\n")}

Detect patterns like:
- Category preferences (e.g., "80% of entries about meetings are categorized as Work")
- Tagging habits (e.g., "User always tags health entries with specific keywords")
- Time patterns (e.g., "Most entries created in the morning")
- Content patterns (e.g., "User frequently saves contact information")

Return JSON array of patterns:
[{"description": "string", "trigger_conditions": "string", "suggested_action": "string", "confidence": 0.0-1.0}]

Only include patterns with confidence >= 0.6. Return empty array if no clear patterns.`;

        const res = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            contents: [{role: "user", parts: [{text: analysisPrompt}]}],
            generationConfig: {maxOutputTokens: 512, temperature: 0.2, responseMimeType: "application/json"},
          }),
        });

        if (!res.ok) continue;
        const resData = await res.json();
        const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        let patterns: UserPatternRecord[];
        try {
          const parsed = JSON.parse(rawText);
          patterns = Array.isArray(parsed) ? parsed.filter((pattern): pattern is UserPatternRecord => Boolean(pattern && typeof pattern === "object")) : [];
        } catch {
          continue;
        }

        if (!Array.isArray(patterns)) continue;

        for (const pattern of patterns) {
          const confidence = typeof pattern.confidence === "number" ? pattern.confidence : 0;
          if (!pattern.description || confidence < 0.6) continue;

          // Check if this pattern already exists
          const existingSnap = await db.collection("user_patterns")
            .where("user_id", "==", userId)
            .where("description", "==", pattern.description)
            .limit(1)
            .get();

          if (existingSnap.empty) {
            await db.collection("user_patterns").add({
              user_id: userId,
              pattern_type: "behavioral",
              description: pattern.description,
              trigger_conditions: pattern.trigger_conditions || "",
              suggested_action: pattern.suggested_action || "",
              confidence,
              occurrence_count: 1,
              last_occurred: admin.firestore.FieldValue.serverTimestamp(),
              active: confidence >= 0.7,
              created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Update confidence and occurrence count
            await existingSnap.docs[0].ref.update({
              confidence: Math.min(confidence + 0.05, 1.0),
              occurrence_count: admin.firestore.FieldValue.increment(1),
              last_occurred: admin.firestore.FieldValue.serverTimestamp(),
              active: true,
            });
          }
        }

        console.log(`[analyzePatterns] User ${userId}: detected ${patterns.length} patterns from ${entries.length} entries`);
      }
    } catch (error) {
      console.error("[analyzePatterns] Error:", error);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SAVE — Lightweight endpoint for browser extension capture
// No TTS, no voice processing — just save + predict category + return fast
// ─────────────────────────────────────────────────────────────────────────────

export const quickSave = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) { res.status(401).json({error: "Unauthorized"}); return; }
    if (req.method !== "POST") { res.status(405).json({error: "Method not allowed"}); return; }

    const {title, content, url, pageTitle, dryRun} = req.body;
    if (!title && !content && !pageTitle) {
      res.status(400).json({error: "title, content, or pageTitle required"});
      return;
    }

    const db = admin.firestore();
    const geminiKey = process.env.GEMINI_API_KEY;

    const finalTitle = (title || pageTitle || "Saved from web").slice(0, 200);
    const finalContent = (content || "").slice(0, 5000);
    const sourceUrl = url || null;

    // Category prediction using the same intelligence as Nova
    let category = "Personal";
    let categoryPredicted = false;
    let categoryConfidence = 0;

    if (geminiKey) {
      try {
        const prediction = await predictCategory(user.uid, finalTitle, finalContent, db, geminiKey);
        if (prediction.confidence >= 0.7) {
          category = prediction.predicted;
          categoryPredicted = true;
          categoryConfidence = prediction.confidence;
        }
      } catch (err) {
        console.warn("[quickSave] Category prediction failed:", err);
      }
    }

    // Dry run — just return the prediction, don't save
    if (dryRun) {
      res.json({success: true, category, categoryPredicted, categoryConfidence, dryRun: true});
      return;
    }

    // Build field definitions
    const fields: Record<string, string> = {content: finalContent, category};
    const field_definitions: Array<{id: string; name: string; type: string}> = [{id: "content", name: "Content", type: "textarea"}];
    if (sourceUrl) {
      fields.url = sourceUrl;
      field_definitions.push({id: "url", name: "Source URL", type: "text"});
    }

    const docRef = await db.collection("entries").add({
      title: finalTitle,
      fields,
      field_definitions,
      category,
      user_id: user.uid,
      processed: false,
      source: "browser_extension",
      category_predicted: categoryPredicted,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record signal for category learning
    if (geminiKey) {
      recordCategorySignal(user.uid, finalTitle, finalContent, category, false, db).catch(() => {});
    }

    res.json({
      success: true,
      id: docRef.id,
      title: finalTitle,
      category,
      categoryPredicted,
      categoryConfidence: Math.round(categoryConfidence * 100),
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// NOVA INSIGHTS — Proactive daily intelligence
// Runs every 24 hours, analyzes each active user's entries,
// and surfaces patterns/connections/gaps as in-app notifications.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_FLASH_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateUserInsights(
  userId: string,
  db: admin.firestore.Firestore,
  geminiKey: string
): Promise<void> {
  // Idempotent: skip if insights already generated for this user today
  const today = new Date().toISOString().split("T")[0];
  const existingToday = await db.collection("pending_notifications")
    .where("user_id", "==", userId)
    .where("insight_date", "==", today)
    .where("type", "==", "nova_insight")
    .limit(1)
    .get();

  if (!existingToday.empty) {
    console.log(`[novaInsights] Already ran for user ${userId} today — skipping`);
    return;
  }

  // Fetch last 7 days of entries
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const entriesSnap = await db.collection("entries")
    .where("user_id", "==", userId)
    .where("created_at", ">=", cutoff)
    .orderBy("created_at", "desc")
    .limit(30)
    .get();

  if (entriesSnap.empty) return;

  const entries = entriesSnap.docs.map((d) => {
    const data = d.data();
    const fields = data.fields || {};
    const content = fields.content
      || Object.values(fields).filter((v) => typeof v === "string").join(" ").slice(0, 200);
    return {
      id: d.id,
      title: data.title || "Untitled",
      category: data.category || "Personal",
      content: (content as string).slice(0, 150),
      createdAt: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  // Category breakdown (all-time, for context)
  const allEntriesSnap = await db.collection("entries")
    .where("user_id", "==", userId)
    .select("category")
    .get();

  const categoryCounts: Record<string, number> = {};
  allEntriesSnap.docs.forEach((d) => {
    const cat = d.data().category || "Personal";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryBreakdown = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([c, n]) => `${c} (${n})`)
    .join(", ");

  const prompt = `You are Nova — an intelligent personal knowledge assistant inside SaveMe.Space.

A user saved ${entries.length} entries in the last 7 days. Analyze them and generate 2–3 proactive, hyper-personalized insights.

Recent entries:
${entries.map((e) => `- [${e.id.slice(0, 8)}] "${e.title}" (${e.category}) — ${e.content}`).join("\n")}

Their full knowledge base: ${categoryBreakdown}

Generate insights that do ONE of these:
1. Surface a connection between 2+ entries they haven't noticed
2. Highlight a clear pattern in their thinking this week
3. Note a gap — something they started but haven't followed up on
4. Surface an unresolved thread worth revisiting

Rules:
- Use their ACTUAL entry titles (quoted)
- Be specific, not generic
- Max 120 characters each
- Sound like a brilliant friend paying close attention

Return JSON only:
[{
  "text": "Insight text (max 120 chars)",
  "type": "connection" | "pattern" | "gap" | "reminder",
  "entry_ids": ["short_id1", "short_id2"]
}]`;

  const res = await fetchWithRetry(`${GEMINI_FLASH_API}?key=${geminiKey}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{role: "user", parts: [{text: prompt}]}],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.75,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[novaInsights] Gemini error for user ${userId}: ${res.status} — ${errText}`);
    return;
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  let insights: {text: string; type: string; entry_ids?: string[]}[];
  try {
    insights = JSON.parse(rawText);
  } catch {
    console.warn(`[novaInsights] Failed to parse Gemini response for user ${userId}:`, rawText);
    return;
  }

  if (!Array.isArray(insights) || insights.length === 0) return;

  // Write insights to pending_notifications (max 3)
  const batch = db.batch();
  let written = 0;
  for (const insight of insights.slice(0, 3)) {
    if (!insight.text || insight.text.length < 10) continue;
    const notifRef = db.collection("pending_notifications").doc();
    batch.set(notifRef, {
      user_id: userId,
      type: "nova_insight",
      text: insight.text,
      insight_type: insight.type || "pattern",
      entry_ids: insight.entry_ids || [],
      status: "pending",
      insight_date: today,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    written++;
  }

  await batch.commit();
  console.log(`[novaInsights] Wrote ${written} insights for user ${userId}`);
}

export const novaInsights = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("America/New_York")
  .onRun(async () => {
    const db = admin.firestore();
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("[novaInsights] GEMINI_API_KEY not configured");
      return null;
    }

    // Find active users: any user with entries touched in last 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const recentSnap = await db.collection("entries")
      .where("updated_at", ">=", cutoff)
      .select("user_id")
      .get();

    const userIds = [...new Set(recentSnap.docs.map((d) => d.data().user_id as string))].filter(Boolean);
    console.log(`[novaInsights] Processing ${userIds.length} active users`);

    for (const userId of userIds) {
      try {
        await generateUserInsights(userId, db, geminiKey);
      } catch (err) {
        console.error(`[novaInsights] Failed for user ${userId}:`, err);
      }
    }

    return null;
  });
