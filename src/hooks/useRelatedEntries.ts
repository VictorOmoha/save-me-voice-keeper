import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "./useAuthState";

interface RelatedEntry {
  id: string;
  title: string;
  category?: string;
  summary?: string;
  strength?: number;
}

export const useRelatedEntries = (entryId: string | null) => {
  const { user } = useAuthState();
  const [relatedEntries, setRelatedEntries] = useState<RelatedEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId || !user) {
      setRelatedEntries([]);
      return;
    }

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const relatedIds = new Set<string>();

        // Get outgoing links
        const linksQuery = query(
          collection(db, "entry_links"),
          where("user_id", "==", user.uid),
          where("source_entry_id", "==", entryId),
          orderBy("strength", "desc"),
          limit(5)
        );
        const linksSnap = await getDocs(linksQuery);
        linksSnap.docs.forEach((d) => relatedIds.add(d.data().target_entry_id));

        // Get incoming links
        const reverseQuery = query(
          collection(db, "entry_links"),
          where("user_id", "==", user.uid),
          where("target_entry_id", "==", entryId),
          orderBy("strength", "desc"),
          limit(5)
        );
        const reverseSnap = await getDocs(reverseQuery);
        reverseSnap.docs.forEach((d) => relatedIds.add(d.data().source_entry_id));

        // Fetch entry details
        const entries: RelatedEntry[] = [];
        for (const id of Array.from(relatedIds).slice(0, 5)) {
          const entryDoc = await getDoc(doc(db, "entries", id));
          if (entryDoc.exists()) {
            const data = entryDoc.data();
            entries.push({
              id,
              title: data.title,
              category: data.category || data.fields?.category,
              summary: data.summary,
            });
          }
        }

        setRelatedEntries(entries);
      } catch (err) {
        console.warn("Failed to fetch related entries:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [entryId, user]);

  return { relatedEntries, loading };
};
