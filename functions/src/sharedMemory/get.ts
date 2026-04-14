import * as admin from "firebase-admin";

export async function getSharedMemory(
  userId: string,
  id: string,
  db: admin.firestore.Firestore
) {
  const doc = await db.collection("shared_memories").doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data || data.user_id !== userId) return null;

  await doc.ref.update({
    access_count: admin.firestore.FieldValue.increment(1),
    last_accessed_at: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(() => undefined);

  return { id: doc.id, ...data };
}
