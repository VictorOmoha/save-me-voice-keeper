import * as admin from "firebase-admin";

export async function updateSharedMemory(
  userId: string,
  id: string,
  patch: Record<string, unknown>,
  db: admin.firestore.Firestore
) {
  const ref = db.collection("shared_memories").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return { ok: false, reason: "not_found" };

  const data = doc.data();
  if (!data || data.user_id !== userId) return { ok: false, reason: "forbidden" };

  const allowedPatch: Record<string, unknown> = {};
  const allowedFields = [
    "title",
    "content",
    "summary",
    "tags",
    "people",
    "project",
    "confidence",
    "verification",
    "visibility",
    "status",
    "metadata",
  ];

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      allowedPatch[key] = patch[key];
    }
  }

  allowedPatch.updated_at = admin.firestore.FieldValue.serverTimestamp();
  await ref.update(allowedPatch);
  return { ok: true };
}
