import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type * as functions from "firebase-functions";

const mocks = vi.hoisted(() => ({firestore: vi.fn(), verifyAuth: vi.fn(), execute: vi.fn(), quota: vi.fn()}));
vi.mock("firebase-functions", () => ({runWith: () => ({https: {onRequest: (handler: unknown) => handler}})}));
vi.mock("../common/http", () => ({withCors: (handler: unknown) => handler}));
vi.mock("../common/auth", () => ({verifyAuth: mocks.verifyAuth}));
vi.mock("./toolExecutor", () => ({executeVoiceTool: mocks.execute}));
vi.mock("firebase-admin", () => ({firestore: Object.assign(mocks.firestore, {FieldValue: {serverTimestamp: () => "now"}})}));
vi.mock("../common/abuseControl", async (original) => ({
  ...await original<typeof import("../common/abuseControl")>(), enforceAbuseControls: mocks.quota,
}));
import {callIdFromLocation, voiceRealtimeSession, voiceRealtimeTool, voiceRealtimeEnd} from "./realtime";
import {REALTIME_MODEL, REALTIME_TOOLS} from "./realtimeConfig";

const id = "12345678-1234-4321-9876-123456789abc";
const docs = new Map<string, Record<string, unknown>>();
const fetchMock = vi.fn();
const snap = (key: string) => ({exists: docs.has(key), data: () => docs.get(key)});
const ref = (key: string) => ({key, get: async () => snap(key), update: async (data: object) => { docs.set(key, {...docs.get(key), ...data}); }});
async function request(handler: typeof voiceRealtimeSession, body: object, method = "POST") {
  const res = {status: vi.fn().mockReturnThis(), json: vi.fn(), set: vi.fn()};
  await handler({method, body} as functions.https.Request, res as unknown as functions.Response);
  return res;
}
const active = (extra = {}) => docs.set(`nova_conversations/${id}`, {
  user_id: "alice", transport: "openai-realtime", status: "active", expires_at_ms: Date.now() + 60_000,
  call_id: "rtc_test", processed_calls: [], ...extra,
});
const tool = {sessionId: id, callId: "call_1", name: "saveEntry", args: {title: "test", content: "test"}};

