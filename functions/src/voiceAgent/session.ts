import type * as admin from "firebase-admin";

// Always check ownership, even when the caller already supplied history.
// Returning null also prevents a missing/foreign ID from being used for writes.
export async function getOwnedConversationSession(
  db: admin.firestore.Firestore,
  userId: string,
  sessionId: string
) {
  const session = await db.collection("nova_conversations").doc(sessionId).get();
  if (!session.exists || session.data()?.user_id !== userId) return null;
  return session;
}
