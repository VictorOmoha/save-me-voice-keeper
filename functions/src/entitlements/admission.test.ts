import {describe, expect, it, vi} from "vitest";
import {createEntryWithAdmission} from "./admission";
import {PLAN_CATALOG} from "./entitlements";

function firestoreHarness(options: {recorded?: unknown; existing?: number} = {}) {
  const entryRef = {id: "entry-1", create: vi.fn()};
  const usageRef = {kind: "usage"};
  const query = {kind: "entries-query", limit: vi.fn()};
  query.limit.mockReturnValue(query);
  const entriesCollection = {doc: vi.fn(() => entryRef), where: vi.fn(() => query)};
  const usageCollection = {doc: vi.fn(() => usageRef)};
  const transaction = {
    get: vi.fn(async (target: unknown) => target === usageRef ? {
      data: () => options.recorded === undefined ? undefined : {entries: options.recorded},
    } : {size: options.existing ?? 0}),
    set: vi.fn(),
    create: vi.fn(),
  };
  const db = {
    collection: vi.fn((name: string) => name === "entries" ? entriesCollection : usageCollection),
    runTransaction: vi.fn(async (handler: (tx: typeof transaction) => unknown) => handler(transaction)),
  };
  return {db: db as any, entryRef, usageRef, query, transaction};
}

describe("createEntryWithAdmission", () => {
  it("rejects caller-supplied owner mismatches before writing", async () => {
    const harness = firestoreHarness();
    await expect(createEntryWithAdmission("owner-1", PLAN_CATALOG.free, {user_id: "other"}, harness.db))
      .rejects.toThrow("Entry owner must match the admitted user");
    expect(harness.db.runTransaction).not.toHaveBeenCalled();
  });

  it("bootstraps the existing-entry count inside the quota transaction", async () => {
    const harness = firestoreHarness({existing: 12});
    await createEntryWithAdmission("owner-1", PLAN_CATALOG.free, {user_id: "owner-1"}, harness.db);

    expect(harness.query.limit).toHaveBeenCalledWith(PLAN_CATALOG.free.entryLimit! + 1);
    expect(harness.transaction.get).toHaveBeenNthCalledWith(1, harness.usageRef);
    expect(harness.transaction.get).toHaveBeenNthCalledWith(2, harness.query);
    expect(harness.transaction.set).toHaveBeenCalledWith(
      harness.usageRef,
      expect.objectContaining({user_id: "owner-1", entries: 13}),
      {merge: true}
    );
    expect(harness.transaction.create).toHaveBeenCalledWith(harness.entryRef, {user_id: "owner-1"});
  });

  it("uses a valid server ledger without a migration recount", async () => {
    const harness = firestoreHarness({recorded: 7, existing: 40});
    await createEntryWithAdmission("owner-1", PLAN_CATALOG.free, {user_id: "owner-1"}, harness.db);
    expect(harness.transaction.get).toHaveBeenCalledTimes(1);
    expect(harness.transaction.set).toHaveBeenCalledWith(
      harness.usageRef,
      expect.objectContaining({entries: 8}),
      {merge: true}
    );
  });

  it("rejects bootstrap at the Free limit without creating an entry", async () => {
    const harness = firestoreHarness({existing: 50});
    await expect(createEntryWithAdmission("owner-1", PLAN_CATALOG.free, {user_id: "owner-1"}, harness.db))
      .rejects.toMatchObject({code: "ENTRY_QUOTA_EXCEEDED"});
    expect(harness.transaction.create).not.toHaveBeenCalled();
  });
});
