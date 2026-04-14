import * as admin from "firebase-admin";
import { SharedMemorySearchInput } from "./types";

function scoreMemory(doc: admin.firestore.QueryDocumentSnapshot, query: string, preferredProject?: string | null) {
  const data = doc.data();
  const title = String(data.title || "").toLowerCase();
  const content = String(data.content || "").toLowerCase();
  const type = String(data.type || "");
  const verification = String(data.verification || "");
  const project = String(data.project || "");

  let score = 0;
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  if (!q) score += 0.1;
  if (q && title.includes(q)) score += 3;
  if (q && content.includes(q)) score += 2;
  if (words.some((word) => title.includes(word))) score += 1.5;
  if (words.some((word) => content.includes(word))) score += 1;

  if (["preference", "decision", "project_context"].includes(type)) score += 0.5;
  if (verification === "human_confirmed") score += 1;
  if (preferredProject && project && preferredProject.toLowerCase() === project.toLowerCase()) score += 1;

  return score;
}

export async function searchSharedMemories(
  userId: string,
  input: SharedMemorySearchInput,
  db: admin.firestore.Firestore
) {
  let query: admin.firestore.Query = db.collection("shared_memories")
    .where("user_id", "==", userId)
    .where("status", "==", "active")
    .orderBy("updated_at", "desc");

  if (input.project) {
    query = query.where("project", "==", input.project);
  } else if (input.types?.length === 1) {
    query = query.where("type", "==", input.types[0]);
  } else if (input.verification?.length === 1) {
    query = query.where("verification", "==", input.verification[0]);
  } else if (input.sources?.length === 1) {
    query = query.where("source", "==", input.sources[0]);
  } else if (input.visibility?.length === 1) {
    query = query.where("visibility", "==", input.visibility[0]);
  }

  const snap = await query.limit(Math.min(input.limit || 10, 25)).get();

  const filtered = snap.docs.filter((doc) => {
    const data = doc.data();
    if (input.types?.length && !input.types.includes(data.type)) return false;
    if (input.verification?.length && !input.verification.includes(data.verification)) return false;
    if (input.sources?.length && !input.sources.includes(data.source)) return false;
    if (input.visibility?.length && !input.visibility.includes(data.visibility)) return false;
    return true;
  });

  const ranked = filtered
    .map((doc) => ({ doc, score: scoreMemory(doc, input.query || "", input.project) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit || 10)
    .map(({ doc, score }) => ({ id: doc.id, score, ...doc.data() }));

  for (const result of ranked) {
    db.collection("shared_memories").doc(result.id).update({
      access_count: admin.firestore.FieldValue.increment(1),
      last_accessed_at: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => undefined);
  }

  return ranked;
}
