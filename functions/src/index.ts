import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import {GoogleAuth} from "google-auth-library";

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

    let facts: any[];
    try {
      facts = JSON.parse(rawText);
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

async function executeVoiceTool(
  toolName: string,
  args: Record<string, any>,
  userId: string
): Promise<Record<string, any>> {
  const db = admin.firestore();
  const entriesRef = db.collection("entries");

  // ── App control tools — return commands for the frontend to execute ────────
  switch (toolName) {
  case "navigateApp":
    return {appCommand: "navigate", route: args.route, success: true};
  case "navigateToCategory":
    return {appCommand: "navigate", route: `/category/${encodeURIComponent(args.category)}`, success: true};
  case "openEntryForm":
    return {appCommand: "openEntryForm", category: args.category || null, success: true};
  case "closeEntry":
    return {appCommand: "goBack", success: true};
  case "scrollPage":
    return {appCommand: "scrollPage", direction: args.direction || "down", success: true};
  case "startBrainDump":
    return {appCommand: "startBrainDump", success: true};
  case "processBrainDump":
    return {appCommand: "processBrainDump", success: true};
  case "saveBrainDump":
    return {appCommand: "saveBrainDump", category: args.category || null, success: true};
  case "openEntry": {
    let resolvedId = args.id || null;
    // If no ID provided, search Firestore by title to get the real ID
    if (!resolvedId && args.title) {
      const snap = await entriesRef
        .where("user_id", "==", userId)
        .orderBy("updated_at", "desc")
        .limit(30)
        .get();
      const q = args.title.toLowerCase();
      const found = snap.docs
        .map((d) => ({id: d.id, ...(d.data() as any)}))
        .find((e: any) => e.title && e.title.toLowerCase().includes(q));
      if (found) resolvedId = found.id;
    }
    return {appCommand: "openEntry", id: resolvedId, title: args.title || null, success: true};
  }
  case "printEntry": {
    // Find matching entries to print
    const snap = await entriesRef
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(50)
      .get();
    const allDocs = snap.docs.map((d) => ({id: d.id, ...(d.data() as any)}));
    let toPrint: any[] = [];

    if (args.id) {
      const byId = allDocs.find((e) => e.id === args.id);
      if (byId) toPrint = [byId];
    } else if (args.title) {
      const q = args.title.toLowerCase();
      toPrint = allDocs.filter((e: any) => e.title && e.title.toLowerCase().includes(q));
    } else if (args.category) {
      const cat = args.category.toLowerCase();
      toPrint = allDocs.filter((e: any) => e.fields?.category && e.fields.category.toLowerCase() === cat);
    }

    if (toPrint.length === 0) {
      return {success: false, error: "No entries found to print"};
    }

    return {
      appCommand: "printEntry",
      entries: toPrint.map((e) => ({id: e.id, title: e.title, fields: e.fields || {}, category: e.fields?.category})),
      count: toPrint.length,
      success: true,
    };
  }
  }

  // ── Vault operations ───────────────────────────────────────────────────────
  switch (toolName) {
  case "saveEntry": {
    let fields: Record<string, string> = {};
    let field_definitions: any[] = [];

    if (args.fields && Array.isArray(args.fields) && args.fields.length > 0) {
      // Structured entry — build fields map + definitions from key-value pairs
      for (const f of args.fields) {
        const id = f.key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        fields[id] = f.value;
        field_definitions.push({id, name: f.key, type: "text"});
      }
    } else {
      // General content entry
      fields = {content: args.content || ""};
      field_definitions = [{id: "content", name: "Content", type: "textarea"}];
    }

    // ── Category Intelligence: predict if not explicitly provided ──────────
    let finalCategory: string = args.category || "";
    let categoryWasPredicted = false;
    const geminiKey = process.env.GEMINI_API_KEY;

    if ((!finalCategory || finalCategory === "Personal") && geminiKey) {
      const contentForPrediction = args.content
        || (args.fields ? (args.fields as any[]).map((f: any) => `${f.key}: ${f.value}`).join(", ") : "");

      const prediction = await predictCategory(userId, args.title || "", contentForPrediction, db, geminiKey);

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
      const contentText = args.content
        || (args.fields ? (args.fields as any[]).map((f: any) => `${f.value}`).join(" ") : "");
      recordCategorySignal(userId, args.title || "", contentText, finalCategory, false, db).catch(() => {});
    }

    return {
      success: true,
      id: docRef.id,
      title: args.title,
      category: finalCategory,
      category_was_predicted: categoryWasPredicted,
      appCommand: "novaAction",
      actionType: "save_entry",
      actionData: {
        id: docRef.id,
        title: args.title,
        category: finalCategory,
        content: args.content || null,
        fields: args.fields || null,
      },
    };
  }

  case "searchEntries": {
    const limit = args.limit || 5;
    const snap = await entriesRef
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(50)
      .get();
    const q = args.query.toLowerCase();
    const results = snap.docs
      .map((d) => ({id: d.id, ...d.data()}))
      .filter((e: any) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.fields?.content && e.fields.content.toLowerCase().includes(q)) ||
        (e.fields?.category && e.fields.category.toLowerCase().includes(q))
      )
      .slice(0, limit)
      .map((e: any) => ({id: e.id, title: e.title, content: e.fields?.content, category: e.fields?.category}));
    return {
      success: true, results, count: results.length,
      appCommand: "novaAction",
      actionType: "search",
      actionData: { query: args.query, results: results.slice(0, 5), count: results.length },
    };
  }

  case "getRecentEntries": {
    const limit = args.limit || 5;
    let q = entriesRef.where("user_id", "==", userId).orderBy("updated_at", "desc").limit(limit);
    if (args.category) {
      q = entriesRef
        .where("user_id", "==", userId)
        .where("fields.category", "==", args.category)
        .orderBy("updated_at", "desc")
        .limit(limit);
    }
    const snap = await q.get();
    const results = snap.docs.map((d) => {
      const data = d.data() as any;
      return {id: d.id, title: data.title, content: data.fields?.content, category: data.fields?.category};
    });
    return {success: true, results, count: results.length};
  }

  case "updateEntry": {
    const updateData: Record<string, any> = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (args.title) updateData.title = args.title;

    // Fetch existing entry to compare and merge
    const existingDoc = await entriesRef.doc(args.id).get();
    const existingData = existingDoc.data() || {};
    const currentFields = existingData.fields || {};

    if (args.content || args.category) {
      updateData.fields = {
        ...currentFields,
        ...(args.content ? {content: args.content} : {}),
        ...(args.category ? {category: args.category} : {}),
      };
    }

    // Category correction learning — if category changed, record it as a correction
    const oldCategory = existingData.category as string | undefined;
    if (args.category && oldCategory && args.category !== oldCategory) {
      updateData.category = args.category;
      updateData.category_predicted = false; // human corrected it

      // Record this as a high-confidence correction signal
      const entryTitle = args.title || (existingData.title as string) || "";
      const entryContent = args.content || currentFields.content || "";
      recordCategorySignal(userId, entryTitle, entryContent, args.category, true, db).catch(() => {});
    } else if (args.category && !oldCategory) {
      updateData.category = args.category;
    }

    await entriesRef.doc(args.id).update(updateData);
    return {
      success: true, id: args.id,
      appCommand: "novaAction",
      actionType: "update_entry",
      actionData: {
        id: args.id,
        title: args.title || null,
        category: args.category || null,
        content: args.content || null,
      },
    };
  }

  case "deleteEntry": {
    // Get title before deleting for the live feedback
    const delDoc = await entriesRef.doc(args.id).get();
    const delTitle = delDoc.data()?.title || "Entry";
    await entriesRef.doc(args.id).delete();
    return {
      success: true, id: args.id,
      appCommand: "novaAction",
      actionType: "delete_entry",
      actionData: { id: args.id, title: delTitle },
    };
  }
  }

  // ── Settings operations ──────────────────────────────────────────────────
  const prefsRef = db.collection("user_preferences").doc(userId);

  switch (toolName) {
  case "updateTheme": {
    await prefsRef.set({theme: args.theme}, {merge: true});
    return {appCommand: "updateTheme", theme: args.theme, success: true};
  }

  case "updateProfile": {
    const profileRef = db.collection("profiles").doc(userId);
    const updates: Record<string, any> = {};
    if (args.fullName) updates.fullName = args.fullName;
    if (args.phone) updates.phone = args.phone;
    await profileRef.set(updates, {merge: true});
    // Also update Firebase Auth display name if provided
    if (args.fullName) {
      await admin.auth().updateUser(userId, {displayName: args.fullName});
    }
    return {appCommand: "settingsUpdated", setting: "profile", success: true};
  }

  case "toggleNotification": {
    await prefsRef.set({[args.type]: args.enabled}, {merge: true});
    return {appCommand: "settingsUpdated", setting: args.type, value: args.enabled, success: true};
  }

  case "updateVoiceSettings": {
    const voiceUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        voiceUpdates[key] = value;
      }
    }
    await prefsRef.set(voiceUpdates, {merge: true});
    return {appCommand: "settingsUpdated", setting: "voice", updates: voiceUpdates, success: true};
  }

  case "exportUserData": {
    // Trigger export on the frontend — backend collects the data
    return {appCommand: "exportData", format: args.format || "json", success: true};
  }
  }

  // ── Memory operations ──────────────────────────────────────────────────
  const memoriesRef = db.collection("nova_memories");

  switch (toolName) {
  case "rememberFact": {
    // If this overrides an existing fact, deactivate the old one
    if (args.overrides) {
      const existingSnap = await memoriesRef
        .where("user_id", "==", userId)
        .where("active", "==", true)
        .orderBy("updated_at", "desc")
        .limit(30)
        .get();

      const overrideText = (args.overrides as string).toLowerCase();
      for (const d of existingSnap.docs) {
        const content = (d.data().content || "").toLowerCase();
        if (content.includes(overrideText.substring(0, Math.min(20, overrideText.length)))) {
          await d.ref.update({active: false, superseded_by: "pending", updated_at: admin.firestore.FieldValue.serverTimestamp()});
          break;
        }
      }
    }

    const memDoc = await memoriesRef.add({
      user_id: userId,
      type: "fact",
      content: args.content,
      category: args.category || null,
      source: "explicit",
      confidence: 0.9,
      access_count: 0,
      last_accessed: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      superseded_by: null,
      active: true,
    });

    await rebuildMemoryProfile(userId, db);
    return {
      success: true, memoryId: memDoc.id,
      appCommand: "novaAction",
      actionType: "remember",
      actionData: { content: args.content, category: args.category || null },
    };
  }

  case "recallMemories": {
    let q: admin.firestore.Query = memoriesRef
      .where("user_id", "==", userId)
      .where("active", "==", true);

    if (args.category) {
      q = q.where("category", "==", args.category);
    }

    const snap = await q.orderBy("updated_at", "desc").limit(30).get();
    const query = ((args.query as string) || "").toLowerCase();
    const queryWords = query.split(/\s+/).filter((w) => w.length > 2);

    const scored = snap.docs
      .map((d) => ({id: d.id, ...(d.data() as any)}))
      .map((mem: any) => {
        const content = (mem.content || "").toLowerCase();
        let score = 0.1;
        if (content.includes(query)) score = 1.0;
        else if (queryWords.some((w: string) => content.includes(w))) score = 0.5;
        return {...mem, score};
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    // Update access counts for relevant matches (fire-and-forget)
    for (const mem of scored) {
      if (mem.score > 0.3) {
        memoriesRef.doc(mem.id).update({
          access_count: admin.firestore.FieldValue.increment(1),
          last_accessed: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {/* non-critical */});
      }
    }

    return {
      success: true,
      memories: scored.map((m: any) => ({content: m.content, category: m.category, type: m.type})),
      count: scored.length,
    };
  }

  case "forgetMemory": {
    const snap = await memoriesRef
      .where("user_id", "==", userId)
      .where("active", "==", true)
      .orderBy("updated_at", "desc")
      .limit(30)
      .get();

    const query = ((args.query as string) || "").toLowerCase();
    const queryWords = query.split(/\s+/).filter((w) => w.length > 2);
    let deactivated = 0;

    for (const d of snap.docs) {
      const content = (d.data().content || "").toLowerCase();
      if (content.includes(query) || queryWords.every((w: string) => content.includes(w))) {
        await d.ref.update({active: false, updated_at: admin.firestore.FieldValue.serverTimestamp()});
        deactivated++;
      }
    }

    if (deactivated > 0) {
      await rebuildMemoryProfile(userId, db);
    }
    return {
      success: true, deactivated,
      appCommand: "novaAction",
      actionType: "forget",
      actionData: { query: args.query, count: deactivated },
    };
  }

  }

  // ── Agentic intelligence operations ───────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;

  switch (toolName) {
  case "getEntityGraph": {
    const entitySnap = await db.collection("entity_graph")
      .where("user_id", "==", userId)
      .limit(100)
      .get();

    const query = (args.query as string).toLowerCase();
    const typeFilter = args.type as string | undefined;
    const matches = entitySnap.docs
      .map((d) => ({id: d.id, ...(d.data() as any)}))
      .filter((e: any) => {
        const nameMatch = e.name.toLowerCase().includes(query) ||
          (e.aliases || []).some((a: string) => a.toLowerCase().includes(query));
        const typeMatch = !typeFilter || e.type === typeFilter;
        return nameMatch && typeMatch;
      })
      .slice(0, 10);

    // For each matched entity, get linked entries
    for (const entity of matches) {
      const links = await db.collection("entry_entities")
        .where("user_id", "==", userId)
        .where("entity_id", "==", entity.id)
        .limit(10)
        .get();
      const entryIds = links.docs.map((d) => d.data().entry_id);
      const entries: any[] = [];
      for (const eid of entryIds.slice(0, 5)) {
        const entryDoc = await entriesRef.doc(eid).get();
        if (entryDoc.exists) {
          const data = entryDoc.data() as any;
          entries.push({id: eid, title: data.title, category: data.category || data.fields?.category, summary: data.summary});
        }
      }
      entity.entries = entries;
    }

    return {success: true, entities: matches, count: matches.length};
  }

  case "getRelatedEntries": {
    const limit = (args.limit as number) || 5;
    const relatedIds: Set<string> = new Set();

    if (args.entryId) {
      const links = await db.collection("entry_links")
        .where("user_id", "==", userId)
        .where("source_entry_id", "==", args.entryId)
        .orderBy("strength", "desc")
        .limit(limit)
        .get();
      links.docs.forEach((d) => relatedIds.add(d.data().target_entry_id));

      // Also check reverse links
      const reverseLinks = await db.collection("entry_links")
        .where("user_id", "==", userId)
        .where("target_entry_id", "==", args.entryId)
        .orderBy("strength", "desc")
        .limit(limit)
        .get();
      reverseLinks.docs.forEach((d) => relatedIds.add(d.data().source_entry_id));
    }

    if (args.topic) {
      const entitySnap = await db.collection("entity_graph")
        .where("user_id", "==", userId)
        .limit(50)
        .get();
      const topicLower = (args.topic as string).toLowerCase();
      const matchedEntityIds = entitySnap.docs
        .filter((d) => {
          const data = d.data();
          return data.name.toLowerCase().includes(topicLower) ||
            (data.aliases || []).some((a: string) => a.toLowerCase().includes(topicLower));
        })
        .map((d) => d.id);

      for (const entityId of matchedEntityIds.slice(0, 10)) {
        const entityEntries = await db.collection("entry_entities")
          .where("user_id", "==", userId)
          .where("entity_id", "==", entityId)
          .limit(limit * 2)
          .get();
        entityEntries.docs.forEach((d) => relatedIds.add(d.data().entry_id));
      }
    }

    // Fetch full entry data
    const entries: any[] = [];
    for (const id of Array.from(relatedIds).slice(0, limit)) {
      const entryDoc = await entriesRef.doc(id).get();
      if (entryDoc.exists) {
        const data = entryDoc.data() as any;
        entries.push({
          id,
          title: data.title,
          summary: data.summary || null,
          category: data.category || data.fields?.category,
          action_items: data.action_items || [],
          tags: data.tags || [],
          updated_at: data.updated_at,
        });
      }
    }

    return {success: true, entries, count: entries.length};
  }

  case "prepareBriefing": {
    if (!geminiKey) return {success: false, error: "AI not configured"};

    // 1. Gather context from multiple sources
    const searchResult = await executeVoiceTool("searchEntries", {query: args.subject, limit: 10}, userId);
    const relatedResult = await executeVoiceTool("getRelatedEntries", {topic: args.subject, limit: 10}, userId);
    const memoryResult = await executeVoiceTool("recallMemories", {query: args.subject}, userId);

    // 2. Combine and deduplicate entries
    const allEntries = [...(searchResult.results || []), ...(relatedResult.entries || [])];
    const seen = new Set<string>();
    const uniqueEntries = allEntries.filter((e: any) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    const memories = memoryResult.memories || [];

    // 3. Collect open action items
    const actionItemsSnap = await db.collection("action_items")
      .where("user_id", "==", userId)
      .where("status", "in", ["open", "in_progress"])
      .orderBy("created_at", "desc")
      .limit(20)
      .get();
    const subjectLower = (args.subject as string).toLowerCase();
    const relevantActions = actionItemsSnap.docs
      .map((d) => d.data())
      .filter((a: any) => (a.text || "").toLowerCase().includes(subjectLower));

    // 4. Synthesize with Gemini
    const synthesisPrompt = `Synthesize a ${args.type || "general"} briefing about "${args.subject}".

Entries found (${uniqueEntries.length}):
${uniqueEntries.map((e: any) => `- ${e.title}: ${e.summary || e.content || "(no summary)"}`).join("\n")}

Memories about this:
${memories.length ? memories.map((m: any) => `- ${m.content}`).join("\n") : "None"}

Open action items:
${relevantActions.length ? relevantActions.map((a: any) => `- ${a.text} [${a.priority || "medium"}]${a.due_date ? " due: " + a.due_date : ""}`).join("\n") : "None"}

Write a concise briefing (2-4 sentences) suitable for voice. Mention key facts, open tasks, and anything time-sensitive.`;

    const briefingRes = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: synthesisPrompt}]}],
        generationConfig: {maxOutputTokens: 512, temperature: 0.3},
      }),
    });

    let briefingText = "I couldn't generate a briefing right now.";
    if (briefingRes.ok) {
      const briefingData = await briefingRes.json();
      briefingText = briefingData.candidates?.[0]?.content?.parts?.[0]?.text || briefingText;
    }

    return {
      success: true,
      briefing: briefingText,
      entriesUsed: uniqueEntries.length,
      memoriesUsed: memories.length,
      openActionItems: relevantActions.length,
    };
  }

  case "getActivitySummary": {
    const timeframeMap: Record<string, number> = {
      today: 1, yesterday: 2, this_week: 7, last_week: 14, this_month: 30,
    };
    const daysBack = timeframeMap[args.timeframe as string] || 7;
    const since = new Date(Date.now() - daysBack * 86400000);

    const snap = await entriesRef
      .where("user_id", "==", userId)
      .where("created_at", ">=", admin.firestore.Timestamp.fromDate(since))
      .orderBy("created_at", "desc")
      .limit(30)
      .get();

    const entries = snap.docs.map((d) => ({id: d.id, ...(d.data() as any)}));
    const categoryCounts: Record<string, number> = {};
    const allActionItems: any[] = [];

    entries.forEach((e: any) => {
      const cat = e.category || e.fields?.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (e.action_items) allActionItems.push(...e.action_items);
    });

    return {
      success: true,
      totalEntries: entries.length,
      categoryCounts,
      recentTitles: entries.slice(0, 7).map((e: any) => e.title),
      openActionItems: allActionItems.filter((a: any) => a.status !== "completed").length,
      timeframe: args.timeframe,
    };
  }

  case "getUpcomingDeadlines": {
    const tfMap: Record<string, number> = {
      today: 1, tomorrow: 2, this_week: 7, next_week: 14,
    };
    const daysAhead = tfMap[args.timeframe as string] || 7;
    const until = new Date(Date.now() + daysAhead * 86400000);
    const statusFilter = (args.status as string) || "open";

    let q: admin.firestore.Query = db.collection("action_items")
      .where("user_id", "==", userId);

    if (statusFilter !== "all") {
      q = q.where("status", "==", statusFilter);
    }

    const snap = await q.orderBy("created_at", "desc").limit(30).get();

    const items = snap.docs
      .map((d) => ({id: d.id, ...(d.data() as any)}))
      .filter((item: any) => {
        if (!item.due_date) return true; // Include items without due dates
        const dueDate = item.due_date.toDate ? item.due_date.toDate() : new Date(item.due_date);
        return dueDate <= until;
      })
      .slice(0, 10);

    return {
      success: true,
      items: items.map((i: any) => ({
        id: i.id,
        text: i.text,
        priority: i.priority,
        status: i.status,
        due_date: i.due_date ? (i.due_date.toDate ? i.due_date.toDate().toISOString() : i.due_date) : null,
        entry_id: i.entry_id,
      })),
      count: items.length,
      timeframe: args.timeframe,
    };
  }

  case "updateActionItem": {
    const snap = await db.collection("action_items")
      .where("user_id", "==", userId)
      .where("status", "in", ["open", "in_progress"])
      .orderBy("created_at", "desc")
      .limit(30)
      .get();

    const query = (args.query as string).toLowerCase();
    const queryWords = query.split(/\s+/).filter((w) => w.length > 2);

    // Find best match
    let bestMatch: any = null;
    let bestScore = 0;
    for (const d of snap.docs) {
      const text = (d.data().text || "").toLowerCase();
      let score = 0;
      if (text.includes(query)) score = 1.0;
      else {
        const matchedWords = queryWords.filter((w) => text.includes(w));
        score = queryWords.length > 0 ? matchedWords.length / queryWords.length : 0;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {id: d.id, ref: d.ref, ...d.data()};
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return {success: false, error: "No matching action item found"};
    }

    const updateData: Record<string, any> = {
      status: args.status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (args.status === "completed") {
      updateData.completed_at = admin.firestore.FieldValue.serverTimestamp();
    }
    await bestMatch.ref.update(updateData);

    return {
      success: true, id: bestMatch.id, text: bestMatch.text, newStatus: args.status,
      appCommand: "novaAction",
      actionType: "update_task",
      actionData: { text: bestMatch.text, status: args.status },
    };
  }

  case "setReminder": {
    // Parse the "when" field into a timestamp
    const whenStr = (args.when as string).toLowerCase();
    let triggerAt = new Date();

    if (whenStr.includes("tomorrow")) {
      triggerAt.setDate(triggerAt.getDate() + 1);
      triggerAt.setHours(9, 0, 0, 0); // Default 9am
    } else if (whenStr.includes("next week") || whenStr.includes("next monday")) {
      const daysUntilMonday = (8 - triggerAt.getDay()) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilMonday);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.match(/in (\d+) hour/)) {
      const hours = parseInt(whenStr.match(/in (\d+) hour/)![1]);
      triggerAt.setTime(triggerAt.getTime() + hours * 3600000);
    } else if (whenStr.match(/in (\d+) minute/)) {
      const mins = parseInt(whenStr.match(/in (\d+) minute/)![1]);
      triggerAt.setTime(triggerAt.getTime() + mins * 60000);
    } else if (whenStr.match(/in (\d+) day/)) {
      const days = parseInt(whenStr.match(/in (\d+) day/)![1]);
      triggerAt.setDate(triggerAt.getDate() + days);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("friday")) {
      const daysUntilFri = (5 - triggerAt.getDay() + 7) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilFri);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("monday")) {
      const daysUntilMon = (1 - triggerAt.getDay() + 7) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilMon);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("wednesday")) {
      const daysUntilWed = (3 - triggerAt.getDay() + 7) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilWed);
      triggerAt.setHours(9, 0, 0, 0);
    } else {
      // Default: tomorrow 9am
      triggerAt.setDate(triggerAt.getDate() + 1);
      triggerAt.setHours(9, 0, 0, 0);
    }

    // Parse time if specified (e.g., "at 3pm", "at 9am")
    const timeMatch = whenStr.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3]?.toLowerCase() === "pm" && hours < 12) hours += 12;
      if (timeMatch[3]?.toLowerCase() === "am" && hours === 12) hours = 0;
      triggerAt.setHours(hours, minutes, 0, 0);
    }

    const reminderDoc = await db.collection("reminders").add({
      user_id: userId,
      text: args.text,
      trigger_at: admin.firestore.Timestamp.fromDate(triggerAt),
      entry_id: args.entryId || null,
      action_item_id: null,
      status: "pending",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true, reminderId: reminderDoc.id, triggerAt: triggerAt.toISOString(), text: args.text,
      appCommand: "novaAction",
      actionType: "set_reminder",
      actionData: { text: args.text, when: triggerAt.toISOString() },
    };
  }

  default:
    return {success: false, error: `Unknown tool: ${toolName}`};
  }
}

