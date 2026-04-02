import * as admin from "firebase-admin";
import { fail, novaAction, ok, VoiceToolResult } from "../voiceToolResults";

interface IntelligenceDeps {
  executeVoiceTool: (toolName: string, args: Record<string, unknown>, userId: string) => Promise<Record<string, unknown>>;
  fetchWithRetry: (url: string, init: RequestInit) => Promise<Response>;
  GEMINI_API: string;
  geminiKey?: string;
}

interface EntityGraphRecord {
  id: string;
  name?: string;
  aliases?: string[];
  type?: string;
  entries?: Array<{ id: string; title?: unknown; category?: unknown; summary?: unknown }>;
}

interface RelatedEntryRecord {
  id: string;
  title?: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  action_items?: Array<{ status?: string; text?: string; priority?: string; due_date?: string | null }>;
  tags?: string[];
  updated_at?: unknown;
}

interface MemoryRecord {
  content?: string;
  category?: string | null;
  type?: string;
}

interface ActionItemRecord {
  id?: string;
  text?: string;
  priority?: string;
  status?: string;
  due_date?: string | null | { toDate?: () => Date };
  entry_id?: string | null;
  ref?: admin.firestore.DocumentReference;
}

const getDueDate = (dueDate: ActionItemRecord["due_date"]): Date | null => {
  if (!dueDate) return null;
  if (typeof dueDate === "string") return new Date(dueDate);
  if (typeof dueDate.toDate === "function") return dueDate.toDate();
  return null;
};

const toEntityGraphRecord = (doc: admin.firestore.QueryDocumentSnapshot): EntityGraphRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : undefined,
    aliases: Array.isArray(data.aliases) ? data.aliases.filter((alias): alias is string => typeof alias === "string") : [],
    type: typeof data.type === "string" ? data.type : undefined,
  };
};

const toRelatedEntryRecord = (doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot, fallbackId?: string): RelatedEntryRecord => {
  const data = doc.data() || {};
  const id = "id" in doc ? doc.id : fallbackId || "";
  return {
    id,
    title: typeof data.title === "string" ? data.title : undefined,
    summary: typeof data.summary === "string" ? data.summary : null,
    content: data.fields && typeof data.fields === "object" && typeof (data.fields as Record<string, unknown>).content === "string"
      ? ((data.fields as Record<string, unknown>).content as string)
      : null,
    category: typeof data.category === "string"
      ? data.category
      : data.fields && typeof data.fields === "object" && typeof (data.fields as Record<string, unknown>).category === "string"
        ? ((data.fields as Record<string, unknown>).category as string)
        : null,
    action_items: Array.isArray(data.action_items) ? data.action_items as RelatedEntryRecord["action_items"] : [],
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : [],
    updated_at: data.updated_at,
  };
};

const toMemoryRecord = (value: Record<string, unknown>): MemoryRecord => ({
  content: typeof value.content === "string" ? value.content : undefined,
  category: typeof value.category === "string" ? value.category : null,
  type: typeof value.type === "string" ? value.type : undefined,
});

const toActionItemRecord = (doc: admin.firestore.QueryDocumentSnapshot): ActionItemRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    text: typeof data.text === "string" ? data.text : undefined,
    priority: typeof data.priority === "string" ? data.priority : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    due_date: data.due_date as ActionItemRecord["due_date"],
    entry_id: typeof data.entry_id === "string" ? data.entry_id : null,
    ref: doc.ref,
  };
};

