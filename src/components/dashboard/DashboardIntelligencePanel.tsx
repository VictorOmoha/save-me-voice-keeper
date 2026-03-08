import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Link2, BellRing, CheckSquare, ArrowRight, Sparkles, Radar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { SavedEntry } from "@/types/dashboard";
import { useNavigate } from "react-router-dom";

type ReminderItem = {
  id: string;
  text: string;
  remind_at?: Date | null;
  status?: string;
  entry_id?: string | null;
};

type LinkedEntry = {
  id: string;
  target_entry_id?: string;
  score?: number;
};

type MemoryItem = {
  id: string;
  content: string;
  category?: string | null;
};

type ActionableItem = {
  entryId: string;
  entryTitle: string;
  text: string;
};

interface DashboardIntelligencePanelProps {
  entries: SavedEntry[];
}

const parseActionItemText = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text?: string }).text || "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const DashboardIntelligencePanel: React.FC<DashboardIntelligencePanelProps> = ({ entries }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [linkedCount, setLinkedCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const actionItems: ActionableItem[] = useMemo(() => {
    return entries
      .flatMap((entry) => {
        const extracted = parseActionItemText((entry as SavedEntry & { action_items?: unknown }).action_items);
        const fieldBased = parseActionItemText(entry.fields?.actionItems);
        const combined = [...extracted, ...fieldBased].filter(Boolean);
        return combined.map((text) => ({ entryId: entry.id, entryTitle: entry.title, text }));
      })
      .slice(0, 6);
  }, [entries]);

  const recentIntelligence = useMemo(() => {
    return entries
      .filter((entry) => {
        const summary = (entry as SavedEntry & { summary?: string }).summary;
        const linked = (entry as SavedEntry & { linked_entries?: string[] }).linked_entries;
        const tags = (entry as SavedEntry & { tags?: string[] }).tags;
        return Boolean(summary || (linked && linked.length) || (tags && tags.length));
      })
      .slice(0, 3);
  }, [entries]);

  const briefingLines = useMemo(() => {
    const lines: string[] = [];

    if (reminders.length > 0) {
      lines.push(`${reminders.length} active reminder${reminders.length > 1 ? "s" : ""} need attention.`);
    }

    if (actionItems.length > 0) {
      lines.push(`${actionItems.length} extracted action item${actionItems.length > 1 ? "s" : ""} surfaced from recent entries.`);
    }

    if (recentIntelligence.length > 0) {
      lines.push(`${recentIntelligence.length} enriched entr${recentIntelligence.length > 1 ? "ies are" : "y is"} ready for follow-up.`);
    }

    if (memoryCount > 0) {
      lines.push(`Nova is carrying ${memoryCount} active memor${memoryCount === 1 ? "y" : "ies"} for continuity.`);
    }

    if (lines.length === 0) {
      lines.push("The intelligence layer is warming up. Save more context and Nova will start surfacing stronger signals.");
    }

    return lines.slice(0, 3);
  }, [reminders, actionItems, recentIntelligence, memoryCount]);

  const openEntry = (entryId?: string | null) => {
    if (!entryId) return;
    navigate(`/all-entries/${entryId}`);
  };

  useEffect(() => {
    const loadIntelligence = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [remindersSnap, linksSnap, memoriesSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "reminders"),
              where("user_id", "==", user.uid),
              where("status", "in", ["pending", "scheduled"]),
              orderBy("remind_at", "asc"),
              limit(5)
            )
          ).catch(() => ({ docs: [] } as Awaited<ReturnType<typeof getDocs>>)),
          getDocs(
            query(
              collection(db, "entry_links"),
              where("user_id", "==", user.uid),
              limit(20)
            )
          ).catch(() => ({ docs: [] } as Awaited<ReturnType<typeof getDocs>>)),
          getDocs(
            query(
              collection(db, "nova_memories"),
              where("user_id", "==", user.uid),
              where("active", "==", true),
              limit(50)
            )
          ).catch(() => ({ docs: [] } as Awaited<ReturnType<typeof getDocs>>)),
        ]);

        const loadedReminders: ReminderItem[] = remindersSnap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          return {
            id: docSnap.id,
            text: String(data.text || data.title || "Reminder"),
            remind_at: data.remind_at?.toDate?.() || null,
            status: data.status,
            entry_id: data.entry_id || data.entryId || null,
          };
        });

        const loadedLinks: LinkedEntry[] = linksSnap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          return {
            id: docSnap.id,
            target_entry_id: data.target_entry_id,
            score: data.score,
          };
        });

        const loadedMemories: MemoryItem[] = memoriesSnap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          return {
            id: docSnap.id,
            content: String(data.content || ""),
            category: data.category || null,
          };
        });

        setReminders(loadedReminders);
        setLinkedCount(loadedLinks.length);
        setMemoryCount(loadedMemories.length);
      } finally {
        setIsLoading(false);
      }
    };

    loadIntelligence();
  }, [user, entries.length]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            Daily Briefing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {briefingLines.map((line, index) => (
            <p key={index} className="text-sm text-foreground">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Intelligence Layer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What Nova knows, what needs attention, and what is connected.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/briefing") }>
            Open Briefing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/insights") }>
            Open Insights
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-500" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading reminders…</p>
            ) : reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active reminders yet.</p>
            ) : (
              reminders.map((reminder) => (
                <button
                  key={reminder.id}
                  type="button"
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => openEntry(reminder.entry_id)}
                  disabled={!reminder.entry_id}
                >
                  <p className="text-sm font-medium text-foreground">{reminder.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reminder.remind_at ? reminder.remind_at.toLocaleString() : "Scheduled"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-500" />
              Extracted Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No extracted action items yet.</p>
            ) : (
              actionItems.map((item, index) => (
                <button
                  key={`${item.entryId}-${index}`}
                  type="button"
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => openEntry(item.entryId)}
                >
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">From: {item.entryTitle}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Nova Memory & Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              onClick={() => navigate("/settings?tab=nova-memory")}
            >
              <div>
                <p className="text-sm font-medium">Memories Stored</p>
                <p className="text-xs text-muted-foreground">Personal facts Nova can recall</p>
              </div>
              <Badge variant="secondary">{memoryCount}</Badge>
            </button>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Linked Entry Graph</p>
                <p className="text-xs text-muted-foreground">Known relationships between entries</p>
              </div>
              <Badge variant="secondary">{linkedCount}</Badge>
            </div>

            <div className="space-y-2">
              {recentIntelligence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enriched entries surfaced yet.</p>
              ) : (
                recentIntelligence.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => openEntry(entry.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                      <p className="text-sm font-medium">{entry.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {((entry as SavedEntry & { summary?: string }).summary) || "Enriched entry ready for deeper intelligence surfaces."}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardIntelligencePanel;