// ── Voice Agent Function ──────────────────────────────────────────────────────
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
      const userText: string = transcript?.trim() || "";

      // Build user message parts — audio or text
      const userParts: any[] = audioData
        ? [{inlineData: {mimeType: inputAudioMimeType || "audio/webm", data: audioData}}]
        : [{text: userText}];

      // Cap history to last 10 turns to prevent large payloads
      const cappedHistory = conversationHistory.slice(-10);

      // Build contents array from history + new user message
      const contents: any[] = [
        ...cappedHistory,
        {role: "user", parts: userParts},
      ];

      let responseText = "";
      const actionsExecuted: any[] = [];

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
        const directResult = await executeVoiceTool(
          debugToolOverride.tool,
          debugToolOverride.args || {},
          user.uid
        );
        actionsExecuted.push({
          tool: debugToolOverride.tool,
          args: debugToolOverride.args || {},
          result: directResult,
        });
        responseText = directResult?.briefing || directResult?.message || `Completed ${debugToolOverride.tool}.`;

        const cleanHistory = [
          ...cappedHistory,
          {role: "user", parts: [{text: transcript?.trim() || `[direct tool] ${debugToolOverride.tool}`}]},
          {role: "model", parts: [{text: responseText}]},
        ];

        try {
          const sessionTurns = cleanHistory.slice(-10);
          const sessionActions = actionsExecuted.map((a: any) => ({
            tool: a.tool,
            args: a.args,
            result_summary: a.result?.success ? "success" : "failed",
            timestamp: Date.now(),
          }));

          if (currentSessionId) {
            const updateData: Record<string, any> = {
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
          appCommands: actionsExecuted.filter((a) => a.result?.appCommand).map((a) => a.result),
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
      } catch (pErr: any) {
        console.warn("[VoiceAgent] Patterns query skipped:", pErr?.message || pErr);
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
        const hasFunctionCall = parts.some((p: any) => p.functionCall);

        if (hasFunctionCall) {
          // Add model's function call turn to history
          contents.push({role: "model", parts});

          // Execute all tool calls
          const functionResponses: any[] = [];
          for (const part of parts) {
            if (!part.functionCall) continue;
            const {name, args} = part.functionCall;
            console.log(`[VoiceAgent] Tool: ${name}`, args);
            let result: Record<string, any>;
            try {
              result = await executeVoiceTool(name, args, user.uid);
            } catch (toolErr: any) {
              console.error(`[VoiceAgent] Tool ${name} failed:`, toolErr?.message || toolErr);
              result = {success: false, error: `Tool ${name} failed: ${toolErr?.message || "unknown error"}`};
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
            .filter((p: any) => p.text)
            .map((p: any) => p.text)
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

      // Separate app commands from vault actions
      const appCommands = actionsExecuted
        .filter((a) => a.result?.appCommand)
        .map((a) => a.result);

      // Replace audio parts in history with text placeholder (audio can't be stored in history)
      const cleanHistory = contents.map((turn: any) => ({
        ...turn,
        parts: turn.parts.map((p: any) =>
          p.inlineData ? {text: "[voice message]"} : p
        ),
      }));

      // ── Save conversation session ──────────────────────────────────────────
      try {
        const sessionTurns = cleanHistory.slice(-10);
        const sessionActions = actionsExecuted.map((a: any) => ({
          tool: a.tool,
          args: a.args,
          result_summary: a.result?.success ? "success" : "failed",
          timestamp: Date.now(),
        }));

        if (currentSessionId) {
          const updateData: Record<string, any> = {
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
    } catch (error: any) {
      console.error("[VoiceAgent] Error:", error);
      res.status(500).json({error: "Voice agent failed", detail: error?.message || String(error)});
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

      let extracted: any;
      try {
        extracted = JSON.parse(rawText);
      } catch {
        console.warn("[processEntryDeep] Failed to parse Gemini JSON:", rawText.substring(0, 200));
        await change.after.ref.update({processed: true});
        return;
      }

      const entities = extracted.entities || [];
      const tags = extracted.tags || [];
      const actionItems = extracted.action_items || [];
      const summary = extracted.summary || "";

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
      const userEntries: Record<string, any[]> = {};
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
${entries.map((e: any) => `- "${e.title}" [${e.category || "uncategorized"}] tags: ${(e.tags || []).join(", ") || "none"}`).join("\n")}

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

        let patterns: any[];
        try {
          patterns = JSON.parse(rawText);
        } catch {
          continue;
        }

        if (!Array.isArray(patterns)) continue;

        for (const pattern of patterns) {
          if (!pattern.description || pattern.confidence < 0.6) continue;

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
              confidence: pattern.confidence,
              occurrence_count: 1,
              last_occurred: admin.firestore.FieldValue.serverTimestamp(),
              active: pattern.confidence >= 0.7,
              created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Update confidence and occurrence count
            await existingSnap.docs[0].ref.update({
              confidence: Math.min(pattern.confidence + 0.05, 1.0),
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
    const field_definitions: any[] = [{id: "content", name: "Content", type: "textarea"}];
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
