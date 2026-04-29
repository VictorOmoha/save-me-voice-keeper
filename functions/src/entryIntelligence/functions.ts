import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {withCors} from "../common/http";
import {verifyAuth} from "../common/auth";
import {fetchWithRetry} from "../common/fetchWithRetry";

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface ExtractedEntityRecord {
  name?: string;
  type?: string;
  aliases?: string[];
}

interface ExtractedActionItemRecord {
  text?: string;
  priority?: string;
  due_date?: string;
  assignee?: string | null;
}

interface UserPatternRecord {
  description?: string;
  trigger_conditions?: string;
  suggested_action?: string;
  confidence?: number;
}

/**
 * AI Brain Dump Enhancement Function
 */
export const enhanceBrainDump = functions.https.onRequest(
  withCors(async (req, res) => {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {text, mode} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get OpenAI API key from Firebase config
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      res.status(500).json({error: "OpenAI API key not configured"});
      return;
    }

    try {
      const systemPrompt = mode === "organize" ?
        "You are an assistant that organizes and structures messy thoughts into clear categories and action items." :
        "You are an assistant that helps expand and elaborate on ideas, providing additional context and suggestions.";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {role: "system", content: systemPrompt},
            {role: "user", content: text},
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        res.status(response.status).json({error: "OpenAI API error"});
        return;
      }

      const data = await response.json();
      const enhancedText = data.choices[0]?.message?.content;

      res.json({enhancedText});
    } catch (error) {
      console.error("Brain dump enhancement error:", error);
      res.status(500).json({error: "Failed to enhance text"});
    }
  })
);

const EXTRACTION_SYSTEM_PROMPT = `You are an entity and relationship extraction engine for a personal knowledge vault.
Given an entry's title and content, extract structured information.

Return a JSON object with:
{
  "entities": [{"name": "string", "type": "person|project|organization|topic|location|event", "aliases": ["string"]}],
  "tags": ["string"],  // 3-7 topical tags
  "action_items": [{"text": "string", "priority": "high|medium|low", "due_date": "string or null", "assignee": "string or null"}],
  "summary": "one sentence summary",
  "category_suggestion": "string"
}

Rules:
- Extract REAL entities only — names of people, projects, companies, places, events mentioned.
- Tags should be topical keywords, not entity names.
- Action items are things that need to be DONE — look for "need to", "must", "should", "have to", "by Friday", deadlines.
- Due dates should be relative descriptions like "Friday", "next week", "end of month".
- If no entities/action items found, return empty arrays.
- Always return valid JSON.`;

/**
 * Deep Entry Processing — Firestore Trigger
 * Fires when any entry is created or updated.
 * Enriches the entry with entities, tags, action items, summary, and cross-links.
 */
