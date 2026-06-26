import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {GoogleAuth} from "google-auth-library";
import {withCors} from "../common/http";
import {verifyAuth} from "../common/auth";
import {fetchWithRetry} from "../common/fetchWithRetry";
import {VOICE_AGENT_TOOLS} from "./tools";
import {buildVoiceAgentSystemPrompt} from "./prompt";
import {extractAndStoreMemories} from "./memory";
import {GEMINI_API} from "./config";
import {executeVoiceTool, ConversationPart, ConversationTurnRecord, ActionExecutionRecord} from "./toolExecutor";
import {summarizeToolArgs} from "../voiceToolValidation";
import {fail} from "../voiceToolResults";

/**
 * gemini-2.5-flash strictly requires every functionResponse to immediately
 * follow its functionCall. Restored/capped session history can slice between a
 * tool call and its response, leaving orphans that 400 the whole request.
 * Reduce prior history to plain text turns (audio -> placeholder; tool
 * call/response parts dropped). The live tool-call loop within a single request
 * is built fresh and stays correctly paired, so this only affects context from
 * earlier turns.
 */
function sanitizeHistoryTurns(turns: ConversationTurnRecord[]): ConversationTurnRecord[] {
  if (!Array.isArray(turns)) return [];
  return turns
    .map((turn) => ({
      role: turn.role,
      parts: (turn.parts || [])
        .map((part: ConversationPart) => (part.inlineData ? {text: "[voice message]"} : part))
        .filter((part: ConversationPart) => typeof part.text === "string" && part.text.length > 0),
    }))
    .filter((turn) => turn.parts.length > 0);
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
      const userText: string = transcript?.trim() || "";

      // ── Transcribe audio if no text transcript provided ──────────────────
      // Build user message parts — audio or text
      const userParts: ConversationPart[] = audioData
        ? [{inlineData: {mimeType: inputAudioMimeType || "audio/webm", data: audioData}}]
        : [{text: userText}];

      // Cap history to last 10 turns, then strip tool-call/response parts so
      // gemini-2.5-flash doesn't reject orphaned function turns from slicing.
      const cappedHistory = sanitizeHistoryTurns(conversationHistory.slice(-10));

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

      // ── Clean up response: strip any leaked tags or greeting prefix ─────────
      if (responseText) {
        responseText = responseText
          .replace(/\[\/?TRANSCRIPT\][\s\S]*?\[\/TRANSCRIPT\]/g, "")
          .replace(/\[\/?TRANSCRIPT\]/g, "")
          .replace(/^__nova_greet__:\S+\s*/i, "")
          .trim();
      }

      // ── Fallback response if Gemini returned nothing ────────────────────────
      // Gemini sometimes returns empty text for conversational inputs that don't
      // map to tools (like "Hello Nova"). Always give the user something to hear.
      if (!responseText) {
        const lower = userText.toLowerCase();
        if (/^(hi|hello|hey|yo|howdy|good morning|good afternoon|good evening)\b/.test(lower)) {
          responseText = `Hi ${displayName}! What do you want to save or find?`;
        } else if (/thank/.test(lower)) {
          responseText = "You got it.";
        } else if (/^(bye|goodbye|see you|later)/.test(lower)) {
          responseText = "Talk soon!";
        } else if (actionsExecuted.length > 0) {
          responseText = "Done.";
        } else {
          responseText = "I'm here. What would you like me to do?";
        }
        console.log("[VoiceAgent] Used fallback response:", responseText);
      }

      // ── Auto-extract memories from user input (fire-and-forget) ────────────
      if (userText) {
        extractAndStoreMemories(userText, user.uid, db).catch((err) => {
          console.warn("[VoiceAgent] Memory extraction failed:", err);
        });
      }

      // ── TTS — best-effort only; never fail the whole voice turn on speech ───
      let audioContent: string | null = null;
      let audioMimeType = "audio/mpeg";
      if (responseText) {
        try {
          const auth = new GoogleAuth({scopes: ["https://www.googleapis.com/auth/cloud-platform"]});
          const accessToken = await auth.getAccessToken();

          if (!accessToken) {
            console.warn("[VoiceAgent] Google TTS skipped: no access token available");
          } else {
            const ttsRes = await fetch(
              "https://texttospeech.googleapis.com/v1/text:synthesize",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  input: {text: responseText},
                  voice: {
                    languageCode: "en-US",
                    // Match the higher-quality landing-page demo voice.
                    // The landing demo maps "rachel" to Google Studio-O.
                    name: "en-US-Studio-O",
                  },
                  audioConfig: {
                    audioEncoding: "MP3",
                    speakingRate: 1.0,
                    pitch: 0,
                  },
                }),
              }
            );

            if (ttsRes.ok) {
              const ttsData = await ttsRes.json() as { audioContent?: string };
              if (ttsData.audioContent) {
                audioContent = ttsData.audioContent;
                audioMimeType = "audio/mpeg";
                console.log("[VoiceAgent] Google TTS success");
              } else {
                console.warn("[VoiceAgent] Google TTS: no audio data in response");
              }
            } else {
              const errText = await ttsRes.text();
              console.warn("[VoiceAgent] Google TTS error:", ttsRes.status, errText);
            }
          }
        } catch (ttsErr) {
          console.warn("[VoiceAgent] Google TTS exception:", ttsErr);
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

// ─────────────────────────────────────────────────────────────────────────────
// ── AGENTIC INTELLIGENCE LAYER ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
