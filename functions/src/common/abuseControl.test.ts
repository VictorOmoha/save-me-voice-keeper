import {describe, expect, it, vi} from "vitest";
import {
  AbuseControlError,
  AbuseMetric,
  assertStringCap,
  enforceAbuseControls,
  InMemoryAtomicCounterStore,
  principalIdentity,
} from "./abuseControl";
import {AuthenticatedUser} from "./auth";

const firebaseUser = (uid = "user-1"): AuthenticatedUser => ({uid} as AuthenticatedUser);
const agentUser = (id: string): AuthenticatedUser => ({
  uid: "owner-1",
  iss: "sm-api-key",
  saveMeApiKey: {id, permissions: ["read", "write"]},
} as AuthenticatedUser);
const req = (appCheck?: string) => ({headers: appCheck ? {"x-firebase-appcheck": appCheck} : {}} as any);
const runtime = {production: false, emulator: false, test: true};
const policy = [{name: "burst", limit: 2, windowMs: 1_000}, {name: "sustained", limit: 3, windowMs: 10_000}];

async function caught(promise: Promise<unknown>): Promise<AbuseControlError> {
  try { await promise; } catch (error) { return error as AbuseControlError; }
  throw new Error("Expected rejection");
}

describe("SAVE-104 abuse controls", () => {
  it("allows traffic under burst and sustained limits", async () => {
    const store = new InMemoryAtomicCounterStore();
    await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store, runtime, nowMs: 100});
    await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store, runtime, nowMs: 200});
  });

  it("blocks bursts and sustained traffic independently", async () => {
    const burstStore = new InMemoryAtomicCounterStore();
    for (const nowMs of [100, 200]) await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store: burstStore, runtime, nowMs});
    expect((await caught(enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store: burstStore, runtime, nowMs: 300}))).code).toBe("RATE_LIMITED");

    const sustainedStore = new InMemoryAtomicCounterStore();
    for (const nowMs of [100, 1_100, 2_100]) await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store: sustainedStore, runtime, nowMs});
    expect((await caught(enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store: sustainedStore, runtime, nowMs: 3_100}))).code).toBe("RATE_LIMITED");
  });

  it("requires valid App Check for Firebase users only in production", async () => {
    const prod = {production: true, emulator: false, test: false};
    const store = new InMemoryAtomicCounterStore();
    expect((await caught(enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store, runtime: prod}))).code).toBe("APP_CHECK_REQUIRED");

    const verifier = {verifyToken: vi.fn().mockRejectedValue(new Error("bad"))};
    expect((await caught(enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req("invalid"), policies: policy, store, runtime: prod, appCheckVerifier: verifier}))).code).toBe("APP_CHECK_INVALID");
  });

  it("keeps emulator/test App Check bypass explicit", async () => {
    await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: policy, store: new InMemoryAtomicCounterStore(), runtime: {production: true, emulator: true, test: false}});
  });

  it("uses stable per-agent-key identities and isolates their throttles", async () => {
    expect(principalIdentity(agentUser("key-a")).key).not.toBe(principalIdentity(agentUser("key-b")).key);
    const store = new InMemoryAtomicCounterStore();
    for (const nowMs of [100, 200]) await enforceAbuseControls({endpoint: "test", user: agentUser("key-a"), req: req(), policies: policy, store, runtime, nowMs});
    await enforceAbuseControls({endpoint: "test", user: agentUser("key-b"), req: req(), policies: policy, store, runtime, nowMs: 300});
    expect((await caught(enforceAbuseControls({endpoint: "test", user: agentUser("key-a"), req: req(), policies: policy, store, runtime, nowMs: 300}))).code).toBe("RATE_LIMITED");
  });

  it("rejects oversized payload fields", () => {
    expect(() => assertStringCap("1234", 3, "text")).toThrowError(expect.objectContaining({code: "PAYLOAD_TOO_LARGE", status: 413}));
  });

  it("returns Retry-After metadata and recovers in the next window", async () => {
    const store = new InMemoryAtomicCounterStore();
    const tiny = [{name: "burst", limit: 1, windowMs: 1_000}];
    await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: tiny, store, runtime, nowMs: 100});
    const error = await caught(enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: tiny, store, runtime, nowMs: 200}));
    expect(error.retryAfterSeconds).toBe(1);
    await enforceAbuseControls({endpoint: "test", user: firebaseUser(), req: req(), policies: tiny, store, runtime, nowMs: 1_001});
  });

  it("prunes expired in-memory counters for bounded retention", async () => {
    const store = new InMemoryAtomicCounterStore();
    await store.increment("old", 1, 100, 0);
    await store.increment("live", 1, 1_000, 0);
    await store.prune(101);
    expect(store.size).toBe(1);
  });

  it("emits content-free metrics", async () => {
    const observed: AbuseMetric[] = [];
    await enforceAbuseControls({
      endpoint: "test",
      user: firebaseUser(),
      req: req(),
      policies: policy,
      store: new InMemoryAtomicCounterStore(),
      runtime,
      metrics: {record: (metric) => observed.push(metric)},
    });
    expect(observed).toEqual([{endpoint: "test", outcome: "allowed", principalType: "firebase_user"}]);
    expect(JSON.stringify(observed)).not.toContain("secret user content");
    expect(Object.keys(observed[0]).sort()).toEqual(["endpoint", "outcome", "principalType"]);
  });
});