describe("Realtime voice boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks(); docs.clear();
    vi.stubEnv("OPENAI_API_KEY", "server-secret");
    vi.stubGlobal("fetch", fetchMock);
    mocks.verifyAuth.mockResolvedValue({uid: "alice", name: "Alice"});
    mocks.execute.mockResolvedValue({success: true, data: {id: "entry_1"}});
    mocks.quota.mockResolvedValue(undefined);
    let lock = Promise.resolve();
    const db = {
      collection: (collection: string) => ({doc: (doc: string) => ref(`${collection}/${doc}`)}),
      runTransaction: (fn: (tx: unknown) => Promise<unknown>) => {
        const result = lock.then(() => fn({
          get: async (r: {key: string}) => snap(r.key),
          create: (r: {key: string}, data: Record<string, unknown>) => docs.set(r.key, data),
          update: (r: {key: string}, data: object) => docs.set(r.key, {...docs.get(r.key), ...data}),
        }));
        lock = result.then(() => undefined, () => undefined);
        return result;
      },
    };
    mocks.firestore.mockReturnValue(db);
    fetchMock.mockImplementation(async (url: string) => url.endsWith("/hangup") ? new Response(null, {status: 200}) :
      new Response("v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111", {status: 201, headers: {location: "/v1/realtime/calls/rtc_test"}}));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each([voiceRealtimeSession, voiceRealtimeTool, voiceRealtimeEnd])("requires Firebase authentication", async (handler) => {
    mocks.verifyAuth.mockResolvedValue(null);
    expect((await request(handler, {})).status).toHaveBeenCalledWith(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("uses the current model and semantic interruption, retaining tools without exposing the key", async () => {
    const res = await request(voiceRealtimeSession, {sessionId: id, sdp: "v=0\r\nm=audio 9 test", model: "attacker-model"});
    const sent = fetchMock.mock.calls[0][1];
    const config = JSON.parse(sent.body.get("session"));
    expect(config.model).toBe(REALTIME_MODEL);
    expect(config.audio.input.turn_detection).toMatchObject({type: "semantic_vad", interrupt_response: true});
    expect(config.audio.input.transcription.model).toBe("gpt-transcribe");
    expect(config.audio.output.voice).toBe("marin");
    expect(config.tools).toHaveLength(REALTIME_TOOLS.length);
    expect(config.tools[0].parameters.type).toBe("object");
    expect(config.tools[0].parameters.properties.route.type).toBe("string");
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("server-secret");
    expect(docs.get(`nova_conversations/${id}`)?.user_id).toBe("alice");
  });
  it.each([{user_id: "bob"}, {expires_at_ms: 0}, {status: "ended"}, {transport: "legacy"}])("rejects unavailable or foreign sessions before a tool executes: %s", async (extra) => {
    active(extra);
    const res = await request(voiceRealtimeTool, tool);
    expect(res.status).toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("claims concurrent duplicate writes once, with the authenticated owner", async () => {
    active();
    const results = await Promise.all([request(voiceRealtimeTool, tool), request(voiceRealtimeTool, tool)]);
    expect(mocks.execute).toHaveBeenCalledExactlyOnceWith("saveEntry", tool.args, "alice");
    expect(results.some((res) => res.status.mock.calls.some(([code]) => code === 409))).toBe(true);
  });
  it("does not retry a write after an uncertain failure", async () => {
    active(); mocks.execute.mockRejectedValue(new Error("transport failure"));
    expect((await request(voiceRealtimeTool, tool)).status).toHaveBeenCalledWith(503);
    expect((await request(voiceRealtimeTool, tool)).status).toHaveBeenCalledWith(409);
    expect(mocks.execute).toHaveBeenCalledOnce();
  });
  it("rejects unknown tools and oversized requests", async () => {
    active();
    expect((await request(voiceRealtimeTool, {...tool, name: "adminDeleteUser"})).status).toHaveBeenCalledWith(400);
    expect((await request(voiceRealtimeTool, {...tool, args: {text: "x".repeat(65_000)}})).status).toHaveBeenCalledWith(413);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("stops owned sessions and denies foreign hangups", async () => {
    active({user_id: "bob"});
    expect((await request(voiceRealtimeEnd, {sessionId: id})).status).toHaveBeenCalledWith(404);
    expect(fetchMock).not.toHaveBeenCalled();
    active();
    await request(voiceRealtimeEnd, {sessionId: id});
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.openai.com/v1/realtime/calls/rtc_test/hangup");
    expect(docs.get(`nova_conversations/${id}`)?.status).toBe("ended");
  });
  it("prevents a late connection after Stop", async () => {
    await request(voiceRealtimeEnd, {sessionId: id});
    expect((await request(voiceRealtimeSession, {sessionId: id, sdp: "v=0\r\nm=audio 9 test"})).status).toHaveBeenCalledWith(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("hangs up if Stop arrives during the provider connection", async () => {
    fetchMock.mockImplementationOnce(async () => {
      await request(voiceRealtimeEnd, {sessionId: id});
      return new Response("v=0", {status: 201, headers: {location: "/v1/realtime/calls/rtc_test"}});
    });
    expect((await request(voiceRealtimeSession, {sessionId: id, sdp: "v=0\r\nm=audio 9 test"})).status).toHaveBeenCalledWith(409);
    expect(fetchMock.mock.calls[1][0]).toContain("/rtc_test/hangup");
  });
  it("never accepts provider call identifiers from other origins", () => {
    expect(callIdFromLocation("/v1/realtime/calls/rtc_123")).toBe("rtc_123");
    expect(() => callIdFromLocation("https://evil.test/v1/realtime/calls/rtc_123")).toThrow();
    expect(() => callIdFromLocation(null)).toThrow();
  });
});
