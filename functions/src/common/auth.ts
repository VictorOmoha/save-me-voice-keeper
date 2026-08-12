import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {hashAgentApiKey, SharedMemoryPermission} from "../sharedMemory/agentKeys";

export type AuthenticatedUser = admin.auth.DecodedIdToken & {
  saveMeApiKey?: {
    id?: string;
    name?: string;
    prefix?: string;
    permissions: SharedMemoryPermission[];
    legacy?: boolean;
    legacyFallback?: boolean;
  };
};

const buildAgentDecodedToken = (
  uid: string,
  issuer: string,
  apiKey?: AuthenticatedUser["saveMeApiKey"]
): AuthenticatedUser => ({
  uid,
  aud: "saveme-f5af0",
  auth_time: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  iss: issuer,
  sub: uid,
  firebase: {identities: {}, sign_in_provider: "agent-key"},
  saveMeApiKey: apiKey,
} as AuthenticatedUser);

export const isProductionRuntime = (env: NodeJS.ProcessEnv = process.env): boolean =>
  env.NODE_ENV === "production" || Boolean(env.K_SERVICE);

export const legacyAgentFallbackAllowed = (
  user: AuthenticatedUser,
  env: NodeJS.ProcessEnv = process.env
): boolean => Boolean(
  user.saveMeApiKey?.legacyFallback &&
  (!isProductionRuntime(env) || env.ALLOW_LEGACY_AGENT_FALLBACK === "true")
);

export const hasPermission = (user: AuthenticatedUser, permission: SharedMemoryPermission) => {
  // Firebase user sessions are first-party and keep full account access.
  if (!user.saveMeApiKey) return true;
  return user.saveMeApiKey.permissions.includes(permission);
};

export const requirePermission = (
  user: AuthenticatedUser,
  permission: SharedMemoryPermission,
  res: functions.Response
) => {
  if (hasPermission(user, permission)) return true;
  res.status(403).json({error: `API key missing ${permission} permission`});
  return false;
};

// Verify Firebase Auth token OR agent API key
export const verifyAuth = async (req: functions.https.Request): Promise<AuthenticatedUser | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];

  // User-minted agent key path — tokens with the "sm_" prefix are looked up in
  // the `api_keys` Firestore collection by their SHA-256 hash and resolve to
  // the owning Firebase user's uid. Users create these from the Settings UI.
  if (token.startsWith("sm_")) {
    try {
      const keyHash = hashAgentApiKey(token);
      const snap = await admin.firestore()
        .collection("api_keys")
        .where("key_hash", "==", keyHash)
        .where("is_active", "==", true)
        .limit(1)
        .get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      const data = doc.data();
      const userId = data.user_id as string | undefined;
      if (!userId) return null;
      const permissions: SharedMemoryPermission[] = Array.isArray(data.permissions) && data.permissions.length > 0
        ? data.permissions.filter((p: unknown): p is SharedMemoryPermission => p === "read" || p === "write")
        : ["read", "write"];
      // Fire-and-forget last-used update; don't block the request on it.
      doc.ref.update({last_used_at: admin.firestore.FieldValue.serverTimestamp()})
        .catch((err) => console.warn("api_keys last_used_at update failed:", err));
      return buildAgentDecodedToken(userId, "sm-api-key", {
        id: doc.id,
        name: data.name || undefined,
        prefix: data.key_prefix || undefined,
        permissions,
      });
    } catch (error) {
      console.error("sm_ key verification failed:", error);
      return null;
    }
  }

  // Legacy global agent API key — kept for existing Nia/OpenClaw integrations.
  // AGENT_USER_ID explicitly binds it to an account whose current plan is
  // enforced. The historical fallback uid remains usable only outside production
  // unless an operator deliberately enables the migration flag.
  const agentApiKey = process.env.AGENT_API_KEY;
  if (agentApiKey && token === agentApiKey) {
    const configuredOwner = process.env.AGENT_USER_ID?.trim();
    const agentUserId = configuredOwner || "nia-openclaw-agent";
    return buildAgentDecodedToken(agentUserId, "agent-key", {
      name: "Legacy OpenClaw agent key",
      permissions: ["read", "write"],
      legacy: true,
      legacyFallback: !configuredOwner,
    });
  }

  try {
    return await admin.auth().verifyIdToken(token) as AuthenticatedUser;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
};

