import * as admin from "firebase-admin";
import {fetchWithRetry} from "../common/fetchWithRetry";
import {createSharedMemory} from "../sharedMemory/create";

import {GEMINI_API} from "./config";

interface ExtractedMemoryFact {
  content: string;
  category?: string;
}


// ── Memory helpers ───────────────────────────────────────────────────────────

export async function rebuildMemoryProfile(userId: string, db: admin.firestore.Firestore) {
  const memoriesRef = db.collection("nova_memories");
  const snap = await memoriesRef
    .where("user_id", "==", userId)
    .where("active", "==", true)
    .orderBy("confidence", "desc")
    .limit(20)
    .get();

  const facts: string[] = [];
  const patterns: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.type === "pattern") patterns.push(data.content);
    else facts.push(data.content);
  }

  const topFacts = facts.slice(0, 15);
  const topPatterns = patterns.slice(0, 5);
  const memorySummary = [
    ...topFacts.map((f) => `- ${f}`),
    ...(topPatterns.length ? ["\nPatterns:", ...topPatterns.map((p) => `- ${p}`)] : []),
  ].join("\n");

  await db.collection("nova_user_profile").doc(userId).set({
    user_id: userId,
    memory_summary: memorySummary || "",
    top_facts: topFacts,
    patterns: topPatterns,
    memory_count: snap.size,
    last_updated: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}

async function mirrorFactToSharedMemory(
  userId: string,
  fact: {content: string; category?: string},
  db: admin.firestore.Firestore
) {
  const existing = await db.collection("shared_memories")
    .where("user_id", "==", userId)
    .where("content", "==", fact.content)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!existing.empty) return;

  await createSharedMemory(userId, {
    title: fact.content.length > 80 ? `${fact.content.slice(0, 77)}...` : fact.content,
    content: fact.content,
    summary: fact.content,
    type: "fact",
    source: "system",
    sourceAgent: "nova",
    createdBy: "nova_memory_extraction",
    tags: fact.category ? [fact.category, "auto-memory"] : ["auto-memory"],
    project: "save-me",
    confidence: 0.75,
    verification: "agent_suggested",
    visibility: "shared_with_agents",
    metadata: {
      pipeline: "extractAndStoreMemories",
      category: fact.category || null,
    },
  }, db);
}

export async function extractAndStoreMemories(
  userText: string,
  userId: string,
  db: admin.firestore.Firestore
) {
  // Skip very short inputs
  if (!userText || userText.trim().length < 10) return;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return;

  try {
    // Use Gemini to intelligently detect personal facts worth remembering
    const res = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: `Analyze this user statement and extract personal facts worth remembering long-term.

Statement: "${userText}"

Rules:
- Only extract DURABLE facts (names, preferences, habits, important dates, relationships, job info)
- Skip transient info (what they're doing right now, commands, questions)
- Write each fact in third person: "User's wife is Sarah" not "My wife is Sarah"
- Return JSON array: [{"content": "string", "category": "personal|health|finance|work|contacts|preferences|schedule"}]
- Return empty array [] if nothing worth remembering
- Be selective — only genuinely useful long-term facts`}]}],
        generationConfig: {maxOutputTokens: 256, temperature: 0.1, responseMimeType: "application/json", thinkingConfig: {thinkingBudget: 0}},
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let facts: ExtractedMemoryFact[];
    try {
      const parsed = JSON.parse(rawText);
      facts = Array.isArray(parsed)
        ? parsed.filter((fact): fact is ExtractedMemoryFact => Boolean(fact && typeof fact === "object" && typeof fact.content === "string"))
        : [];
    } catch {
      return;
    }

    if (!Array.isArray(facts) || facts.length === 0) return;

    const memoriesRef = db.collection("nova_memories");
    let memoryAdded = false;

    for (const fact of facts) {
      if (!fact.content) continue;

      // Check for duplicates
      const existing = await memoriesRef
        .where("user_id", "==", userId)
        .where("active", "==", true)
        .where("content", "==", fact.content)
        .limit(1)
        .get();

      if (existing.empty) {
        await memoriesRef.add({
          user_id: userId,
          type: "fact",
          content: fact.content,
          category: fact.category || null,
          source: "inferred",
          confidence: 0.75,
          access_count: 0,
          last_accessed: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          superseded_by: null,
          active: true,
        });

        try {
          await mirrorFactToSharedMemory(userId, fact, db);
        } catch (mirrorErr) {
          console.warn("[extractAndStoreMemories] Shared memory mirror failed:", mirrorErr);
        }

        memoryAdded = true;
      }
    }

    if (memoryAdded) {
      await rebuildMemoryProfile(userId, db);
    }
  } catch (err) {
    console.warn("[extractAndStoreMemories] AI extraction failed:", err);
  }
}
