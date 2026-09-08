import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {createHash, randomBytes, randomUUID, timingSafeEqual} from "crypto";
import {verifyAuth} from "../common/auth";
import {getChromeExtensionOrigin} from "../common/http";

const ORIGIN = "https://saveme.space";
const SCOPE = ["entries:create", "category:predict"] as const;
const CODE_TTL_MS = 10 * 60_000;
const ACCESS_TTL_MS = 15 * 60_000;
const CREDENTIAL_TTL_MS = 90 * 24 * 60 * 60_000;
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{4}-?[0-9A-HJKMNP-TV-Z]{4}$/;
const INSTANCE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const token = (prefix: string) => `${prefix}${randomBytes(32).toString("base64url")}`;
const equalHash = (a: string, b: string) => {
  const aa = Buffer.from(a, "hex"); const bb = Buffer.from(b, "hex");
  return aa.length === bb.length && timingSafeEqual(aa, bb);
};
const normalizeCode = (value: unknown) => typeof value === "string" ? value.trim().toUpperCase() : "";

function guard(req: functions.https.Request, res: functions.Response, authenticatedWeb = false): boolean {
  if (req.method === "OPTIONS") {
    const origin = req.get("origin");
    if (origin === ORIGIN) {
      res.set("Access-Control-Allow-Origin", ORIGIN);
      res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.status(204).send("");
    } else res.status(403).json({error: "origin_not_allowed"});
    return false;
  }
  const origin = req.get("origin");
  // Extension worker requests have chrome-extension:// origins; secret-bearing
  // exchange endpoints deliberately do not trust that forgeable header.
  if (authenticatedWeb && origin !== ORIGIN) {
    res.status(403).json({error: "origin_not_allowed"}); return false;
  }
  if (origin === ORIGIN) res.set("Access-Control-Allow-Origin", ORIGIN);
  res.set("Cache-Control", "no-store");
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({error: "method_not_allowed"}); return false;
  }
  return true;
}

async function mintAccess(db: admin.firestore.Firestore, credentialId: string, userId: string, instanceId: string) {
  const accessToken = token("sme_a_");
  const expiresAt = Date.now() + ACCESS_TTL_MS;
  await db.collection("extensionAccessTokens").doc(hash(accessToken)).set({credentialId, userId, extensionInstanceId: instanceId, scope: SCOPE, expiresAt, createdAt: Date.now()});
  return {accessToken, accessTokenExpiresAt: Math.floor(expiresAt / 1000)};
}

export const extensionPairingCode = functions.https.onRequest(async (req, res) => {
  if (!guard(req, res, true)) return;
  const user = await verifyAuth(req);
  if (!user) { res.status(401).json({error: "unauthorized"}); return; }
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(8);
  const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  const now = Date.now();
  await admin.firestore().collection("extensionPairingCodes").doc(hash(raw)).set({userId: user.uid, email: user.email || "", codeHash: hash(raw), createdAt: now, expiresAt: now + CODE_TTL_MS, usedAt: null});
  res.json({code, expiresAt: new Date(now + CODE_TTL_MS).toISOString()});
});

export const extensionPair = functions.https.onRequest(async (req, res) => {
  if (!guard(req, res)) return;
  const code = normalizeCode(req.body?.code);
  const instanceId = req.body?.extensionInstanceId;
  const client = req.body?.client;
  if (!CODE_RE.test(code) || typeof instanceId !== "string" || !INSTANCE_RE.test(instanceId) || typeof client !== "string" || !/^chrome-mv3\/\d+\.\d+\.\d+$/.test(client)) {
    res.status(400).json({error: "malformed_request"}); return;
  }
  const raw = code.replace("-", ""); const codeHash = hash(raw); const db = admin.firestore();
  const codeRef = db.collection("extensionPairingCodes").doc(codeHash);
  const credentialId = `extcred_${randomUUID()}`; const refreshToken = token("sme_r_"); const now = Date.now();
  let account: {userId: string; email: string} | undefined;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(codeRef); const data = snap.data();
      if (!data || !equalHash(data.codeHash || "", codeHash) || data.usedAt || data.expiresAt <= now) throw new Error("invalid_code");
      account = {userId: data.userId, email: data.email || ""};
      tx.update(codeRef, {usedAt: now});
      tx.set(db.collection("extensionCredentials").doc(credentialId), {userId: data.userId, extensionInstanceId: instanceId, scope: SCOPE, refreshTokenHash: hash(refreshToken), createdAt: now, lastUsedAt: now, expiresAt: now + CREDENTIAL_TTL_MS, revokedAt: null, client});
    });
  } catch { res.status(401).json({error: "invalid_or_expired_code"}); return; }
  const access = await mintAccess(db, credentialId, account!.userId, instanceId);
  res.json({credentialId, refreshToken, ...access, scope: SCOPE, account});
});

