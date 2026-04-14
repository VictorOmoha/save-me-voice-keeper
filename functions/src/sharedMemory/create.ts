import * as admin from "firebase-admin";
import { SharedMemoryCreateInput } from "./types";

export async function createSharedMemory(
  userId: string,
  input: SharedMemoryCreateInput,
  db: admin.firestore.Firestore
) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const doc = await db.collection("shared_memories").add({
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

  return { id: doc.id };
}
