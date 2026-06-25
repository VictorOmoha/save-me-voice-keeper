import { describe, it, expect } from "vitest";
import { entryMatchesQuery, normalizeSearchText } from "@/utils/entrySearch";
import type { SavedEntry } from "@/types/dashboard";

const makeEntry = (overrides: Partial<SavedEntry>): SavedEntry => ({
  id: "test-id",
  title: "Untitled",
  fields: {},
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

describe("normalizeSearchText", () => {
  it("lowercases and strips diacritics", () => {
    expect(normalizeSearchText("Café RÉSUMÉ")).toBe("cafe resume");
  });
});

describe("entryMatchesQuery", () => {
  it("matches empty queries against everything", () => {
    expect(entryMatchesQuery(makeEntry({}), "")).toBe(true);
    expect(entryMatchesQuery(makeEntry({}), "   ")).toBe(true);
  });

  it("matches in the title regardless of case", () => {
    const entry = makeEntry({ title: "Call the Dentist" });
    expect(entryMatchesQuery(entry, "DENTIST")).toBe(true);
    expect(entryMatchesQuery(entry, "plumber")).toBe(false);
  });

  it("requires every token to match somewhere (token-AND across fields)", () => {
    const entry = makeEntry({
      title: "Call the dentist",
      fields: { notes: "appointment is on Tuesday" },
    });
    expect(entryMatchesQuery(entry, "dentist tuesday")).toBe(true);
    expect(entryMatchesQuery(entry, "dentist friday")).toBe(false);
  });

  it("matches tags, summary, and entities", () => {
    const entry = makeEntry({
      title: "Q3 roadmap",
      tags: ["urgent", "planning"],
      summary: "Discussed budget with Alice",
      entities: ["Alice", "Meridian"],
    });
    expect(entryMatchesQuery(entry, "urgent")).toBe(true);
    expect(entryMatchesQuery(entry, "alice")).toBe(true);
    expect(entryMatchesQuery(entry, "meridian budget")).toBe(true);
  });

  it("matches strings nested inside structured field values", () => {
    const entry = makeEntry({
      title: "Expenses",
      fields: {
        table: {
          headers: ["item", "cost"],
          rows: [["contractor invoice", "1200"]],
        },
      },
    });
    expect(entryMatchesQuery(entry, "contractor")).toBe(true);
    expect(entryMatchesQuery(entry, "1200")).toBe(true);
  });

  it("matches action item text", () => {
    const entry = makeEntry({
      title: "Meeting notes",
      action_items: [
        { text: "follow up with the Meridian client", status: "open" } as never,
      ],
    });
    expect(entryMatchesQuery(entry, "meridian")).toBe(true);
  });

  it("is diacritic-insensitive in both directions", () => {
    const entry = makeEntry({ title: "Café visit with Sárah" });
    expect(entryMatchesQuery(entry, "cafe sarah")).toBe(true);
  });
});
