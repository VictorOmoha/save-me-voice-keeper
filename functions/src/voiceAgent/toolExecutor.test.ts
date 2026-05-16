import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  firestore: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  recordCategorySignal: vi.fn(async () => undefined),
}));

vi.mock("firebase-admin", () => {
  const firestore = mocks.firestore as unknown as (() => unknown) & {
    FieldValue: { serverTimestamp: () => string };
  };
  firestore.FieldValue = { serverTimestamp: mocks.serverTimestamp };
  return { firestore };
});

vi.mock("../entryIntelligence/categoryIntelligence", () => ({
  predictCategory: vi.fn(async () => ({ predicted: "Personal", confidence: 0 })),
  recordCategorySignal: mocks.recordCategorySignal,
}));

vi.mock("../voiceTools/appControl", () => ({
  handleAppControlTool: vi.fn(async () => null),
}));

vi.mock("../voiceTools/settings", () => ({
  handleSettingsTool: vi.fn(async () => null),
}));

vi.mock("../voiceTools/memory", () => ({
  handleMemoryTool: vi.fn(async () => null),
}));

vi.mock("../voiceTools/intelligence", () => ({
  handleIntelligenceTool: vi.fn(async () => null),
}));

vi.mock("./memory", () => ({
  rebuildMemoryProfile: vi.fn(),
}));

import { executeVoiceTool } from "./toolExecutor";

type EntryDocData = Record<string, unknown> | undefined;

function mockEntriesCollection(docData: EntryDocData, exists = true) {
  const update = vi.fn(async () => undefined);
  const deleteEntry = vi.fn(async () => undefined);
  const add = vi.fn(async () => ({ id: "new-entry-id" }));
  const get = vi.fn(async () => ({
    exists,
    data: () => docData,
  }));
  const doc = vi.fn(() => ({ get, update, delete: deleteEntry }));
  const collection = vi.fn(() => ({ doc, add }));

  mocks.firestore.mockReturnValue({ collection });

  return { collection, doc, get, update, deleteEntry, add };
}

describe("executeVoiceTool security boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it("rejects updateEntry when the entry belongs to another user", async () => {
    const entries = mockEntriesCollection({
      user_id: "other-user",
      title: "Private entry",
      fields: { content: "do not touch" },
    });

    const result = await executeVoiceTool("updateEntry", {
      id: "entry-1",
      title: "Attacker update",
    }, "current-user");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Entry not found");
    expect(entries.update).not.toHaveBeenCalled();
  });

  it("rejects deleteEntry when the entry belongs to another user", async () => {
    const entries = mockEntriesCollection({
      user_id: "other-user",
      title: "Private entry",
    });

    const result = await executeVoiceTool("deleteEntry", {
      id: "entry-1",
    }, "current-user");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Entry not found");
    expect(entries.deleteEntry).not.toHaveBeenCalled();
  });

  it("allows updateEntry for the owning user and applies sanitized string bounds", async () => {
    const entries = mockEntriesCollection({
      user_id: "current-user",
      title: "Owned entry",
      category: "Personal",
      fields: { content: "old content", category: "Personal" },
    });

    const result = await executeVoiceTool("updateEntry", {
      id: "entry-1",
      title: "T".repeat(600),
      content: "C".repeat(11_000),
      category: "Work",
    }, "current-user");

    expect(result.success).toBe(true);
    expect(entries.update).toHaveBeenCalledTimes(1);

    const updatePayload = (entries.update.mock.calls as unknown[][])[0][0] as {
      title: string;
      fields: { content: string; category: string };
    };
    expect(updatePayload.title).toHaveLength(500);
    expect(updatePayload.fields.content).toHaveLength(10_000);
    expect(updatePayload.fields.category).toBe("Work");
  });

  it("sanitizes saveEntry title/content while preserving structured fields", async () => {
    const entries = mockEntriesCollection(undefined);

    const result = await executeVoiceTool("saveEntry", {
      title: "T".repeat(600),
      content: "C".repeat(11_000),
      category: "Personal",
      fields: [{ key: "Thought", value: "Keep this structured" }],
    }, "current-user");

    expect(result.success).toBe(true);
    expect(entries.add).toHaveBeenCalledTimes(1);

    const createPayload = (entries.add.mock.calls as unknown[][])[0][0] as {
      title: string;
      fields: Record<string, string>;
      field_definitions: Array<{ id: string; name: string; type: string }>;
      user_id: string;
    };
    expect(createPayload.title).toHaveLength(500);
    expect(createPayload.fields.thought).toBe("Keep this structured");
    expect(createPayload.field_definitions[0]).toEqual({ id: "thought", name: "Thought", type: "text" });
    expect(createPayload.user_id).toBe("current-user");
  });
});
