import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {createHash} from "crypto";
import {AuthenticatedUser} from "./auth";

export const SERVICE_CAPS = Object.freeze({
  requestBytes: 1_500_000,
  textChars: 20_000,
  audioBase64Chars: 1_350_000,
  historyTurns: 20,
  batchItems: 50,
  searchQueryChars: 1_000,
  searchLimit: 25,
  ttsTextChars: 5_000,
  demoTtsTextChars: 500,
});

export type AbuseMetric = Readonly<{
  endpoint: string;
  outcome: "allowed" | "throttled" | "rejected";
  reason?: "quota" | "app_check" | "payload";
  principalType: "firebase_user" | "agent_key" | "anonymous";
  policy?: string;
}>;

export interface AbuseMetrics {
  record(metric: AbuseMetric): void;
}

export const NOOP_ABUSE_METRICS: AbuseMetrics = {record: () => undefined};

export interface CounterIncrement {
  count: number;
  expiresAtMs: number;
}

export interface AtomicCounterStore {
  increment(key: string, amount: number, expiresAtMs: number, nowMs: number): Promise<CounterIncrement>;
  prune?(nowMs: number): Promise<void>;
}

interface MemoryCounter { count: number; expiresAtMs: number }

export class InMemoryAtomicCounterStore implements AtomicCounterStore {
  private readonly counters = new Map<string, MemoryCounter>();

  async increment(key: string, amount: number, expiresAtMs: number, nowMs: number): Promise<CounterIncrement> {
    const current = this.counters.get(key);
    const nextCount = !current || current.expiresAtMs <= nowMs ? amount : current.count + amount;
    this.counters.set(key, {count: nextCount, expiresAtMs});
    return {count: nextCount, expiresAtMs};
  }

  async prune(nowMs: number): Promise<void> {
    for (const [key, counter] of this.counters) {
      if (counter.expiresAtMs <= nowMs) this.counters.delete(key);
    }
  }

  get size(): number { return this.counters.size; }
}

export class FirestoreAtomicCounterStore implements AtomicCounterStore {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly collection = "service_abuse_counters"
  ) {}

  async increment(key: string, amount: number, expiresAtMs: number, nowMs: number): Promise<CounterIncrement> {
    const id = createHash("sha256").update(key).digest("hex");
    const ref = this.db.collection(this.collection).doc(id);
    return this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const data = snap.data();
      const oldExpiry = typeof data?.expires_at_ms === "number" ? data.expires_at_ms : 0;
      const oldCount = oldExpiry > nowMs && typeof data?.count === "number" ? data.count : 0;
      const count = oldCount + amount;
      transaction.set(ref, {
        count,
        expires_at_ms: expiresAtMs,
        // Configure a Firestore TTL policy on this field before production rollout.
        expires_at: admin.firestore.Timestamp.fromMillis(expiresAtMs),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {count, expiresAtMs};
    });
  }
}

export interface QuotaPolicy {
  name: string;
  limit: number;
  windowMs: number;
  cost?: number;
}

export interface AbuseRuntime {
  production: boolean;
  emulator: boolean;
  test: boolean;
}

export function detectAbuseRuntime(env: NodeJS.ProcessEnv = process.env): AbuseRuntime {
  return {
    production: env.NODE_ENV === "production" || Boolean(env.K_SERVICE),
    emulator: env.FUNCTIONS_EMULATOR === "true" || Boolean(env.FIREBASE_EMULATOR_HUB),
    test: env.NODE_ENV === "test" || env.VITEST === "true",
  };
}

export interface AppCheckVerifier {
  verifyToken(token: string): Promise<unknown>;
}

export function isAppCheckEnforcementEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.APP_CHECK_ENFORCEMENT_ENABLED?.trim().toLowerCase() === "true";
}

export class AbuseControlError extends Error {
  constructor(
    public readonly code: "APP_CHECK_REQUIRED" | "APP_CHECK_INVALID" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "INVALID_ARGUMENT",
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
    public readonly limit?: number
  ) { super(message); }
}

export function principalIdentity(user: AuthenticatedUser): {key: string; type: "firebase_user" | "agent_key"} {
  if (!user.saveMeApiKey) return {key: `user:${user.uid}`, type: "firebase_user"};
  const stableKey = user.saveMeApiKey.id || user.saveMeApiKey.prefix || `${user.iss}:${user.uid}`;
  return {key: `agent:${stableKey}`, type: "agent_key"};
}

export function assertUtf8Bytes(value: unknown, maxBytes: number, field = "request"): void {
  const bytes = Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value ?? null), "utf8");
  if (bytes > maxBytes) {
    throw new AbuseControlError("PAYLOAD_TOO_LARGE", `${field} exceeds ${maxBytes} bytes`, 413, undefined, maxBytes);
  }
}

export function assertStringCap(value: unknown, maxChars: number, field: string): void {
  if (typeof value === "string" && value.length > maxChars) {
    throw new AbuseControlError("PAYLOAD_TOO_LARGE", `${field} exceeds ${maxChars} characters`, 413, undefined, maxChars);
  }
}

