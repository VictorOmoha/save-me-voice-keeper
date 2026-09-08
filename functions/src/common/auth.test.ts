import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type * as functions from "firebase-functions";

const mocks = vi.hoisted(() => ({firestore: vi.fn(), verifyIdToken: vi.fn()}));
vi.mock("firebase-admin", () => ({
  firestore: Object.assign(mocks.firestore, {FieldValue: {serverTimestamp: () => "now"}}),
  auth: () => ({verifyIdToken: mocks.verifyIdToken}),
}));

import {hasPermission, verifyAuth} from "./auth";

const request = (token: string) => ({headers: {authorization: `Bearer ${token}`}} as functions.https.Request);

describe("authentication scope", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects agent credentials on account endpoints before querying Firestore", async () => {
    expect(await verifyAuth(request("sm_read_only"))).toBeNull();
    expect(mocks.firestore).not.toHaveBeenCalled();
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
  });

  it("also confines the legacy agent key to endpoints that opt in", async () => {
    vi.stubEnv("AGENT_API_KEY", "legacy-agent-key");
    expect(await verifyAuth(request("legacy-agent-key"))).toBeNull();
    const user = await verifyAuth(request("legacy-agent-key"), {allowAgentKeys: true});
    expect(user?.saveMeApiKey?.permissions).toEqual(["read", "write"]);
  });

  it("retains first-party Firebase session access", async () => {
    mocks.verifyIdToken.mockResolvedValue({uid: "alice"});
    const user = await verifyAuth(request("firebase-token"));
    expect(user?.uid).toBe("alice");
    expect(hasPermission(user!, "write")).toBe(true);
  });

  it.each([["read"], [], ["invalid"]])("does not elevate explicit key permissions %j", async (...permissions) => {
    const query = {
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({empty: false, docs: [{
        id: "key-1",
        data: () => ({user_id: "alice", permissions}),
        ref: {update: vi.fn().mockResolvedValue(undefined)},
      }]}),
    };
    mocks.firestore.mockReturnValue({collection: () => query});
    const user = await verifyAuth(request("sm_example"), {allowAgentKeys: true});
    expect(user?.uid).toBe("alice");
    expect(hasPermission(user!, "write")).toBe(false);
  });
});
