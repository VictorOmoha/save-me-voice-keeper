import * as admin from "firebase-admin";
import { SharedMemorySearchInput } from "./types";

export async function listSharedMemories(
  userId: string,
  input: SharedMemorySearchInput,
  db: admin.firestore.Firestore
) {
  let query: admin.firestore.Query = db.collection("shared_memories")
    .where("user_id", "==", userId)
    .where("status", "==", "active")
    .orderBy("updated_at", "desc");

  if (input.project) query = query.where("project", "==", input.project);
  if (input.types?.length === 1) query = query.where("type", "==", input.types[0]);
  if (input.verification?.length === 1) query = query.where("verification", "==", input.verification[0]);
  if (input.sources?.length === 1) query = query.where("source", "==", input.sources[0]);
  if (input.visibility?.length === 1) query = query.where("visibility", "==", input.visibility[0]);

  const snap = await query.limit(Math.min(input.limit || 20, 50)).get();
  const docs = snap.docs
    .filter((doc) => {
      const data = doc.data();
      if (input.types?.length && !input.types.includes(data.type)) return false;
      if (input.verification?.length && !input.verification.includes(data.verification)) return false;
      if (input.sources?.length && !input.sources.includes(data.source)) return false;
      if (input.visibility?.length && !input.visibility.includes(data.visibility)) return false;
      return true;
    })
    .map((doc) => ({ id: doc.id, ...doc.data() }));

  return docs;
}