export const extensionRefresh = functions.https.onRequest(async (req, res) => {
  if (!guard(req, res)) return;
  const {credentialId, refreshToken, extensionInstanceId} = req.body || {};
  if (typeof credentialId !== "string" || typeof refreshToken !== "string" || !refreshToken.startsWith("sme_r_") || typeof extensionInstanceId !== "string") {
    res.status(400).json({error: "malformed_request"}); return;
  }
  const db = admin.firestore(); const ref = db.collection("extensionCredentials").doc(credentialId); const rotated = token("sme_r_"); const now = Date.now(); let userId = "";
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref); const data = snap.data();
      if (!data || data.revokedAt || data.expiresAt <= now || data.extensionInstanceId !== extensionInstanceId || !equalHash(data.refreshTokenHash || "", hash(refreshToken))) throw new Error("invalid");
      userId = data.userId; tx.update(ref, {refreshTokenHash: hash(rotated), lastUsedAt: now});
    });
  } catch { res.status(401).json({error: "credential_revoked_or_expired"}); return; }
  const access = await mintAccess(db, credentialId, userId, extensionInstanceId);
  res.json({...access, refreshToken: rotated, scope: SCOPE});
});

export const extensionRevoke = functions.https.onRequest(async (req, res) => {
  if (!guard(req, res)) return;
  const {credentialId, refreshToken} = req.body || {}; const user = await verifyAuth(req); const db = admin.firestore();
  if (typeof credentialId !== "string") { res.status(400).json({error: "malformed_request"}); return; }
  const ref = db.collection("extensionCredentials").doc(credentialId); const snap = await ref.get(); const data = snap.data();
  const owner = user && data?.userId === user.uid;
  const holder = typeof refreshToken === "string" && data && equalHash(data.refreshTokenHash || "", hash(refreshToken));
  if (!data || (!owner && !holder)) { res.status(401).json({error: "unauthorized"}); return; }
  await ref.update({revokedAt: Date.now(), refreshTokenHash: null}); res.json({success: true});
});

export const extensionRevokeAll = functions.https.onRequest(async (req, res) => {
  if (!guard(req, res, true)) return;
  const user = await verifyAuth(req); if (!user) { res.status(401).json({error: "unauthorized"}); return; }
  const db = admin.firestore(); const snaps = await db.collection("extensionCredentials").where("userId", "==", user.uid).get(); const batch = db.batch();
  snaps.forEach((snap) => batch.update(snap.ref, {revokedAt: Date.now(), refreshTokenHash: null})); await batch.commit(); res.json({success: true, revoked: snaps.size});
});

export async function verifyExtensionAccess(req: functions.https.Request, requiredScope: typeof SCOPE[number]) {
  if (!getChromeExtensionOrigin(req.get("origin"))) return null;
  const match = /^Bearer (sme_a_[A-Za-z0-9_-]+)$/.exec(req.get("authorization") || ""); if (!match) return null;
  const db = admin.firestore(); const accessSnap = await db.collection("extensionAccessTokens").doc(hash(match[1])).get(); const access = accessSnap.data();
  if (!access || access.expiresAt <= Date.now() || !access.scope?.includes(requiredScope)) return null;
  const credential = (await db.collection("extensionCredentials").doc(access.credentialId).get()).data();
  if (!credential || credential.revokedAt || credential.expiresAt <= Date.now() || credential.extensionInstanceId !== access.extensionInstanceId || !credential.scope?.includes(requiredScope)) return null;
  return {uid: credential.userId, credentialId: access.credentialId};
}
