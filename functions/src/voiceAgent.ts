import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import OpenAI from "openai";

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
 * NEW: Agentic Voice Processor
 * Handles conversational intent, tool calling, and autonomous database updates.
 */
export const voiceAgent = functions.https.onRequest(
  withCors(async (req, res) => {
    // 1. Verify user is logged in
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const { transcript, conversationHistory } = req.body;

    if (!transcript) {
      res.status(400).json({error: "Transcript is required"});
      return;
    }

    // 2. Initialize OpenAI (requires OPENAI_API_KEY in firebase config)
    const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({error: "OpenAI API key not configured in Firebase"});
      return;
    }

    const openai = new OpenAI({ apiKey });
    const db = admin.firestore();

    // 3. Define the Tools the Agent can use
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "create_database_entry",
          description: "Creates a new record in the user's database (e.g., medical, shopping, notes).",
          parameters: {
            type: "object",
            properties: {
              category: { type: "string", description: "The category of the entry (e.g., 'Health', 'Shopping', 'Business')" },
              title: { type: "string", description: "A short title for the entry" },
              content: { type: "string", description: "The full details or body of the entry" },
              tags: { type: "array", items: { type: "string" }, description: "Relevant tags" }
            },
            required: ["category", "title", "content"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "ask_clarifying_question",
          description: "Ask the user a question if you are missing required information to complete their request.",
          parameters: {
            type: "object",
            properties: {
              question: { type: "string", description: "The specific question to ask the user" }
            },
            required: ["question"]
          }
        }
      }
    ];

    try {
      // 4. Build the message array (History + New Transcript)
      const messages: any[] = [
        { 
          role: "system", 
          content: "You are the SaveMe Voice Keeper Agent. Your job is to listen to the user, figure out what data they want to save or update, and execute database actions using the provided tools. If you have enough info to save an entry, call create_database_entry. If you need more info (like a category or specific details), call ask_clarifying_question. Always be concise." 
        },
        ...(conversationHistory || []),
        { role: "user", content: transcript }
      ];

      // 5. Call OpenAI with Tool Support
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast, capable model
        messages: messages,
        tools: tools,
        tool_choice: "auto",
      });

      const responseMessage = response.choices[0].message;

      // 6. Handle Tool Calls
      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = (toolCall as any).function?.name;
          const functionArgs = JSON.parse((toolCall as any).function?.arguments || "{}");

          if (functionName === "create_database_entry") {
            // Autonomous Action: Save directly to Firestore!
            const newEntry = {
              userId: user.uid,
              category: functionArgs.category,
              title: functionArgs.title,
              content: functionArgs.content,
              tags: functionArgs.tags || [],
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              source: "voice_agent"
            };

            const docRef = await db.collection("entries").add(newEntry);
            
            res.json({
              status: "success",
              actionTaken: "created_entry",
              entryId: docRef.id,
              agentReply: `I've created the ${functionArgs.category} entry titled "${functionArgs.title}".`
            });
            return;
          } 
          
          if (functionName === "ask_clarifying_question") {
            res.json({
              status: "needs_info",
              actionTaken: "clarification",
              agentReply: functionArgs.question
            });
            return;
          }
        }
      }

      // 7. If no tools were called, return standard conversation
      res.json({
        status: "success",
        actionTaken: "conversation",
        agentReply: responseMessage.content || "I heard you, but I wasn't sure what action to take."
      });

    } catch (error) {
      console.error("Voice Agent execution error:", error);
      res.status(500).json({error: "Agent failed to process request"});
    }
  })
);