import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Memory {
  id: string;
  content: string;
  category: string | null;
  type: string;
  source: "explicit" | "inferred";
  confidence: number;
  created_at: { toMillis?: () => number } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  personal: "Personal",
  health: "Health",
  finance: "Finance",
  work: "Work",
  contacts: "Contacts",
  preferences: "Preferences",
  schedule: "Schedule",
};

export const NovaMemorySettings = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "nova_memories"),
        where("user_id", "==", user.uid),
        where("active", "==", true)
      );
      const snap = await getDocs(q);
      const loaded = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Memory, "id">),
      }));
      // Sort by created_at descending
      loaded.sort((a, b) => {
        const aTime = a.created_at?.toMillis?.() || 0;
        const bTime = b.created_at?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setMemories(loaded);
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleDelete = async (memoryId: string) => {
    setDeletingId(memoryId);
    try {
      await updateDoc(doc(db, "nova_memories", memoryId), {
        active: false,
        updated_at: serverTimestamp(),
      });
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      toast.success("Memory removed");
    } catch (err) {
      console.error("Failed to delete memory:", err);
      toast.error("Failed to remove memory");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all of Nova's memories about you?")) return;
    setIsLoading(true);
    try {
      const batch: Promise<void>[] = memories.map((m) =>
        updateDoc(doc(db, "nova_memories", m.id), {
          active: false,
          updated_at: serverTimestamp(),
        })
      );
      await Promise.all(batch);
      setMemories([]);
      toast.success("All memories cleared");
    } catch (err) {
      console.error("Failed to clear memories:", err);
      toast.error("Failed to clear memories");
    } finally {
      setIsLoading(false);
    }
  };

  // Group memories by category
  const grouped = memories.reduce<Record<string, Memory[]>>((acc, mem) => {
    const cat = mem.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mem);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Nova's Memory
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Things Nova remembers about you across conversations
            </p>
          </div>
          {memories.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
              disabled={isLoading}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No memories yet</p>
            <p className="text-xs mt-1">
              Talk to Nova and share personal details — she'll remember them for next time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, mems]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <div className="space-y-2">
                  {mems.map((mem) => (
                    <div
                      key={mem.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{mem.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {mem.source === "explicit" ? "You told me" : "I noticed"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDelete(mem.id)}
                        disabled={deletingId === mem.id}
                      >
                        {deletingId === mem.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {memories.length} {memories.length === 1 ? "memory" : "memories"} stored
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
