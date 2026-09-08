import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {verifyAuth} from "../common/auth";
import {withCors} from "../common/http";
import {assertStorageUploadAdmission} from "./admission";
import {EntitlementError, readUserEntitlements, sendEntitlementError} from "./entitlements";

/**
 * Admission contract for SAVE-106's server-mediated upload flow. This does not
 * issue an upload token yet: callers submit the exact object size before upload,
 * and SAVE-106 must atomically reserve these bytes before accepting the object.
 */
export const storageUploadAdmission = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: {code: "UNAUTHENTICATED", message: "Authentication required"}});
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({error: {code: "METHOD_NOT_ALLOWED", message: "POST required"}});
      return;
    }

    const requestedBytes = req.body?.requestedBytes;
    try {
      if (!Number.isSafeInteger(requestedBytes) || requestedBytes < 1) {
        throw new EntitlementError("INVALID_ARGUMENT", "requestedBytes must be a positive safe integer", 400);
      }
      const db = admin.firestore();
      const plan = await readUserEntitlements(user.uid, db);
      const admission = await assertStorageUploadAdmission(user.uid, plan, requestedBytes, db);
      res.json({ok: true, admitted: true, plan: plan.id, requestedBytes, ...admission});
    } catch (error) {
      if (sendEntitlementError(res, error)) return;
      throw error;
    }
  })
);
