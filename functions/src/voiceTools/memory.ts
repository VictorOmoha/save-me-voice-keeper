import * as admin from "firebase-admin";
import { novaAction, ok, VoiceToolResult } from "../voiceToolResults";

export async function handleMemoryTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
  db: admin.firestore.Firestore,
  rebuildMemoryProfile: (userId: string, db: admin.firestore.Firestore) => Promise<void>
): Promise<VoiceToolResult | null> {
  const memoriesRef = db.collection("nova_memories");

  switch (toolName) {
  case "rememberFact": {
    if (args.overrides) {
      const existingSnap = await memoriesRef
        .where("user_id", "==", userId)
        .where("active", "==", true)
        .orderBy("updated_at", "desc")
        .limit(30)
        .get();

      const overrideText = (args.overrides as string).toLowerCase();
      for (const d of existingSnap.docs) {
        const content = (d.data().content || "").toLowerCase();
        if (content.includes(overrideText.substring(0, Math.min(20, overrideText.length)))) {
          await d.ref.update({active: false, superseded_by: "pending", updated_at: admin.firestore.FieldValue.serverTimestamp()});
          break;
        }
      }
    }

    const memDoc = await memoriesRef.add({
      user_id: userId,
      type: "fact",
      content: args.content,
      category: args.category || null,
      source: "explicit",
      confidence: 0.9,
      access_count: 0,
      last_accessed: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      superseded_by: null,
      active: true,
    });

    await rebuildMemoryProfile(userId, db);
    return novaAction("remember", { content: args.content, category: args.category || null }, {
      memoryId: memDoc.id,
      content: args.content,
      category: args.category || null,
    });
  }

  case "recallMemories": {
    let q: admin.firestore.Query = memoriesRef
      .where("user_id", "==", userId)
      .where("active", "==", true);

    if (args.category) {
      q = q.where("category", "==", args.category);
    }

    const snap = await q.orderBy("updated_at", "desc").limit(30).get();
    const query = ((args.query as string) || "").toLowerCase();
    const queryWords = query.split(/\s+/).filter((w) => w.length > 2);

    const scored = snap.docs
      .map((d) => ({id: d.id, ...(d.data() as any)}))
      .map((mem: any) => {
        const content = (mem.content || "").toLowerCase();
        let score = 0.1;
        if (content.includes(query)) score = 1.0;
        else if (queryWords.some((w: string) => content.includes(w))) score = 0.5;
        return {...mem, score};
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    for (const mem of scored) {
      if (mem.score > 0.3) {
        memoriesRef.doc(mem.id).update({
          access_count: admin.firestore.FieldValue.increment(1),
          last_accessed: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {/* non-critical */});
      }
    }

    return ok({
      memories: scored.map((m: any) => ({content: m.content, category: m.category, type: m.type})),
      count: scored.length,
    });
  }

  case "forgetMemory": {
    const snap = await memoriesRef
      .where("user_id", "==", userId)
      .where("active", "==", true)
      .orderBy("updated_at", "desc")
      .limit(30)
      .get();

    const query = ((args.query as string) || "").toLowerCase();
    const queryWords = query.split(/\s+/).filter((w) => w.length > 2);
    let deactivated = 0;

    for (const d of snap.docs) {
      const content = (d.data().content || "").toLowerCase();
      if (content.includes(query) || queryWords.every((w: string) => content.includes(w))) {
        await d.ref.update({active: false, updated_at: admin.firestore.FieldValue.serverTimestamp()});
        deactivated++;
      }
    }

    if (deactivated > 0) {
      await rebuildMemoryProfile(userId, db);
    }
    return novaAction("forget", { query: args.query, count: deactivated }, {
      deactivated,
      query: args.query,
    });
  }

  default:
    return null;
  }
}
