import { voiceAgent } from "./voiceAgent";
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
 * Public Demo TTS - Rate-limited ElevenLabs proxy for landing page
 * No auth required, but limited to short texts and throttled per IP
 */
const demoRateLimitMap = new Map<string, { count: number; resetAt: number }>();

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

    const {text, voiceId} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Limit text length for demo (prevent abuse)
    if (text.length > 500) {
      res.status(400).json({error: "Text too long for demo (max 500 chars)"});
      return;
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.status(500).json({error: "ElevenLabs not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "pqHfZKP75CvOlQylNhV4"}/stream`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Demo TTS ElevenLabs error:", response.status, errorText);
        res.status(response.status).json({error: "ElevenLabs API error"});
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      res.json({audioContent: base64Audio});
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
    ],
  },
];

const buildVoiceAgentSystemPrompt = (displayName: string) => `
You are Nova — the conversational AI built into SaveMe.Space, a personal knowledge vault.
You are talking to ${displayName}. Be warm, sharp, and concise.

## CRITICAL RULE
NEVER describe what you are going to do. ALWAYS call the tool immediately.
Wrong: "Sure, I'll navigate to Books for you!"
Right: [call navigateToCategory tool immediately, then say "Done — opening Books."]

## Tools — call them immediately, no hesitation
- User says "open", "go to", "show me", "take me to" a category → call navigateToCategory NOW
- User says "go to insights / settings / dashboard / brain dump" → call navigateApp NOW
- User says "save this", "remember this", "note that" → call saveEntry NOW
- User says "what did I save about X" or "find X" → call searchEntries NOW
- User says "show recent", "what did I save lately" → call getRecentEntries NOW
- User says "create entry", "new entry", "add entry" → call openEntryForm NOW
- User says "open [title]", "view [title]" → call searchEntries to find it, then openEntry NOW
- User says "close", "go back", "exit", "back", "close this", "close the entry" → call closeEntry NOW
- User says "brain dump", "start brain dump", "open brain dump", "capture my thoughts" → call startBrainDump NOW
- User says "process", "structure this", "organize my thoughts" (on brain dump page) → call processBrainDump NOW
- User says "save this", "save the brain dump", "save my notes" (on brain dump page) → call saveBrainDump NOW

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

## After calling tools
Confirm briefly: "Done — opening Books." / "Got it, saved." / "Found 3 entries about that."
Keep responses short. This is voice — no lists, no markdown.
`.trim();

// ── Tool executor ─────────────────────────────────────────────────────────────
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

    if (args.category) {
      fields["category"] = args.category;
    }

    const docRef = await entriesRef.add({
      title: args.title,
      fields,
      field_definitions,
      category: args.category || "Personal",
      user_id: userId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {success: true, id: docRef.id, title: args.title};
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
    return {success: true, results, count: results.length};
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
    if (args.content || args.category) {
      // Need to merge fields
      const existing = await entriesRef.doc(args.id).get();
      const currentFields = existing.data()?.fields || {};
      updateData.fields = {
        ...currentFields,
        ...(args.content ? {content: args.content} : {}),
        ...(args.category ? {category: args.category} : {}),
      };
    }
    await entriesRef.doc(args.id).update(updateData);
    return {success: true, id: args.id};
  }

  case "deleteEntry": {
    await entriesRef.doc(args.id).delete();
    return {success: true, id: args.id};
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

    const {transcript, audioData, audioMimeType: inputAudioMimeType, conversationHistory = []} = req.body;
    if (!transcript?.trim() && !audioData) {
      res.status(400).json({error: "Transcript or audio data is required"});
      return;
    }

    const displayName = user.name || user.email?.split("@")[0] || "there";

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

      // ── Gemini function calling loop (max 4 iterations) ──────────────────
      let keepLooping = true;
      let loopCount = 0;
      while (keepLooping && loopCount < 4) {
        loopCount++;
        const geminiRes = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            systemInstruction: {parts: [{text: buildVoiceAgentSystemPrompt(displayName)}]},
            tools: VOICE_AGENT_TOOLS,
            contents,
            generationConfig: {maxOutputTokens: 256, temperature: 0.7},
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
            const result = await executeVoiceTool(name, args, user.uid);
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

      res.json({
        transcript: userText,
        responseText,
        audioContent,
        audioMimeType,
        actionsExecuted,
        appCommands,
        conversationHistory: cleanHistory,
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
export { voiceAgent };