export function assertArrayCap(value: unknown, maxItems: number, field: string): void {
  if (Array.isArray(value) && value.length > maxItems) {
    throw new AbuseControlError("PAYLOAD_TOO_LARGE", `${field} exceeds ${maxItems} items`, 413, undefined, maxItems);
  }
}

export interface EnforceAbuseOptions {
  endpoint: string;
  user: AuthenticatedUser;
  req: functions.https.Request;
  policies: QuotaPolicy[];
  store?: AtomicCounterStore;
  metrics?: AbuseMetrics;
  runtime?: AbuseRuntime;
  appCheckVerifier?: AppCheckVerifier;
  appCheckEnforcementEnabled?: boolean;
  nowMs?: number;
}

let defaultStore: AtomicCounterStore | undefined;
function getDefaultStore(): AtomicCounterStore {
  if (!defaultStore) defaultStore = new FirestoreAtomicCounterStore(admin.firestore());
  return defaultStore;
}

export async function enforceAbuseControls(options: EnforceAbuseOptions): Promise<void> {
  const runtime = options.runtime || detectAbuseRuntime();
  const metrics = options.metrics || NOOP_ABUSE_METRICS;
  const principal = principalIdentity(options.user);
  const nowMs = options.nowMs ?? Date.now();

  // Roll out enforcement explicitly only after all first-party clients propagate App Check.
  // Agent keys cannot present Firebase App Check and remain on their distinct stable-key throttle below.
  const appCheckEnforcementEnabled = options.appCheckEnforcementEnabled ?? isAppCheckEnforcementEnabled();
  if (appCheckEnforcementEnabled && principal.type === "firebase_user" && runtime.production && !runtime.emulator && !runtime.test) {
    const rawHeader = options.req.headers["x-firebase-appcheck"];
    const token = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!token) {
      metrics.record({endpoint: options.endpoint, outcome: "rejected", reason: "app_check", principalType: principal.type});
      throw new AbuseControlError("APP_CHECK_REQUIRED", "Firebase App Check token required", 401);
    }
    try {
      const verifier = options.appCheckVerifier || admin.appCheck();
      await verifier.verifyToken(token);
    } catch {
      metrics.record({endpoint: options.endpoint, outcome: "rejected", reason: "app_check", principalType: principal.type});
      throw new AbuseControlError("APP_CHECK_INVALID", "Invalid Firebase App Check token", 401);
    }
  }

  const store = options.store || getDefaultStore();
  for (const policy of options.policies) {
    const windowStart = Math.floor(nowMs / policy.windowMs) * policy.windowMs;
    const expiresAtMs = windowStart + policy.windowMs;
    const counter = await store.increment(
      `${principal.key}:${options.endpoint}:${policy.name}:${windowStart}`,
      policy.cost || 1,
      expiresAtMs,
      nowMs
    );
    if (counter.count > policy.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((expiresAtMs - nowMs) / 1000));
      metrics.record({endpoint: options.endpoint, outcome: "throttled", reason: "quota", principalType: principal.type, policy: policy.name});
      throw new AbuseControlError("RATE_LIMITED", "Service rate limit exceeded", 429, retryAfterSeconds, policy.limit);
    }
  }
  metrics.record({endpoint: options.endpoint, outcome: "allowed", principalType: principal.type});
}

export function sendAbuseError(res: functions.Response, error: unknown): boolean {
  if (!(error instanceof AbuseControlError)) return false;
  if (error.retryAfterSeconds) res.set("Retry-After", String(error.retryAfterSeconds));
  res.status(error.status).json({
    error: {code: error.code, message: error.message},
    retryable: error.status === 429,
    retryAfterSeconds: error.retryAfterSeconds,
    limit: error.limit,
  });
  return true;
}

export const SERVICE_QUOTAS: Record<string, QuotaPolicy[]> = Object.freeze({
  transcribeAudio: [{name: "burst", limit: 6, windowMs: 60_000}, {name: "sustained", limit: 60, windowMs: 3_600_000}],
  voiceAgent: [{name: "burst", limit: 12, windowMs: 60_000}, {name: "sustained", limit: 180, windowMs: 3_600_000}],
  quickSave: [{name: "burst", limit: 30, windowMs: 60_000}, {name: "sustained", limit: 500, windowMs: 3_600_000}],
  enhanceBrainDump: [{name: "burst", limit: 10, windowMs: 60_000}, {name: "sustained", limit: 100, windowMs: 3_600_000}],
  sharedMemoryCreate: [{name: "burst", limit: 30, windowMs: 60_000}, {name: "sustained", limit: 500, windowMs: 3_600_000}],
  sharedMemorySearch: [{name: "burst", limit: 60, windowMs: 60_000}, {name: "sustained", limit: 1_000, windowMs: 3_600_000}],
  sharedMemoryBatchCreate: [{name: "burst", limit: 10, windowMs: 60_000}, {name: "sustained", limit: 100, windowMs: 3_600_000}],
  tts: [{name: "burst", limit: 12, windowMs: 60_000}, {name: "sustained", limit: 120, windowMs: 3_600_000}],
  demoTts: [{name: "burst", limit: 10, windowMs: 60_000}],
});