export const processEntryDeep = functions.firestore
  .document("entries/{entryId}")
  .onWrite(async (change, context) => {
    const entryId = context.params.entryId;
    const entry = change.after.exists ? change.after.data() : null;

    // Skip if deleted, already processed, or no data
    if (!entry || entry.processed === true) return;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("[processEntryDeep] No GEMINI_API_KEY — skipping");
      return;
    }

    const db = admin.firestore();
    const userId = entry.user_id;
    if (!userId) return;

    try {
      // Build content string from entry
      const contentParts: string[] = [entry.title || ""];
      if (entry.fields) {
        for (const [key, value] of Object.entries(entry.fields)) {
          if (typeof value === "string" && value.trim()) {
            contentParts.push(`${key}: ${value}`);
          }
        }
      }
      const fullContent = contentParts.join("\n");

      if (fullContent.trim().length < 10) {
        // Too short to process meaningfully
        await change.after.ref.update({processed: true});
        return;
      }

      // Call Gemini for extraction
      const geminiRes = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          systemInstruction: {parts: [{text: EXTRACTION_SYSTEM_PROMPT}]},
          contents: [{role: "user", parts: [{text: `Entry title: "${entry.title}"\n\nContent:\n${fullContent}`}]}],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        console.error("[processEntryDeep] Gemini error:", await geminiRes.text());
        return;
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      let extracted: Record<string, unknown>;
      try {
        const parsed = JSON.parse(rawText);
        extracted = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
      } catch {
        console.warn("[processEntryDeep] Failed to parse Gemini JSON:", rawText.substring(0, 200));
        await change.after.ref.update({processed: true});
        return;
      }

      const entities: ExtractedEntityRecord[] = Array.isArray(extracted.entities)
        ? extracted.entities as ExtractedEntityRecord[]
        : [];
      const tags: string[] = Array.isArray(extracted.tags)
        ? extracted.tags.filter((tag): tag is string => typeof tag === "string")
        : [];
      const actionItems: ExtractedActionItemRecord[] = Array.isArray(extracted.action_items)
        ? extracted.action_items as ExtractedActionItemRecord[]
        : [];
      const summary = typeof extracted.summary === "string" ? extracted.summary : "";

      // ── Upsert entities into entity_graph ─────────────────────────────────
      const entityIds: string[] = [];

      for (const entity of entities) {
        if (!entity.name) continue;
        const entityName = entity.name.trim();
        const entityType = entity.type || "topic";

        // Check if entity already exists
        const existingSnap = await db.collection("entity_graph")
          .where("user_id", "==", userId)
          .where("name", "==", entityName)
          .limit(1)
          .get();

        let entityId: string;
        if (existingSnap.empty) {
          const newEntity = await db.collection("entity_graph").add({
            user_id: userId,
            name: entityName,
            type: entityType,
            aliases: entity.aliases || [],
            metadata: {},
            mention_count: 1,
            last_mentioned: admin.firestore.FieldValue.serverTimestamp(),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          entityId = newEntity.id;
        } else {
          entityId = existingSnap.docs[0].id;
          await existingSnap.docs[0].ref.update({
            mention_count: admin.firestore.FieldValue.increment(1),
            last_mentioned: admin.firestore.FieldValue.serverTimestamp(),
            aliases: admin.firestore.FieldValue.arrayUnion(...(entity.aliases || [])),
          });
        }

        entityIds.push(entityId);

        // Create junction record
        await db.collection("entry_entities").add({
          user_id: userId,
          entry_id: entryId,
          entity_id: entityId,
          entity_name: entityName,
          entity_type: entityType,
          context_snippet: fullContent.substring(0, 200),
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // ── Find related entries by shared entities ───────────────────────────
      const linkedEntryIds: Set<string> = new Set();

      for (const entityId of entityIds) {
        const relatedSnap = await db.collection("entry_entities")
          .where("user_id", "==", userId)
          .where("entity_id", "==", entityId)
          .limit(20)
          .get();

        for (const d of relatedSnap.docs) {
          const relEntryId = d.data().entry_id;
          if (relEntryId !== entryId) {
            linkedEntryIds.add(relEntryId);
          }
        }
      }

      // Create entry_links for related entries
      for (const targetId of Array.from(linkedEntryIds).slice(0, 10)) {
        // Check if link already exists
        const existingLink = await db.collection("entry_links")
          .where("user_id", "==", userId)
          .where("source_entry_id", "==", entryId)
          .where("target_entry_id", "==", targetId)
          .limit(1)
          .get();

        if (existingLink.empty) {
          // Count shared entities for strength
          const sharedEntities = await db.collection("entry_entities")
            .where("user_id", "==", userId)
            .where("entry_id", "==", targetId)
            .get();
          const targetEntityIds = sharedEntities.docs.map((d) => d.data().entity_id);
          const shared = entityIds.filter((id) => targetEntityIds.includes(id));
          const strength = Math.min(shared.length / Math.max(entityIds.length, 1), 1.0);

          await db.collection("entry_links").add({
            user_id: userId,
            source_entry_id: entryId,
            target_entry_id: targetId,
            link_type: "related",
            strength,
            reason: `Shared entities: ${shared.length}`,
            auto_generated: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // ── Write action items to dedicated collection ────────────────────────
      for (const item of actionItems) {
        if (!item.text) continue;

        let dueDate: admin.firestore.Timestamp | null = null;
        if (item.due_date) {
          const parsed = parseFuzzyDate(item.due_date);
          if (parsed) dueDate = admin.firestore.Timestamp.fromDate(parsed);
        }

        await db.collection("action_items").add({
          user_id: userId,
          entry_id: entryId,
          text: item.text,
          priority: item.priority || "medium",
          status: "open",
          due_date: dueDate,
          assignee: item.assignee || null,
          completed_at: null,
          follow_up_date: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // ── Update the entry with enrichment data ─────────────────────────────
      await change.after.ref.update({
        tags,
        action_items: actionItems,
        entities: entityIds,
        linked_entries: Array.from(linkedEntryIds).slice(0, 10),
        summary,
        processed: true,
      });

      console.log(`[processEntryDeep] Enriched entry ${entryId}: ${entities.length} entities, ${tags.length} tags, ${actionItems.length} action items, ${linkedEntryIds.size} links`);
    } catch (error) {
      console.error("[processEntryDeep] Error:", error);
      // Mark as processed to avoid infinite retries
      try {
        await change.after.ref.update({processed: true});
      } catch { /* ignore */ }
    }
  });

/**
 * Parse fuzzy date strings like "Friday", "next week", "end of month" into Date objects.
 */
function parseFuzzyDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase().trim();
  const now = new Date();

  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  // Day of week
  for (const [day, num] of Object.entries(dayMap)) {
    if (lower.includes(day)) {
      const daysAhead = (num - now.getDay() + 7) % 7 || 7;
      const result = new Date(now);
      result.setDate(result.getDate() + daysAhead);
      result.setHours(17, 0, 0, 0); // Default EOD
      return result;
    }
  }

  if (lower.includes("tomorrow")) {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    result.setHours(17, 0, 0, 0);
    return result;
  }
  if (lower.includes("today") || lower.includes("eod") || lower.includes("end of day")) {
    const result = new Date(now);
    result.setHours(17, 0, 0, 0);
    return result;
  }
  if (lower.includes("next week")) {
    const result = new Date(now);
    result.setDate(result.getDate() + 7);
    result.setHours(17, 0, 0, 0);
    return result;
  }
  if (lower.includes("end of month") || lower.includes("eom")) {
    const result = new Date(now.getFullYear(), now.getMonth() + 1, 0, 17, 0, 0);
    return result;
  }
  if (lower.includes("end of week") || lower.includes("eow")) {
    const daysToFri = (5 - now.getDay() + 7) % 7 || 7;
    const result = new Date(now);
    result.setDate(result.getDate() + daysToFri);
    result.setHours(17, 0, 0, 0);
    return result;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check Reminders — Scheduled Function
 * Runs every 15 minutes. Finds due reminders and writes notifications.
 */
export const checkReminders = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      const dueReminders = await db.collection("reminders")
        .where("status", "==", "pending")
        .where("trigger_at", "<=", now)
        .limit(50)
        .get();

      if (dueReminders.empty) return;

      const batch = db.batch();
      for (const doc of dueReminders.docs) {
        const reminder = doc.data();

        // Create notification for the user
        const notifRef = db.collection("pending_notifications").doc();
        batch.set(notifRef, {
          user_id: reminder.user_id,
          type: "reminder",
          text: reminder.text,
          entry_id: reminder.entry_id || null,
          reminder_id: doc.id,
          status: "pending",
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark reminder as sent
        batch.update(doc.ref, {status: "sent"});
      }

      await batch.commit();
      console.log(`[checkReminders] Processed ${dueReminders.size} due reminders`);
    } catch (error) {
      console.error("[checkReminders] Error:", error);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze Patterns — Scheduled Function
 * Runs daily. Detects behavioral patterns from recent entries.
 */
export const analyzePatterns = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const db = admin.firestore();
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("[analyzePatterns] No GEMINI_API_KEY");
      return;
    }

    try {
      // Get users who have entries
      const recentEntries = await db.collection("entries")
        .where("created_at", ">=", admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 86400000)))
        .orderBy("created_at", "desc")
        .limit(500)
        .get();

      // Group by user
      const userEntries: Record<string, Array<{title?: unknown; category?: unknown; tags?: unknown; created_at?: unknown}>> = {};
      for (const doc of recentEntries.docs) {
        const data = doc.data();
        const uid = data.user_id;
        if (!userEntries[uid]) userEntries[uid] = [];
        if (userEntries[uid].length < 50) {
          userEntries[uid].push({title: data.title, category: data.category || data.fields?.category, tags: data.tags, created_at: data.created_at});
        }
      }

      for (const [userId, entries] of Object.entries(userEntries)) {
        if (entries.length < 5) continue; // Need minimum data

        const analysisPrompt = `Analyze these ${entries.length} entries from the last 30 days and detect behavioral patterns.

Entries:
${entries.map((entry) => `- "${entry.title}" [${entry.category || "uncategorized"}] tags: ${Array.isArray(entry.tags) ? entry.tags.join(", ") || "none" : "none"}`).join("\n")}

Detect patterns like:
- Category preferences (e.g., "80% of entries about meetings are categorized as Work")
- Tagging habits (e.g., "User always tags health entries with specific keywords")
- Time patterns (e.g., "Most entries created in the morning")
- Content patterns (e.g., "User frequently saves contact information")

Return JSON array of patterns:
[{"description": "string", "trigger_conditions": "string", "suggested_action": "string", "confidence": 0.0-1.0}]

Only include patterns with confidence >= 0.6. Return empty array if no clear patterns.`;

        const res = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            contents: [{role: "user", parts: [{text: analysisPrompt}]}],
            generationConfig: {maxOutputTokens: 512, temperature: 0.2, responseMimeType: "application/json"},
          }),
        });

        if (!res.ok) continue;
        const resData = await res.json();
        const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        let patterns: UserPatternRecord[];
        try {
          const parsed = JSON.parse(rawText);
          patterns = Array.isArray(parsed) ? parsed.filter((pattern): pattern is UserPatternRecord => Boolean(pattern && typeof pattern === "object")) : [];
        } catch {
          continue;
        }

        if (!Array.isArray(patterns)) continue;

        for (const pattern of patterns) {
          const confidence = typeof pattern.confidence === "number" ? pattern.confidence : 0;
          if (!pattern.description || confidence < 0.6) continue;

          // Check if this pattern already exists
          const existingSnap = await db.collection("user_patterns")
            .where("user_id", "==", userId)
            .where("description", "==", pattern.description)
            .limit(1)
            .get();

          if (existingSnap.empty) {
            await db.collection("user_patterns").add({
              user_id: userId,
              pattern_type: "behavioral",
              description: pattern.description,
              trigger_conditions: pattern.trigger_conditions || "",
              suggested_action: pattern.suggested_action || "",
              confidence,
              occurrence_count: 1,
              last_occurred: admin.firestore.FieldValue.serverTimestamp(),
              active: confidence >= 0.7,
              created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Update confidence and occurrence count
            await existingSnap.docs[0].ref.update({
              confidence: Math.min(confidence + 0.05, 1.0),
              occurrence_count: admin.firestore.FieldValue.increment(1),
              last_occurred: admin.firestore.FieldValue.serverTimestamp(),
              active: true,
            });
          }
        }

        console.log(`[analyzePatterns] User ${userId}: detected ${patterns.length} patterns from ${entries.length} entries`);
      }
    } catch (error) {
      console.error("[analyzePatterns] Error:", error);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// NOVA INSIGHTS — Proactive daily intelligence
// Runs every 24 hours, analyzes each active user's entries,
// and surfaces patterns/connections/gaps as in-app notifications.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_FLASH_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateUserInsights(
  userId: string,
  db: admin.firestore.Firestore,
  geminiKey: string
): Promise<void> {
  // Idempotent: skip if insights already generated for this user today
  const today = new Date().toISOString().split("T")[0];
  const existingToday = await db.collection("pending_notifications")
    .where("user_id", "==", userId)
    .where("insight_date", "==", today)
    .where("type", "==", "nova_insight")
    .limit(1)
    .get();

  if (!existingToday.empty) {
    console.log(`[novaInsights] Already ran for user ${userId} today — skipping`);
    return;
  }

  // Fetch last 7 days of entries
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const entriesSnap = await db.collection("entries")
    .where("user_id", "==", userId)
    .where("created_at", ">=", cutoff)
    .orderBy("created_at", "desc")
    .limit(30)
    .get();

  if (entriesSnap.empty) return;

  const entries = entriesSnap.docs.map((d) => {
    const data = d.data();
    const fields = data.fields || {};
    const content = fields.content
      || Object.values(fields).filter((v) => typeof v === "string").join(" ").slice(0, 200);
    return {
      id: d.id,
      title: data.title || "Untitled",
      category: data.category || "Personal",
      content: (content as string).slice(0, 150),
      createdAt: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  // Category breakdown (all-time, for context)
  const allEntriesSnap = await db.collection("entries")
    .where("user_id", "==", userId)
    .select("category")
    .get();

  const categoryCounts: Record<string, number> = {};
  allEntriesSnap.docs.forEach((d) => {
    const cat = d.data().category || "Personal";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryBreakdown = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([c, n]) => `${c} (${n})`)
    .join(", ");

  const prompt = `You are Nova — an intelligent personal knowledge assistant inside SaveMe.Space.

A user saved ${entries.length} entries in the last 7 days. Analyze them and generate 2–3 proactive, hyper-personalized insights.

Recent entries:
${entries.map((e) => `- [${e.id.slice(0, 8)}] "${e.title}" (${e.category}) — ${e.content}`).join("\n")}

Their full knowledge base: ${categoryBreakdown}

Generate insights that do ONE of these:
1. Surface a connection between 2+ entries they haven't noticed
2. Highlight a clear pattern in their thinking this week
3. Note a gap — something they started but haven't followed up on
4. Surface an unresolved thread worth revisiting

Rules:
- Use their ACTUAL entry titles (quoted)
- Be specific, not generic
- Max 120 characters each
- Sound like a brilliant friend paying close attention

Return JSON only:
[{
  "text": "Insight text (max 120 chars)",
  "type": "connection" | "pattern" | "gap" | "reminder",
  "entry_ids": ["short_id1", "short_id2"]
}]`;

  const res = await fetchWithRetry(`${GEMINI_FLASH_API}?key=${geminiKey}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{role: "user", parts: [{text: prompt}]}],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.75,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[novaInsights] Gemini error for user ${userId}: ${res.status} — ${errText}`);
    return;
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  let insights: {text: string; type: string; entry_ids?: string[]}[];
  try {
    insights = JSON.parse(rawText);
  } catch {
    console.warn(`[novaInsights] Failed to parse Gemini response for user ${userId}:`, rawText);
    return;
  }

  if (!Array.isArray(insights) || insights.length === 0) return;

  // Write insights to pending_notifications (max 3)
  const batch = db.batch();
  let written = 0;
  for (const insight of insights.slice(0, 3)) {
    if (!insight.text || insight.text.length < 10) continue;
    const notifRef = db.collection("pending_notifications").doc();
    batch.set(notifRef, {
      user_id: userId,
      type: "nova_insight",
      text: insight.text,
      insight_type: insight.type || "pattern",
      entry_ids: insight.entry_ids || [],
      status: "pending",
      insight_date: today,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    written++;
  }

  await batch.commit();
  console.log(`[novaInsights] Wrote ${written} insights for user ${userId}`);
}

export const novaInsights = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("America/New_York")
  .onRun(async () => {
    const db = admin.firestore();
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("[novaInsights] GEMINI_API_KEY not configured");
      return null;
    }

    // Find active users: any user with entries touched in last 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const recentSnap = await db.collection("entries")
      .where("updated_at", ">=", cutoff)
      .select("user_id")
      .get();

    const userIds = [...new Set(recentSnap.docs.map((d) => d.data().user_id as string))].filter(Boolean);
    console.log(`[novaInsights] Processing ${userIds.length} active users`);

    for (const userId of userIds) {
      try {
        await generateUserInsights(userId, db, geminiKey);
      } catch (err) {
        console.error(`[novaInsights] Failed for user ${userId}:`, err);
      }
    }

    return null;
  });
