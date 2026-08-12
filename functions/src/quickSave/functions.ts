import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {withCors} from "../common/http";
import {verifyAuth} from "../common/auth";
import {verifyExtensionAccess} from "../extensionAuth/functions";
import {predictCategory, recordCategorySignal} from "../entryIntelligence/categoryIntelligence";

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SAVE — Lightweight endpoint for browser extension capture
// No TTS, no voice processing — just save + predict category + return fast
// ─────────────────────────────────────────────────────────────────────────────

export const quickSave = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({error: "Method not allowed"}); return; }

    const {title, content, url, pageTitle, dryRun} = req.body;
    const requiredScope = dryRun ? "category:predict" : "entries:create";
    const extensionUser = await verifyExtensionAccess(req, requiredScope);
    const webUser = extensionUser ? null : await verifyAuth(req);
    const user = extensionUser || webUser;
    if (!user) { res.status(401).json({error: "Unauthorized"}); return; }
    if (!title && !content && !pageTitle) {
      res.status(400).json({error: "title, content, or pageTitle required"});
      return;
    }

    const db = admin.firestore();
    const geminiKey = process.env.GEMINI_API_KEY;

    const finalTitle = (title || pageTitle || "Saved from web").slice(0, 200);
    const finalContent = (content || "").slice(0, 5000);
    const sourceUrl = url || null;

    // Category prediction using the same intelligence as Nova
    let category = "Personal";
    let categoryPredicted = false;
    let categoryConfidence = 0;

    if (geminiKey) {
      try {
        const prediction = await predictCategory(user.uid, finalTitle, finalContent, db, geminiKey);
        if (prediction.confidence >= 0.7) {
          category = prediction.predicted;
          categoryPredicted = true;
          categoryConfidence = prediction.confidence;
        }
      } catch (err) {
        console.warn("[quickSave] Category prediction failed:", err);
      }
    }

    // Dry run — just return the prediction, don't save
    if (dryRun) {
      res.json({success: true, category, categoryPredicted, categoryConfidence, dryRun: true});
      return;
    }

    // Build field definitions
    const fields: Record<string, string> = {content: finalContent, category};
    const field_definitions: Array<{id: string; name: string; type: string}> = [{id: "content", name: "Content", type: "textarea"}];
    if (sourceUrl) {
      fields.url = sourceUrl;
      field_definitions.push({id: "url", name: "Source URL", type: "text"});
    }

    const docRef = await db.collection("entries").add({
      title: finalTitle,
      fields,
      field_definitions,
      category,
      user_id: user.uid,
      processed: false,
      source: "browser_extension",
      category_predicted: categoryPredicted,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record signal for category learning
    if (geminiKey) {
      recordCategorySignal(user.uid, finalTitle, finalContent, category, false, db).catch(() => {});
    }

    res.json({
      success: true,
      id: docRef.id,
      title: finalTitle,
      category,
      categoryPredicted,
      categoryConfidence: Math.round(categoryConfidence * 100),
    });
  })
);
