import * as admin from "firebase-admin";
import {fetchWithRetry} from "../common/fetchWithRetry";

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Predict the best category for an entry based on user's history + learned patterns.
 * Returns { predicted, confidence } — confidence >= 0.7 means Nova is sure enough to auto-file.
 */
export async function predictCategory(
  userId: string,
  title: string,
  content: string,
  db: admin.firestore.Firestore,
  geminiKey: string
): Promise<{predicted: string; confidence: number}> {
  try {
    // Fetch user's category history (last 60 entries)
    const entriesSnap = await db.collection("entries")
      .where("user_id", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(60)
      .get();

    if (entriesSnap.empty) return {predicted: "Personal", confidence: 0.5};

    // Build category frequency + examples map
    const categoryCounts: Record<string, number> = {};
    const categoryExamples: Record<string, string[]> = {};
    for (const d of entriesSnap.docs) {
      const data = d.data();
      const cat = (data.category || "Personal") as string;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (!categoryExamples[cat]) categoryExamples[cat] = [];
      if (categoryExamples[cat].length < 3 && data.title) {
        categoryExamples[cat].push(data.title as string);
      }
    }

    const categoryList = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => {
        const examples = (categoryExamples[cat] || []).join(", ");
        return `${cat} (${count} entries${examples ? `, e.g. "${examples}"` : ""})`;
      })
      .join("\n");

    // Fetch learned patterns from corrections/feedback (gracefully handle missing index)
    let learnedPatterns = "";
    try {
      const patternsSnap = await db.collection("user_category_patterns")
        .where("user_id", "==", userId)
        .orderBy("weight", "desc")
        .limit(30)
        .get();

      learnedPatterns = patternsSnap.docs.map((d) => {
        const data = d.data();
        return `"${data.signal}" → ${data.category} (strength: ${Math.round((data.weight || 1) * 10) / 10})`;
      }).join("\n");
    } catch (patternsErr) {
      console.warn("[predictCategory] Could not fetch learned patterns (index building?):", patternsErr instanceof Error ? patternsErr.message : String(patternsErr));
    }

    const prompt = `You are Nova, predicting the best category for a personal knowledge vault entry.

User's existing categories:
${categoryList}
${learnedPatterns ? `\nLearned patterns from this user's corrections:\n${learnedPatterns}` : ""}

Entry to categorize:
Title: "${title}"
Content: "${(content || "").slice(0, 200)}"

Rules:
- Pick from the user's EXISTING categories whenever possible
- Only suggest a new category if no existing one fits at all
- Confidence 0.9+ = very obvious (e.g. "blood pressure" → Health)
- Confidence 0.7-0.89 = good fit with some reasoning
- Confidence < 0.7 = uncertain, do not auto-file

Return JSON only: {"category": "string", "confidence": 0.0}`;

    const res = await fetchWithRetry(`${GEMINI_API}?key=${geminiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: prompt}]}],
        generationConfig: {
          maxOutputTokens: 64,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) return {predicted: "Personal", confidence: 0.5};

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText);
    return {
      predicted: (parsed.category as string) || "Personal",
      confidence: (parsed.confidence as number) || 0.5,
    };
  } catch (err) {
    console.warn("[predictCategory] Failed:", err);
    return {predicted: "Personal", confidence: 0.5};
  }
}

/**
 * Record a category correction/confirmation to strengthen Nova's learning model.
 * Call this when: (a) user corrects Nova's category prediction, or (b) Nova's prediction is confirmed.
 */
export async function recordCategorySignal(
  userId: string,
  title: string,
  content: string,
  correctCategory: string,
  wasCorrection: boolean,
  db: admin.firestore.Firestore
): Promise<void> {
  try {
    // Extract signals from title + content (lowercased words, 3+ chars)
    const text = `${title} ${content || ""}`.toLowerCase();
    const signals = [...new Set(
      text.split(/\W+/).filter((w) => w.length >= 3 && w.length <= 20)
    )].slice(0, 15);

    const weight = wasCorrection ? 1.5 : 1.0; // corrections carry more weight

    const batch = db.batch();
    for (const signal of signals) {
      const docId = `${userId}_${signal}_${correctCategory}`.replace(/[^a-z0-9_]/g, "_");
      const ref = db.collection("user_category_patterns").doc(docId);
      batch.set(ref, {
        user_id: userId,
        signal,
        category: correctCategory,
        weight: admin.firestore.FieldValue.increment(weight),
        count: admin.firestore.FieldValue.increment(1),
        was_correction: wasCorrection,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    }
    await batch.commit();
  } catch (err) {
    console.warn("[recordCategorySignal] Failed:", err);
  }
}
