import * as admin from "firebase-admin";
import {assertEntryAdmission, assertStorageAdmission, PlanEntitlements} from "./entitlements";

export const countOwnedEntries = async (uid: string, db: admin.firestore.Firestore): Promise<number> => {
  const snapshot = await db.collection("entries").where("user_id", "==", uid).count().get();
  return snapshot.data().count;
};

export const assertEntryCreationAdmission = async (
  uid: string,
  plan: PlanEntitlements,
  requestedEntries: number,
  db: admin.firestore.Firestore
): Promise<void> => {
  if (plan.entryLimit === null) return;
  assertEntryAdmission(plan, await countOwnedEntries(uid, db), requestedEntries);
};

/**
 * Atomically reserves entry quota and creates the entry. `entitlement_usage`
 * is server-owned; its first reservation bootstraps from existing entries for
 * migration. All server entry creators must converge on this helper.
 */
export const createEntryWithAdmission = async (
  uid: string,
  plan: PlanEntitlements,
  entry: Record<string, unknown>,
  db: admin.firestore.Firestore
): Promise<admin.firestore.DocumentReference> => {
  if (entry.user_id !== uid) {
    throw new Error("Entry owner must match the admitted user");
  }

  const entryRef = db.collection("entries").doc();
  if (plan.entryLimit === null) {
    await entryRef.create(entry);
    return entryRef;
  }

  const entryLimit = plan.entryLimit;
  const usageRef = db.collection("entitlement_usage").doc(uid);
  await db.runTransaction(async (transaction) => {
    const usageSnapshot = await transaction.get(usageRef);
    const recorded = usageSnapshot.data()?.entries;
    let used: number;
    if (typeof recorded === "number" && Number.isSafeInteger(recorded) && recorded >= 0) {
      used = recorded;
    } else {
      // Bootstrap inside the transaction. The matching query participates in
      // Firestore's serializable transaction and is retried if a concurrent
      // creator changes its result; an out-of-transaction count can undercount.
      const existingEntries = await transaction.get(
        db.collection("entries").where("user_id", "==", uid).limit(entryLimit + 1)
      );
      used = existingEntries.size;
    }
    assertEntryAdmission(plan, used, 1);
    transaction.set(usageRef, {user_id: uid, entries: used + 1, updated_at: admin.firestore.FieldValue.serverTimestamp()}, {merge: true});
    transaction.create(entryRef, entry);
  });
  return entryRef;
};

export interface StorageUsageRecord {
  total_bytes?: unknown;
  db_bytes_used?: unknown;
  file_bytes_used?: unknown;
}

const safeUsageBytes = (usage: StorageUsageRecord | undefined): number => {
  const explicitTotal = usage?.total_bytes;
  if (typeof explicitTotal === "number" && Number.isSafeInteger(explicitTotal) && explicitTotal >= 0) return explicitTotal;
  const dbBytes = typeof usage?.db_bytes_used === "number" && Number.isSafeInteger(usage.db_bytes_used) && usage.db_bytes_used >= 0 ? usage.db_bytes_used : 0;
  const fileBytes = typeof usage?.file_bytes_used === "number" && Number.isSafeInteger(usage.file_bytes_used) && usage.file_bytes_used >= 0 ? usage.file_bytes_used : 0;
  return dbBytes + fileBytes;
};

export const assertStorageUploadAdmission = async (
  uid: string,
  plan: PlanEntitlements,
  requestedBytes: number,
  db: admin.firestore.Firestore
): Promise<{usedBytes: number; limitBytes: number}> => {
  const snapshot = await db.collection("storage_usage").doc(uid).get();
  const usedBytes = safeUsageBytes(snapshot.exists ? snapshot.data() : undefined);
  assertStorageAdmission(plan, usedBytes, requestedBytes);
  return {usedBytes, limitBytes: plan.storageLimitBytes};
};
