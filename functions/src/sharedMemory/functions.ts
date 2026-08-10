import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {withCors} from "../common/http";
import {AuthenticatedUser, hasPermission, requirePermission, verifyAuth} from "../common/auth";
import {createSharedMemory} from "./create";
import {searchSharedMemories} from "./search";
import {getSharedMemory} from "./get";
import {listSharedMemories} from "./list";
import {updateSharedMemory} from "./update";
import {batchCreateSharedMemories} from "./batchCreate";
import {SharedMemoryCreateInput, SharedMemorySearchInput} from "./types";
import {generateAgentApiKey, hashAgentApiKey, normalizeAgentPermissions} from "./agentKeys";
import {assertArrayCap, assertStringCap, assertUtf8Bytes, enforceAbuseControls, sendAbuseError, SERVICE_CAPS, SERVICE_QUOTAS} from "../common/abuseControl";
import {assertAdvancedSearchAccess, assertAgentApiAccess, readUserEntitlements, sendEntitlementError} from "../entitlements/entitlements";

const enforceAgentApiPlan = async (user: AuthenticatedUser): Promise<void> => {
  if (!user.saveMeApiKey) return;
  assertAgentApiAccess(await readUserEntitlements(user.uid));
};

const authorizeAgentRequest = async (user: AuthenticatedUser, res: functions.Response): Promise<boolean> => {
  try {
    await enforceAgentApiPlan(user);
    return true;
  } catch (error) {
    if (sendEntitlementError(res, error)) return false;
    throw error;
  }
};

export const sharedMemoryAgentStatus = functions.https.onRequest(
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
    if (!await authorizeAgentRequest(user, res)) return;

    res.json({
      ok: true,
      user_id: user.uid,
      auth_type: user.saveMeApiKey ? "agent_api_key" : "firebase_user",
      key: user.saveMeApiKey ? {
        id: user.saveMeApiKey.id || null,
        name: user.saveMeApiKey.name || null,
        prefix: user.saveMeApiKey.prefix || null,
        permissions: user.saveMeApiKey.permissions,
      } : null,
      capabilities: {
        read: hasPermission(user, "read"),
        write: hasPermission(user, "write"),
        endpoints: [
          "sharedMemoryAgentStatus",
          "sharedMemoryCreateAgentKey",
          "sharedMemoryCreate",
          "sharedMemoryBatchCreate",
          "sharedMemorySearch",
          "sharedMemoryList",
          "sharedMemoryGet",
          "sharedMemoryUpdate",
        ],
      },
    });
  })
);

export const sharedMemoryCreateAgentKey = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const user = await verifyAuth(req);
    if (!user || user.saveMeApiKey) {
      res.status(401).json({error: "Firebase user session required"});
      return;
    }

    try {
      assertAgentApiAccess(await readUserEntitlements(user.uid));
    } catch (error) {
      if (sendEntitlementError(res, error)) return;
      throw error;
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      res.status(400).json({error: "name is required"});
      return;
    }

    const apiKey = generateAgentApiKey();
    const keyHash = hashAgentApiKey(apiKey);
    const keyPrefix = `${apiKey.substring(0, 10)}...`;
    const permissions = normalizeAgentPermissions(req.body?.permissions);
    const agentType = typeof req.body?.agent_type === "string" ? req.body.agent_type : "custom";
    const agentSource = typeof req.body?.agent_source === "string" ? req.body.agent_source : "custom_agent";

    try {
      const docRef = await admin.firestore().collection("api_keys").add({
        user_id: user.uid,
        name,
        agent_type: agentType,
        agent_source: agentSource,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        is_active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        ok: true,
        api_key: apiKey,
        key: {
          id: docRef.id,
          name,
          key_prefix: keyPrefix,
          permissions,
          is_active: true,
        },
      });
    } catch (error) {
      console.error("sharedMemoryCreateAgentKey error:", error);
      res.status(500).json({error: "Failed to create agent API key"});
    }
  })
);

export const sharedMemoryCreate = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    if (!requirePermission(user, "write", res)) return;
    if (!await authorizeAgentRequest(user, res)) return;

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const input = req.body as SharedMemoryCreateInput;
    try {
      assertUtf8Bytes(input, SERVICE_CAPS.requestBytes);
      assertStringCap(input?.title, SERVICE_CAPS.textChars, "title");
      assertStringCap(input?.content, SERVICE_CAPS.textChars, "content");
      await enforceAbuseControls({endpoint: "sharedMemoryCreate", user, req, policies: SERVICE_QUOTAS.sharedMemoryCreate});
    } catch (error) {
      if (sendAbuseError(res, error)) return;
      throw error;
    }
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
    if (!requirePermission(user, "read", res)) return;
    if (!await authorizeAgentRequest(user, res)) return;

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const input = (req.body || {}) as SharedMemorySearchInput;
    try {
      // This endpoint is the representative server-owned advanced-search path.
      // Agent-key requests already passed the Premium-only API gate above.
      assertAdvancedSearchAccess(await readUserEntitlements(user.uid));
      assertUtf8Bytes(input, SERVICE_CAPS.requestBytes);
      assertStringCap(input.query, SERVICE_CAPS.searchQueryChars, "query");
      if (typeof input.limit === "number" && input.limit > SERVICE_CAPS.searchLimit) {
        res.status(400).json({error: {code: "INVALID_ARGUMENT", message: `limit must be at most ${SERVICE_CAPS.searchLimit}`}});
        return;
      }
      await enforceAbuseControls({endpoint: "sharedMemorySearch", user, req, policies: SERVICE_QUOTAS.sharedMemorySearch});
    } catch (error) {
      if (sendAbuseError(res, error)) return;
      throw error;
    }

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
    if (!requirePermission(user, "read", res)) return;
    if (!await authorizeAgentRequest(user, res)) return;

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
    if (!requirePermission(user, "read", res)) return;
    if (!await authorizeAgentRequest(user, res)) return;

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
    if (!requirePermission(user, "write", res)) return;
    if (!await authorizeAgentRequest(user, res)) return;

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
    if (!requirePermission(user, "write", res)) return;
    if (!await authorizeAgentRequest(user, res)) return;

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const memories = req.body?.memories as SharedMemoryCreateInput[] | undefined;
    try {
      assertUtf8Bytes(req.body, SERVICE_CAPS.requestBytes);
      assertArrayCap(memories, SERVICE_CAPS.batchItems, "memories");
      if (Array.isArray(memories)) {
        for (const memory of memories) {
          assertStringCap(memory?.title, SERVICE_CAPS.textChars, "memory.title");
          assertStringCap(memory?.content, SERVICE_CAPS.textChars, "memory.content");
        }
      }
      await enforceAbuseControls({endpoint: "sharedMemoryBatchCreate", user, req, policies: SERVICE_QUOTAS.sharedMemoryBatchCreate});
    } catch (error) {
      if (sendAbuseError(res, error)) return;
      throw error;
    }
    if (!Array.isArray(memories) || memories.length === 0) {
      res.status(400).json({error: "memories array is required"});
      return;
    }
    if (memories.length > 50) {
      res.status(400).json({error: "Maximum 50 memories per batch"});
      return;
    }
    if (memories.some((memory) => !memory?.title || !memory?.content || !memory?.type || !memory?.source)) {
      res.status(400).json({error: "Each memory requires title, content, type, and source"});
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
