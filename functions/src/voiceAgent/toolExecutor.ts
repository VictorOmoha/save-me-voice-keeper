import * as admin from "firebase-admin";
import {fetchWithRetry} from "../common/fetchWithRetry";
import {predictCategory, recordCategorySignal} from "../entryIntelligence/categoryIntelligence";
import {ok, fail, novaAction} from "../voiceToolResults";
import {handleAppControlTool} from "../voiceTools/appControl";
import {handleSettingsTool} from "../voiceTools/settings";
import {handleMemoryTool} from "../voiceTools/memory";
import {handleIntelligenceTool} from "../voiceTools/intelligence";
import {summarizeToolArgs, validateToolArgs} from "../voiceToolValidation";
import {GEMINI_API} from "./config";
import {rebuildMemoryProfile} from "./memory";

interface StructuredFieldInput {
  key: string;
  value: string;
}

interface EntrySearchRecord {
  id: string;
  title?: string;
  fields?: Record<string, unknown>;
}

export interface ConversationPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

export interface ConversationTurnRecord {
  role: string;
  parts: ConversationPart[];
}

export interface ActionExecutionRecord {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

const isStructuredFieldInput = (value: unknown): value is StructuredFieldInput => {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).key === "string" &&
    typeof (value as Record<string, unknown>).value === "string",
  );
};

const toStructuredFieldInputs = (value: unknown): StructuredFieldInput[] => {
  return Array.isArray(value) ? value.filter(isStructuredFieldInput) : [];
};

const toEntrySearchRecord = (doc: admin.firestore.QueryDocumentSnapshot): EntrySearchRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : undefined,
    fields: data.fields && typeof data.fields === "object" ? data.fields as Record<string, unknown> : undefined,
  };
};

