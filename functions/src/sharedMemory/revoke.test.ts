import {beforeEach, describe, expect, it, vi} from "vitest";
import type * as functions from "firebase-functions";

const mocks = vi.hoisted(() => ({verifyAuth: vi.fn(), firestore: vi.fn()}));
vi.mock("firebase-functions", () => ({https: {onRequest: (handler: unknown) => handler}}));
vi.mock("../common/http", () => ({withCors: (handler: unknown) => handler}));
vi.mock("../common/auth", () => ({verifyAuth: mocks.verifyAuth, hasPermission: vi.fn(), requirePermission: vi.fn()}));
vi.mock("firebase-admin", () => ({firestore: mocks.firestore}));
import {sharedMemoryRevokeAgentKey} from "./functions";

describe("agent key revocation", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["alice", "bob"])("only deletes keys owned by the authenticated user (owner: %s)", async (owner) => {
    mocks.verifyAuth.mockResolvedValue({uid: "alice"});
    const remove = vi.fn();
    const ref = {id: "key-1"};
    mocks.firestore.mockReturnValue({
      collection: () => ({doc: () => ref}),
      runTransaction: async (work: (transaction: unknown) => Promise<unknown>) => work({
        get: async () => ({exists: true, data: () => ({user_id: owner})}), delete: remove,
      }),
    });
    const res = {status: vi.fn().mockReturnThis(), json: vi.fn()};
    await sharedMemoryRevokeAgentKey(
      {method: "POST", body: {id: "key-1"}} as functions.https.Request,
      res as unknown as functions.Response
    );
    if (owner === "alice") {
      expect(remove).toHaveBeenCalledWith(ref);
      expect(res.json).toHaveBeenCalledWith({ok: true});
    } else {
      expect(remove).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    }
  });

  it("does not opt key revocation into agent-key authentication", async () => {
    mocks.verifyAuth.mockResolvedValue(null);
    const req = {method: "POST", body: {id: "key-1"}} as functions.https.Request;
    const res = {status: vi.fn().mockReturnThis(), json: vi.fn()};
    await sharedMemoryRevokeAgentKey(req, res as unknown as functions.Response);
    expect(mocks.verifyAuth).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.firestore).not.toHaveBeenCalled();
  });
});
