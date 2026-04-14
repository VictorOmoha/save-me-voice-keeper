import * as admin from "firebase-admin";
import { SharedMemoryCreateInput } from "./types";

export async function batchCreateSharedMemories(
  userId: string,
  inputs: SharedMemoryCreateInput[],
  db: admin.firestore.Firestore
) {
  const batch = db.batch();
  const ids: string[] = [];

  for (const input of inputs) {
    const ref = db.collection("shared_memories").doc();
    ids.push(ref.id);
    const now = admin.firestore.FieldValue.serverTimestamp();

    batch.set(ref, {
      user_id: userId,
      title: input.title,
      content: input.content,
      summary: input.summary || null,
      type: input.type,
      source: input.source,
      source_agent: input.sourceAgent || null,
      created_by: input.createdBy || input.source,
      tags: input.tags || [],
      people: input.people || [],
      project: input.project || null,
      confidence: input.confidence ?? null,
      verification: input.verification || "unverified",
      visibility: input.visibility || "private",
      status: "active",
      access_count: 0,
      last_accessed_at: null,
      metadata: input.metadata || {},
      created_at: now,
      updated_at: now,
    });
  }

  await batch.commit();
  return { ids };
}
