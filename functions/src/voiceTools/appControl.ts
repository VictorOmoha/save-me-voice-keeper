import * as admin from "firebase-admin";
import { command, fail, VoiceToolResult } from "../voiceToolResults";

export async function handleAppControlTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
  entriesRef: admin.firestore.CollectionReference
): Promise<VoiceToolResult | null> {
  switch (toolName) {
  case "navigateApp":
    return command("navigate", { route: args.route }, { route: args.route });
  case "navigateToCategory":
    return command("navigate", { route: `/category/${encodeURIComponent(args.category)}` }, { category: args.category || null });
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
      const q = args.title.toLowerCase();
      const found = snap.docs
        .map((d) => ({id: d.id, ...(d.data() as any)}))
        .find((e: any) => e.title && e.title.toLowerCase().includes(q));
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
    const allDocs = snap.docs.map((d) => ({id: d.id, ...(d.data() as any)}));
    let toPrint: any[] = [];

    if (args.id) {
      const byId = allDocs.find((e) => e.id === args.id);
      if (byId) toPrint = [byId];
    } else if (args.title) {
      const q = args.title.toLowerCase();
      toPrint = allDocs.filter((e: any) => e.title && e.title.toLowerCase().includes(q));
    } else if (args.category) {
      const cat = args.category.toLowerCase();
      toPrint = allDocs.filter((e: any) => e.fields?.category && e.fields.category.toLowerCase() === cat);
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
