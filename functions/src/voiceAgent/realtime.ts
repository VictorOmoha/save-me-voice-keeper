import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {createHash} from "crypto";
import {verifyAuth} from "../common/auth";
import {withCors} from "../common/http";
import {assertUtf8Bytes, enforceAbuseControls, sendAbuseError, SERVICE_QUOTAS} from "../common/abuseControl";
import {assertVoiceAiAccess, readUserEntitlements, sendEntitlementError} from "../entitlements/entitlements";
import {executeVoiceTool} from "./toolExecutor";
import {REALTIME_MODEL, REALTIME_SESSION_MS, REALTIME_TOOL_NAMES, realtimeConfig} from "./realtimeConfig";

const CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const callIdPattern = /^[\w-]{1,160}$/;
class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function callIdFromLocation(location: string | null): string {
  const url = new URL(location || "", CALLS_URL);
  const match = url.pathname.match(/^\/v1\/realtime\/calls\/([\w-]{1,160})$/);
  if (url.origin !== "https://api.openai.com" || !match) throw new Error("Missing realtime call identifier");
  return match[1];
}

async function hangup(callId: string) {
  if (!callIdPattern.test(callId)) throw new Error("Invalid call identifier");
  const response = await fetch(`${CALLS_URL}/${callId}/hangup`, {
    method: "POST", headers: {Authorization: `Bearer ${process.env.OPENAI_API_KEY}`},
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok && response.status !== 404 && response.status !== 410) throw new Error("Could not end realtime call");
}

type Operation = "session" | "tool" | "end";
function endpoint(operation: Operation) {
  return functions.runWith({timeoutSeconds: 60, memory: "512MB"}).https.onRequest(withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) { res.status(401).json({error: "Unauthorized"}); return; }
    if (req.method !== "POST") { res.status(405).json({error: "Method not allowed"}); return; }
    res.set("Cache-Control", "no-store");
    try {
      assertUtf8Bytes(req.body, 64_000);
      const {sessionId} = req.body || {};
      if (typeof sessionId !== "string" || !sessionIdPattern.test(sessionId)) throw new RequestError(400, "Invalid session id");
      const db = admin.firestore();
      const ref = db.collection("nova_conversations").doc(sessionId);
      if (operation === "session") {
        const {sdp} = req.body;
        if (typeof sdp !== "string" || !sdp.startsWith("v=0") || !sdp.includes("m=audio")) throw new RequestError(400, "An audio SDP offer is required");
        await enforceAbuseControls({endpoint: "voiceRealtimeSession", user, req, policies: [
          {name: "burst", limit: 4, windowMs: 60_000}, {name: "hourly", limit: 24, windowMs: 3_600_000},
        ]});
        assertVoiceAiAccess(await readUserEntitlements(user.uid, db));
        if (!process.env.OPENAI_API_KEY) throw new RequestError(503, "Realtime voice is not configured");
        const profile = (await db.collection("nova_user_profile").doc(user.uid).get()).data();
        const config = realtimeConfig(user.name || "there", profile?.memory_summary, profile?.last_conversation_summary);
        const expiresAt = Date.now() + REALTIME_SESSION_MS;
        // A client-generated ID lets a stop request cancel even an in-flight connection.
        await db.runTransaction(async (tx) => {
          if ((await tx.get(ref)).exists) throw new RequestError(409, "Session already exists");
          tx.create(ref, {user_id: user.uid, transport: "openai-realtime", model: REALTIME_MODEL,
            status: "connecting", expires_at_ms: expiresAt, created_at: admin.firestore.FieldValue.serverTimestamp(), turns: [], processed_calls: []});
        });
        let callId: string | undefined;
        try {
          const form = new FormData();
          form.set("sdp", sdp);
          form.set("session", JSON.stringify(config));
          const response = await fetch(CALLS_URL, {method: "POST", body: form, signal: AbortSignal.timeout(25_000),
            headers: {Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "OpenAI-Safety-Identifier": createHash("sha256").update(user.uid).digest("hex")}});
          if (!response.ok) {
            console.error("Realtime connection rejected", {status: response.status});
            throw new RequestError(502, "Realtime voice is temporarily unavailable. Please try again.");
          }
          callId = callIdFromLocation(response.headers.get("location"));
          const answer = await response.text();
          if (!answer.startsWith("v=0")) throw new Error("Invalid realtime SDP answer");
          await db.runTransaction(async (tx) => {
            const data = (await tx.get(ref)).data();
            if (data?.status !== "connecting") throw new RequestError(409, "Session was stopped");
            tx.update(ref, {status: "active", call_id: callId});
          });
          res.json({sessionId, sdp: answer, model: REALTIME_MODEL, expiresAt});
        } catch (error) {
          if (callId) await hangup(callId).catch(() => console.warn("Realtime cleanup failed"));
          await ref.update({status: "ended"});
          throw error;
        }
        return;
      }

      if (operation === "end") {
        await enforceAbuseControls({endpoint: "voiceRealtimeEnd", user, req, policies: [
          {name: "burst", limit: 12, windowMs: 60_000}, {name: "hourly", limit: 120, windowMs: 3_600_000},
        ]});
        const callId = await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          const data = snap.data();
          if (snap.exists && data?.user_id !== user.uid) throw new RequestError(404, "Conversation not found");
          // Tombstone prevents a delayed session request from starting after Stop.
          if (!snap.exists) {
            tx.create(ref, {user_id: user.uid, transport: "openai-realtime", status: "ended", created_at: admin.firestore.FieldValue.serverTimestamp()});
          } else if (data?.transport === "openai-realtime") {
            const turns = Array.isArray(req.body.turns) ? req.body.turns.slice(-40).flatMap((turn: {role?: string; parts?: {text?: string}[]}) => {
              if (!["user", "model"].includes(turn?.role || "") || !Array.isArray(turn.parts)) return [];
              const text = turn.parts.map((part) => typeof part?.text === "string" ? part.text : "").join("\n").slice(0, 4000);
              return text ? [{role: turn.role, parts: [{text}]}] : [];
            }) : [];
            tx.update(ref, {status: "ended", ended_at: admin.firestore.FieldValue.serverTimestamp(), ...(turns.length ? {turns} : {})});
          } else throw new RequestError(404, "Conversation not found");
          return data?.call_id as string | undefined;
        });
        if (callId) await hangup(callId);
        res.json({success: true});
        return;
      }

      const {callId, name, args} = req.body;
      if (typeof callId !== "string" || !callIdPattern.test(callId) || !REALTIME_TOOL_NAMES.has(name) ||
        !args || typeof args !== "object" || Array.isArray(args)) throw new RequestError(400, "Invalid tool call");
      await enforceAbuseControls({endpoint: "voiceRealtimeTool", user, req, policies: SERVICE_QUOTAS.voiceAgent});
      assertVoiceAiAccess(await readUserEntitlements(user.uid, db));
      // Claim before execution: retries and duplicate realtime events cannot repeat a write.
      await db.runTransaction(async (tx) => {
        const data = (await tx.get(ref)).data();
        if (data?.user_id !== user.uid || data?.transport !== "openai-realtime") throw new RequestError(404, "Conversation not found");
        if (data.status !== "active" || data.expires_at_ms <= Date.now()) throw new RequestError(409, "Voice session ended. Start a new session.");
        const calls: string[] = data.processed_calls || [];
        if (calls.includes(callId)) throw new RequestError(409, "Action already submitted. Check its result before requesting it again.");
        if (calls.length >= 100) throw new RequestError(429, "Session action limit reached. Start a new session.");
        tx.update(ref, {processed_calls: [...calls, callId]});
      });
      const result = await executeVoiceTool(name, args, user.uid);
      res.json({result});
    } catch (error) {
      if (sendAbuseError(res, error) || sendEntitlementError(res, error)) return;
      if (error instanceof RequestError) { res.status(error.status).json({error: error.message}); return; }
      console.error("Realtime request failed", {operation, error: error instanceof Error ? error.name : "unknown"});
      res.status(503).json({error: "Realtime request could not be completed. Check any pending action before trying again."});
    }
  }));
}

export const voiceRealtimeSession = endpoint("session");
export const voiceRealtimeTool = endpoint("tool");
export const voiceRealtimeEnd = endpoint("end");
