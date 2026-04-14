import * as admin from "firebase-admin";
import { novaAction, ok, VoiceToolResult } from "../voiceToolResults";
import { createSharedMemory } from "../sharedMemory/create";

interface StoredMemoryRecord {
  id: string;
  content?: string;
  category?: string | null;
  type?: string;
}

interface ScoredMemoryRecord extends StoredMemoryRecord {
  score: number;
}

const toStoredMemoryRecord = (doc: admin.firestore.QueryDocumentSnapshot): StoredMemoryRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    content: typeof data.content === "string" ? data.content : undefined,
    category: typeof data.category === "string" ? data.category : null,
    type: typeof data.type === "string" ? data.type : undefined,
  };
};

export async function handleMemoryTool(
  toolName: string,
  args: Record<string, unknown>,
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

    // Mirror to shared_memories so other agents (Nia, Hermes) can access it
    try {
      const titleStr = typeof args.content === "string" ? args.content : String(args.content);
      await createSharedMemory(userId, {
        title: titleStr.length > 80 ? `${titleStr.slice(0, 77)}...` : titleStr,
        content: titleStr,
        summary: titleStr,
        type: "fact",
        source: "human",
        sourceAgent: "nova",
        createdBy: "rememberFact",
        tags: args.category ? [String(args.category), "explicit-memory"] : ["explicit-memory"],
        project: "save-me",
        confidence: 0.9,
        verification: "agent_suggested",
        visibility: "shared_with_agents",
        metadata: {
          pipeline: "rememberFact",
          nova_memory_id: memDoc.id,
          category: args.category || null,
        },
      }, db);
    } catch (mirrorErr) {
      console.warn("[rememberFact] Shared memory mirror failed:", mirrorErr);
    }

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

    const scored: ScoredMemoryRecord[] = snap.docs
      .map(toStoredMemoryRecord)
      .map((memoryDoc) => {
        const content = memoryDoc.content?.toLowerCase() || "";
        let score = 0.1;
        if (content.includes(query)) score = 1.0;
        else if (queryWords.some((word) => content.includes(word))) score = 0.5;
        return { ...memoryDoc, score };
      })
      .sort((a, b) => b.score - a.score)
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
      memories: scored.map((memoryDoc) => ({ content: memoryDoc.content, category: memoryDoc.category, type: memoryDoc.type })),
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
      if (content.includes(query) || queryWords.every((word) => content.includes(word))) {
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
