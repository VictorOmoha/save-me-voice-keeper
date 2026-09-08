import {describe, expect, it, vi} from "vitest";
import type * as admin from "firebase-admin";
import {getSharedMemory} from "./get";
import {listSharedMemories} from "./list";
import {searchSharedMemories} from "./search";
import {updateSharedMemory} from "./update";

function database(visibility: string, owner = "alice") {
  const update = vi.fn().mockResolvedValue(undefined);
  const record = {
    id: "memory-1", exists: true,
    data: () => ({user_id: owner, visibility, title: "Project notes", content: "Project context", status: "active"}),
    ref: {update},
  };
  const query = {
    where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({docs: [record]}),
    doc: vi.fn(() => ({get: vi.fn().mockResolvedValue(record), update})),
  };
  return {db: {collection: () => query} as unknown as admin.firestore.Firestore, update};
}

describe("shared memory visibility", () => {
  it.each(["private", "shared_with_selected_agents"])("excludes %s records from every agent read path", async (visibility) => {
    const {db, update} = database(visibility);
    expect(await getSharedMemory("alice", "memory-1", db, true)).toBeNull();
    expect(await listSharedMemories("alice", {visibility: ["private"]}, db, true)).toEqual([]);
    expect(await searchSharedMemories("alice", {query: "project"}, db, true)).toEqual([]);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an agent attempt to make a private memory public", async () => {
    const {db, update} = database("private");
    expect(await updateSharedMemory("alice", "memory-1", {visibility: "shared_with_agents"}, db, true))
      .toEqual({ok: false, reason: "forbidden"});
    expect(update).not.toHaveBeenCalled();
  });

  it("lets the owner read private memory and agents read explicitly shared memory", async () => {
    expect(await getSharedMemory("alice", "memory-1", database("private").db)).toMatchObject({id: "memory-1"});
    expect(await getSharedMemory("alice", "memory-1", database("shared_with_agents").db, true)).toMatchObject({id: "memory-1"});
    expect(await getSharedMemory("alice", "memory-1", database("shared_with_agents", "bob").db, true)).toBeNull();
  });
});
