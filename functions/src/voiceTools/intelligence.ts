import * as admin from "firebase-admin";
import { fail, novaAction, ok, VoiceToolResult } from "../voiceToolResults";

interface IntelligenceDeps {
  executeVoiceTool: (toolName: string, args: Record<string, any>, userId: string) => Promise<Record<string, any>>;
  fetchWithRetry: (url: string, init: RequestInit) => Promise<any>;
  GEMINI_API: string;
  geminiKey?: string;
}

export async function handleIntelligenceTool(
  toolName: string,
  args: Record<string, any>,
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

    const query = (args.query as string).toLowerCase();
    const typeFilter = args.type as string | undefined;
    const matches = entitySnap.docs
      .map((d) => ({id: d.id, ...(d.data() as any)}))
      .filter((e: any) => {
        const nameMatch = e.name.toLowerCase().includes(query) ||
          (e.aliases || []).some((a: string) => a.toLowerCase().includes(query));
        const typeMatch = !typeFilter || e.type === typeFilter;
        return nameMatch && typeMatch;
      })
      .slice(0, 10);

    for (const entity of matches) {
      const links = await db.collection("entry_entities")
        .where("user_id", "==", userId)
        .where("entity_id", "==", entity.id)
        .limit(10)
        .get();
      const entryIds = links.docs.map((d) => d.data().entry_id);
      const entries: any[] = [];
      for (const eid of entryIds.slice(0, 5)) {
        const entryDoc = await entriesRef.doc(eid).get();
        if (entryDoc.exists) {
          const data = entryDoc.data() as any;
          entries.push({id: eid, title: data.title, category: data.category || data.fields?.category, summary: data.summary});
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

    const entries: any[] = [];
    for (const id of Array.from(relatedIds).slice(0, limit)) {
      const entryDoc = await entriesRef.doc(id).get();
      if (entryDoc.exists) {
        const data = entryDoc.data() as any;
        entries.push({
          id,
          title: data.title,
          summary: data.summary || null,
          category: data.category || data.fields?.category,
          action_items: data.action_items || [],
          tags: data.tags || [],
          updated_at: data.updated_at,
        });
      }
    }

    return ok({ entries, count: entries.length });
  }

  case "prepareBriefing": {
    if (!geminiKey) return fail("AI not configured");

    const searchResult = await executeVoiceTool("searchEntries", {query: args.subject, limit: 10}, userId);
    const relatedResult = await executeVoiceTool("getRelatedEntries", {topic: args.subject, limit: 10}, userId);
    const memoryResult = await executeVoiceTool("recallMemories", {query: args.subject}, userId);

    const searchEntries = searchResult?.data?.results || [];
    const relatedEntries = relatedResult?.data?.entries || [];
    const memories = memoryResult?.data?.memories || [];

    const allEntries = [...searchEntries, ...relatedEntries];
    const seen = new Set<string>();
    const uniqueEntries = allEntries.filter((e: any) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
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
      .map((d) => d.data())
      .filter((a: any) => (a.text || "").toLowerCase().includes(subjectLower));

    const synthesisPrompt = `Synthesize a ${args.type || "general"} briefing about "${args.subject}".\n\nEntries found (${uniqueEntries.length}):\n${uniqueEntries.map((e: any) => `- ${e.title}: ${e.summary || e.content || "(no summary)"}`).join("\n")}\n\nMemories about this:\n${memories.length ? memories.map((m: any) => `- ${m.content}`).join("\n") : "None"}\n\nOpen action items:\n${relevantActions.length ? relevantActions.map((a: any) => `- ${a.text} [${a.priority || "medium"}]${a.due_date ? " due: " + a.due_date : ""}`).join("\n") : "None"}\n\nWrite a concise briefing (2-4 sentences) suitable for voice. Mention key facts, open tasks, and anything time-sensitive.`;

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

    const entries = snap.docs.map((d) => ({id: d.id, ...(d.data() as any)}));
    const categoryCounts: Record<string, number> = {};
    const allActionItems: any[] = [];

    entries.forEach((e: any) => {
      const cat = e.category || e.fields?.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (e.action_items) allActionItems.push(...e.action_items);
    });

    return ok({
      totalEntries: entries.length,
      categoryCounts,
      recentTitles: entries.slice(0, 7).map((e: any) => e.title),
      openActionItems: allActionItems.filter((a: any) => a.status !== "completed").length,
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
      .map((d) => ({id: d.id, ...(d.data() as any)}))
      .filter((item: any) => {
        if (!item.due_date) return true;
        const dueDate = item.due_date.toDate ? item.due_date.toDate() : new Date(item.due_date);
        return dueDate <= until;
      })
      .slice(0, 10);

    return ok({
      items: items.map((i: any) => ({
        id: i.id,
        text: i.text,
        priority: i.priority,
        status: i.status,
        due_date: i.due_date ? (i.due_date.toDate ? i.due_date.toDate().toISOString() : i.due_date) : null,
        entry_id: i.entry_id,
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

    let bestMatch: any = null;
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
        bestMatch = {id: d.id, ref: d.ref, ...d.data()};
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return fail("No matching action item found");
    }

    const updateData: Record<string, any> = {
      status: args.status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (args.status === "completed") {
      updateData.completed_at = admin.firestore.FieldValue.serverTimestamp();
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
    let triggerAt = new Date();

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