export async function executeVoiceTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const db = admin.firestore();
  const entriesRef = db.collection("entries");

  const validation = validateToolArgs(toolName, args);
  if (!validation.valid) {
    console.warn(`[VoiceTool] Validation failed for ${toolName}`, {
      userId,
      args: summarizeToolArgs(args),
      error: validation.error,
    });
    return fail(validation.error || `Invalid arguments for ${toolName}`);
  }

  // Use the bounded/normalized arguments returned by validation. Without this,
  // validation can pass while the executor still uses overlong or unnormalized
  // model-supplied values.
  const safeArgs = { ...args, ...(validation.sanitizedArgs || {}) };

  console.log(`[VoiceTool] Executing ${toolName}`, {
    userId,
    args: summarizeToolArgs(safeArgs),
  });

  args = safeArgs;

  // ── App control tools — return commands for the frontend to execute ────────
  const appControlResult = await handleAppControlTool(toolName, args, userId, entriesRef);
  if (appControlResult) {
    return appControlResult;
  }

  // ── Vault operations ───────────────────────────────────────────────────────
  switch (toolName) {
  case "saveEntry": {
    let fields: Record<string, string> = {};
    let field_definitions: Array<{ id: string; name: string; type: string }> = [];
    const structuredFields = toStructuredFieldInputs(args.fields);
    const title = typeof args.title === "string" ? args.title : "Untitled";
    const content = typeof args.content === "string" ? args.content : "";
    const requestedCategory = typeof args.category === "string" ? args.category : "";

    if (structuredFields.length > 0) {
      // Structured entry — build fields map + definitions from key-value pairs
      for (const f of structuredFields) {
        const id = f.key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        fields[id] = f.value;
        field_definitions.push({id, name: f.key, type: "text"});
      }
    } else {
      // General content entry
      fields = {content};
      field_definitions = [{id: "content", name: "Content", type: "textarea"}];
    }

    // ── Category Intelligence: predict if not explicitly provided ──────────
    let finalCategory: string = requestedCategory;
    let categoryWasPredicted = false;
    const geminiKey = process.env.GEMINI_API_KEY;

    if ((!finalCategory || finalCategory === "Personal") && geminiKey) {
      const contentForPrediction = content
        || structuredFields.map((f) => `${f.key}: ${f.value}`).join(", ");

      const prediction = await predictCategory(userId, title, contentForPrediction, db, geminiKey);

      if (prediction.confidence >= 0.7 && prediction.predicted !== "Personal") {
        finalCategory = prediction.predicted;
        categoryWasPredicted = true;
      } else if (!finalCategory) {
        finalCategory = prediction.predicted || "Personal";
      }
    }

    if (!finalCategory) finalCategory = "Personal";
    fields["category"] = finalCategory;

    const docRef = await entriesRef.add({
      title: args.title,
      fields,
      field_definitions,
      category: finalCategory,
      user_id: userId,
      processed: false,
      category_predicted: categoryWasPredicted,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record signal to strengthen future predictions
    if (geminiKey) {
      const contentText = content || structuredFields.map((f) => `${f.value}`).join(" ");
      recordCategorySignal(userId, title, contentText, finalCategory, false, db).catch(() => {});
    }

    const actionData = {
      id: docRef.id,
      title,
      category: finalCategory,
      content: content || null,
      fields: structuredFields.length ? structuredFields : null,
    };

    return novaAction("save_entry", actionData, {
      id: docRef.id,
      title,
      category: finalCategory,
      category_was_predicted: categoryWasPredicted,
    });
  }

  case "searchEntries": {
    const limit = typeof args.limit === "number" ? args.limit : 5;
    const snap = await entriesRef
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(50)
      .get();
    const q = String(args.query || "").toLowerCase();
    const results = snap.docs
      .map(toEntrySearchRecord)
      .filter((entry) =>
        (entry.title && entry.title.toLowerCase().includes(q)) ||
        (typeof entry.fields?.content === "string" && entry.fields.content.toLowerCase().includes(q)) ||
        (typeof entry.fields?.category === "string" && entry.fields.category.toLowerCase().includes(q))
      )
      .slice(0, limit)
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        content: typeof entry.fields?.content === "string" ? entry.fields.content : undefined,
        category: typeof entry.fields?.category === "string" ? entry.fields.category : undefined,
      }));
    const actionData = { query: args.query, results: results.slice(0, 5), count: results.length };
    return novaAction("search", actionData, { results, count: results.length });
  }

  case "getRecentEntries": {
    const limit = typeof args.limit === "number" ? args.limit : 5;
    let q = entriesRef.where("user_id", "==", userId).orderBy("updated_at", "desc").limit(limit);
    const categoryFilter = typeof args.category === "string" ? args.category : undefined;
    if (categoryFilter) {
      q = entriesRef
        .where("user_id", "==", userId)
        .where("fields.category", "==", categoryFilter)
        .orderBy("updated_at", "desc")
        .limit(limit);
    }
    const snap = await q.get();
    const results = snap.docs.map((d) => {
      const data = d.data();
      const docFields = data.fields && typeof data.fields === "object" ? data.fields as Record<string, unknown> : undefined;
      return {
        id: d.id,
        title: typeof data.title === "string" ? data.title : undefined,
        content: typeof docFields?.content === "string" ? docFields.content : undefined,
        category: typeof docFields?.category === "string" ? docFields.category : undefined,
      };
    });
    return ok({ results, count: results.length });
  }

  case "updateEntry": {
    const entryId = typeof args.id === "string" ? args.id : "";
    const title = typeof args.title === "string" ? args.title : undefined;
    const content = typeof args.content === "string" ? args.content : undefined;
    const category = typeof args.category === "string" ? args.category : undefined;

    const updateData: Record<string, unknown> = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (title) updateData.title = title;

    // Fetch existing entry to compare/merge, and enforce ownership because
    // Cloud Functions use Admin SDK and bypass Firestore security rules.
    const existingDoc = await entriesRef.doc(entryId).get();
    if (!existingDoc.exists) {
      return fail("Entry not found");
    }
    const existingData = existingDoc.data() || {};
    if (existingData.user_id !== userId) {
      return fail("Entry not found");
    }
    const currentFields = existingData.fields && typeof existingData.fields === "object"
      ? existingData.fields as Record<string, unknown>
      : {};

    if (content || category) {
      updateData.fields = {
        ...currentFields,
        ...(content ? {content} : {}),
        ...(category ? {category} : {}),
      };
    }

    // Category correction learning — if category changed, record it as a correction
    const oldCategory = typeof existingData.category === "string" ? existingData.category : undefined;
    if (category && oldCategory && category !== oldCategory) {
      updateData.category = category;
      updateData.category_predicted = false;

      const entryTitle = title || (typeof existingData.title === "string" ? existingData.title : "");
      const entryContent = content || (typeof currentFields.content === "string" ? currentFields.content : "");
      recordCategorySignal(userId, entryTitle, entryContent, category, true, db).catch(() => {});
    } else if (category && !oldCategory) {
      updateData.category = category;
    }

    await entriesRef.doc(entryId).update(updateData);
    const actionData = {
      id: entryId,
      title: title || null,
      category: category || null,
      content: content || null,
    };
    return novaAction("update_entry", actionData, { id: entryId });
  }

  case "deleteEntry": {
    const entryId = typeof args.id === "string" ? args.id : "";
    const delDoc = await entriesRef.doc(entryId).get();
    if (!delDoc.exists) {
      return fail("Entry not found");
    }
    const delData = delDoc.data() || {};
    if (delData.user_id !== userId) {
      return fail("Entry not found");
    }
    const delTitle = typeof delData.title === "string" ? delData.title : "Entry";
    await entriesRef.doc(entryId).delete();
    return novaAction("delete_entry", { id: entryId, title: delTitle }, { id: entryId, title: delTitle });
  }
  }

  // ── Settings operations ──────────────────────────────────────────────────
  const settingsResult = await handleSettingsTool(toolName, args, userId, db);
  if (settingsResult) {
    return settingsResult;
  }

  // ── Memory operations ──────────────────────────────────────────────────
  const memoryResult = await handleMemoryTool(toolName, args, userId, db, rebuildMemoryProfile);
  if (memoryResult) {
    return memoryResult;
  }

  // ── Agentic intelligence operations ───────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;

  const intelligenceResult = await handleIntelligenceTool(toolName, args, userId, db, entriesRef, {
    executeVoiceTool,
    fetchWithRetry,
    GEMINI_API,
    geminiKey,
  });
  if (intelligenceResult) {
    return intelligenceResult;
  }

  return fail(`Unknown tool: ${toolName}`);
}
