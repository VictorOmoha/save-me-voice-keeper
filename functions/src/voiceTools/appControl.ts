import * as admin from "firebase-admin";
import { command, fail, VoiceToolResult } from "../voiceToolResults";

interface EntryRecord {
  id: string;
  title?: string;
  fields?: Record<string, unknown>;
}

const toEntryRecord = (doc: admin.firestore.QueryDocumentSnapshot): EntryRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : undefined,
    fields: data.fields && typeof data.fields === "object" ? data.fields as Record<string, unknown> : undefined,
  };
};

export async function handleAppControlTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  entriesRef: admin.firestore.CollectionReference
): Promise<VoiceToolResult | null> {
  switch (toolName) {
  case "navigateApp":
    return command("navigate", { route: args.route }, { route: args.route });
  case "navigateToCategory": {
    const category = typeof args.category === "string" ? args.category : "";
    return command("navigate", { route: `/category/${encodeURIComponent(category)}` }, { category: category || null });
  }
  case "openEntryForm":
    return command("openEntryForm", { category: args.category || null }, { category: args.category || null });
  case "closeEntry":
    return command("goBack");
  case "scrollPage":
    return command("scrollPage", { direction: args.direction || "down" }, { direction: args.direction || "down" });
  case "startBrainDump":
    return command("startBrainDump");
  case "processBrainDump":
    return command("processBrainDump");
  case "saveBrainDump":
    return command("saveBrainDump", { category: args.category || null }, { category: args.category || null });
  case "openEntry": {
    let resolvedId = args.id || null;
    if (!resolvedId && args.title) {
      const snap = await entriesRef
        .where("user_id", "==", userId)
        .orderBy("updated_at", "desc")
        .limit(30)
        .get();
      const q = typeof args.title === "string" ? args.title.toLowerCase() : "";
      const found = snap.docs
        .map(toEntryRecord)
        .find((entry) => entry.title?.toLowerCase().includes(q));
      if (found) resolvedId = found.id;
    }
    return command("openEntry", { id: resolvedId, title: args.title || null }, { id: resolvedId, title: args.title || null });
  }
  case "printEntry": {
    const snap = await entriesRef
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(50)
      .get();
    const allDocs = snap.docs.map(toEntryRecord);
    let toPrint: EntryRecord[] = [];

    if (args.id) {
      const byId = allDocs.find((e) => e.id === args.id);
      if (byId) toPrint = [byId];
    } else if (args.title) {
      const q = typeof args.title === "string" ? args.title.toLowerCase() : "";
      toPrint = allDocs.filter((entry) => entry.title?.toLowerCase().includes(q));
    } else if (args.category) {
      const cat = typeof args.category === "string" ? args.category.toLowerCase() : "";
      toPrint = allDocs.filter((entry) => typeof entry.fields?.category === "string" && entry.fields.category.toLowerCase() === cat);
    }

    if (toPrint.length === 0) {
      return fail("No entries found to print");
    }

    const entries = toPrint.map((e) => ({id: e.id, title: e.title, fields: e.fields || {}, category: e.fields?.category}));
    return command("printEntry", { entries }, { entries, count: toPrint.length });
  }
  default:
    return null;
  }
}