export async function handleIntelligenceTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  db: admin.firestore.Firestore,
  entriesRef: admin.firestore.CollectionReference,
  deps: IntelligenceDeps
): Promise<VoiceToolResult | null> {
  const { executeVoiceTool, fetchWithRetry, GEMINI_API, geminiKey } = deps;

  switch (toolName) {
  case "getEntityGraph": {
    const entitySnap = await db.collection("entity_graph")
      .where("user_id", "==", userId)
      .limit(100)
      .get();

    const query = String(args.query || "").toLowerCase();
    const typeFilter = args.type as string | undefined;
    const matches = entitySnap.docs
      .map(toEntityGraphRecord)
      .filter((entity) => {
        const entityName = entity.name?.toLowerCase() || "";
        const aliases = entity.aliases || [];
        const nameMatch = entityName.includes(query) || aliases.some((alias) => alias.toLowerCase().includes(query));
        const typeMatch = !typeFilter || entity.type === typeFilter;
        return nameMatch && typeMatch;
      })
      .slice(0, 10);

    for (const entity of matches) {
      const links = await db.collection("entry_entities")
        .where("user_id", "==", userId)
        .where("entity_id", "==", entity.id)
        .limit(10)
        .get();
      const entryIds = links.docs.map((d) => d.data().entry_id).filter((entryId): entryId is string => typeof entryId === "string");
      const entries: Array<{ id: string; title?: unknown; category?: unknown; summary?: unknown }> = [];
      for (const entryId of entryIds.slice(0, 5)) {
        const entryDoc = await entriesRef.doc(entryId).get();
        if (entryDoc.exists) {
          const data = entryDoc.data() || {};
          entries.push({ id: entryId, title: data.title, category: data.category || data.fields?.category, summary: data.summary });
        }
      }
      entity.entries = entries;
    }

    return ok({ entities: matches, count: matches.length });
  }

  case "getRelatedEntries": {
    const limit = (args.limit as number) || 5;
    const relatedIds: Set<string> = new Set();

    if (args.entryId) {
      const links = await db.collection("entry_links")
        .where("user_id", "==", userId)
        .where("source_entry_id", "==", args.entryId)
        .orderBy("strength", "desc")
        .limit(limit)
        .get();
      links.docs.forEach((d) => relatedIds.add(d.data().target_entry_id));

      const reverseLinks = await db.collection("entry_links")
        .where("user_id", "==", userId)
        .where("target_entry_id", "==", args.entryId)
        .orderBy("strength", "desc")
        .limit(limit)
        .get();
      reverseLinks.docs.forEach((d) => relatedIds.add(d.data().source_entry_id));
    }

    if (args.topic) {
      const entitySnap = await db.collection("entity_graph")
        .where("user_id", "==", userId)
        .limit(50)
        .get();
      const topicLower = (args.topic as string).toLowerCase();
      const matchedEntityIds = entitySnap.docs
        .filter((d) => {
          const data = d.data();
          return data.name.toLowerCase().includes(topicLower) ||
            (data.aliases || []).some((a: string) => a.toLowerCase().includes(topicLower));
        })
        .map((d) => d.id);

      for (const entityId of matchedEntityIds.slice(0, 10)) {
        const entityEntries = await db.collection("entry_entities")
          .where("user_id", "==", userId)
          .where("entity_id", "==", entityId)
          .limit(limit * 2)
          .get();
        entityEntries.docs.forEach((d) => relatedIds.add(d.data().entry_id));
      }
    }

    const entries: RelatedEntryRecord[] = [];
    for (const id of Array.from(relatedIds).slice(0, limit)) {
      const entryDoc = await entriesRef.doc(id).get();
      if (entryDoc.exists) {
        entries.push(toRelatedEntryRecord(entryDoc, id));
      }
    }

    return ok({ entries, count: entries.length });
  }

  case "prepareBriefing": {
    if (!geminiKey) return fail("AI not configured");

    const searchResult = await executeVoiceTool("searchEntries", {query: args.subject, limit: 10}, userId);
    const relatedResult = await executeVoiceTool("getRelatedEntries", {topic: args.subject, limit: 10}, userId);
    const memoryResult = await executeVoiceTool("recallMemories", {query: args.subject}, userId);

    const searchEntries = Array.isArray((searchResult.data as Record<string, unknown> | undefined)?.results)
      ? ((searchResult.data as Record<string, unknown>).results as RelatedEntryRecord[])
      : [];
    const relatedEntries = Array.isArray((relatedResult.data as Record<string, unknown> | undefined)?.entries)
      ? ((relatedResult.data as Record<string, unknown>).entries as RelatedEntryRecord[])
      : [];
    const memories = Array.isArray((memoryResult.data as Record<string, unknown> | undefined)?.memories)
      ? ((memoryResult.data as Record<string, unknown>).memories as Record<string, unknown>[]).map(toMemoryRecord)
      : [];

    const allEntries = [...searchEntries, ...relatedEntries];
    const seen = new Set<string>();
    const uniqueEntries = allEntries.filter((entry) => {
      if (!entry.id || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });

    const actionItemsSnap = await db.collection("action_items")
      .where("user_id", "==", userId)
      .where("status", "in", ["open", "in_progress"])
      .orderBy("created_at", "desc")
      .limit(20)
      .get();
    const subjectLower = (args.subject as string).toLowerCase();
    const relevantActions = actionItemsSnap.docs
      .map(toActionItemRecord)
      .filter((actionItem) => (actionItem.text || "").toLowerCase().includes(subjectLower));

    const synthesisPrompt = `Synthesize a ${args.type || "general"} briefing about "${args.subject}".\n\nEntries found (${uniqueEntries.length}):\n${uniqueEntries.map((entry) => `- ${entry.title}: ${entry.summary || entry.content || "(no summary)"}`).join("\n")}\n\nMemories about this:\n${memories.length ? memories.map((memory) => `- ${memory.content}`).join("\n") : "None"}\n\nOpen action items:\n${relevantActions.length ? relevantActions.map((actionItem) => `- ${actionItem.text} [${actionItem.priority || "medium"}]${actionItem.due_date ? " due: " + String(actionItem.due_date) : ""}`).join("\n") : "None"}\n\nWrite a concise briefing (2-4 sentences) suitable for voice. Mention key facts, open tasks, and anything time-sensitive.`;

    const briefingRes = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: synthesisPrompt}]}],
        generationConfig: {maxOutputTokens: 512, temperature: 0.3},
      }),
    });

    let briefingText = "I couldn't generate a briefing right now.";
    if (briefingRes.ok) {
      const briefingData = await briefingRes.json();
      briefingText = briefingData.candidates?.[0]?.content?.parts?.[0]?.text || briefingText;
    }

    return ok({
      briefing: briefingText,
      entriesUsed: uniqueEntries.length,
      memoriesUsed: memories.length,
      openActionItems: relevantActions.length,
    });
  }

  case "getActivitySummary": {
    const timeframeMap: Record<string, number> = {
      today: 1, yesterday: 2, this_week: 7, last_week: 14, this_month: 30,
    };
    const daysBack = timeframeMap[args.timeframe as string] || 7;
    const since = new Date(Date.now() - daysBack * 86400000);

    const snap = await entriesRef
      .where("user_id", "==", userId)
      .where("created_at", ">=", admin.firestore.Timestamp.fromDate(since))
      .orderBy("created_at", "desc")
      .limit(30)
      .get();

    const entries = snap.docs.map((d) => toRelatedEntryRecord(d, d.id));
    const categoryCounts: Record<string, number> = {};
    const allActionItems: Array<{ status?: string }> = [];

    entries.forEach((entry) => {
      const cat = entry.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (entry.action_items) allActionItems.push(...entry.action_items);
    });

    return ok({
      totalEntries: entries.length,
      categoryCounts,
      recentTitles: entries.slice(0, 7).map((entry) => entry.title || "Untitled"),
      openActionItems: allActionItems.filter((actionItem) => actionItem.status !== "completed").length,
      timeframe: args.timeframe,
    });
  }

  case "getUpcomingDeadlines": {
    const tfMap: Record<string, number> = {
      today: 1, tomorrow: 2, this_week: 7, next_week: 14,
    };
    const daysAhead = tfMap[args.timeframe as string] || 7;
    const until = new Date(Date.now() + daysAhead * 86400000);
    const statusFilter = (args.status as string) || "open";

    let q: admin.firestore.Query = db.collection("action_items")
      .where("user_id", "==", userId);

    if (statusFilter !== "all") {
      q = q.where("status", "==", statusFilter);
    }

    const snap = await q.orderBy("created_at", "desc").limit(30).get();

    const items = snap.docs
      .map(toActionItemRecord)
      .filter((item) => {
        if (!item.due_date) return true;
        const dueDate = getDueDate(item.due_date);
        if (!dueDate) return true;
        return dueDate <= until;
      })
      .slice(0, 10);

    return ok({
      items: items.map((item) => ({
        id: item.id,
        text: item.text,
        priority: item.priority,
        status: item.status,
        due_date: getDueDate(item.due_date)?.toISOString() || null,
        entry_id: item.entry_id,
      })),
      count: items.length,
      timeframe: args.timeframe,
    });
  }

  case "updateActionItem": {
    const snap = await db.collection("action_items")
      .where("user_id", "==", userId)
      .where("status", "in", ["open", "in_progress"])
      .orderBy("created_at", "desc")
      .limit(30)
      .get();

    const query = (args.query as string).toLowerCase();
    const queryWords = query.split(/\s+/).filter((w) => w.length > 2);

    let bestMatch: ActionItemRecord | null = null;
    let bestScore = 0;
    for (const d of snap.docs) {
      const text = (d.data().text || "").toLowerCase();
      let score = 0;
      if (text.includes(query)) score = 1.0;
      else {
        const matchedWords = queryWords.filter((w) => text.includes(w));
        score = queryWords.length > 0 ? matchedWords.length / queryWords.length : 0;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...toActionItemRecord(d), ref: d.ref };
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return fail("No matching action item found");
    }

    const updateData: Record<string, unknown> = {
      status: args.status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (args.status === "completed") {
      updateData.completed_at = admin.firestore.FieldValue.serverTimestamp();
    }
    if (!bestMatch.ref) {
      return fail("Matched action item is missing a document reference");
    }

    await bestMatch.ref.update(updateData);

    return novaAction("update_task", { text: bestMatch.text, status: args.status }, {
      id: bestMatch.id,
      text: bestMatch.text,
      newStatus: args.status,
    });
  }

  case "setReminder": {
    const whenStr = (args.when as string).toLowerCase();
    const triggerAt = new Date();

    if (whenStr.includes("tomorrow")) {
      triggerAt.setDate(triggerAt.getDate() + 1);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("next week") || whenStr.includes("next monday")) {
      const daysUntilMonday = (8 - triggerAt.getDay()) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilMonday);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.match(/in (\d+) hour/)) {
      const hours = parseInt(whenStr.match(/in (\d+) hour/)![1]);
      triggerAt.setTime(triggerAt.getTime() + hours * 3600000);
    } else if (whenStr.match(/in (\d+) minute/)) {
      const mins = parseInt(whenStr.match(/in (\d+) minute/)![1]);
      triggerAt.setTime(triggerAt.getTime() + mins * 60000);
    } else if (whenStr.match(/in (\d+) day/)) {
      const days = parseInt(whenStr.match(/in (\d+) day/)![1]);
      triggerAt.setDate(triggerAt.getDate() + days);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("friday")) {
      const daysUntilFri = (5 - triggerAt.getDay() + 7) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilFri);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("monday")) {
      const daysUntilMon = (1 - triggerAt.getDay() + 7) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilMon);
      triggerAt.setHours(9, 0, 0, 0);
    } else if (whenStr.includes("wednesday")) {
      const daysUntilWed = (3 - triggerAt.getDay() + 7) % 7 || 7;
      triggerAt.setDate(triggerAt.getDate() + daysUntilWed);
      triggerAt.setHours(9, 0, 0, 0);
    } else {
      triggerAt.setDate(triggerAt.getDate() + 1);
      triggerAt.setHours(9, 0, 0, 0);
    }

    const timeMatch = whenStr.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3]?.toLowerCase() === "pm" && hours < 12) hours += 12;
      if (timeMatch[3]?.toLowerCase() === "am" && hours === 12) hours = 0;
      triggerAt.setHours(hours, minutes, 0, 0);
    }

    const reminderDoc = await db.collection("reminders").add({
      user_id: userId,
      text: args.text,
      trigger_at: admin.firestore.Timestamp.fromDate(triggerAt),
      entry_id: args.entryId || null,
      action_item_id: null,
      status: "pending",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return novaAction("set_reminder", { text: args.text, when: triggerAt.toISOString() }, {
      reminderId: reminderDoc.id,
      triggerAt: triggerAt.toISOString(),
      text: args.text,
    });
  }

  default:
    return null;
  }
}
