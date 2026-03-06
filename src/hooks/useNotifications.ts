import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "./useAuthState";

export type NotificationType = "reminder" | "action_due" | "system" | "nova_insight";

export type InsightType = "connection" | "pattern" | "gap" | "reminder";

export interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  entryId?: string | null;
  entryIds?: string[];
  insightType?: InsightType;
  status: "pending" | "dismissed";
  createdAt: Date;
}

const INSIGHT_ICON: Record<InsightType, string> = {
  connection: "🔗",
  pattern: "🧩",
  gap: "🕳️",
  reminder: "💡",
};

export const getInsightIcon = (insightType?: InsightType): string =>
  insightType ? (INSIGHT_ICON[insightType] ?? "✨") : "✨";

export const useNotifications = () => {
  const { user } = useAuthState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => n.status === "pending").length;
  const insights = notifications.filter((n) => n.type === "nova_insight");
  const systemNotifs = notifications.filter((n) => n.type !== "nova_insight");

  // ── Real-time listener (replaces polling) ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "pending_notifications"),
      where("user_id", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("created_at", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotifications(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: (data.type || "reminder") as NotificationType,
              text: data.text,
              entryId: data.entry_id || null,
              entryIds: data.entry_ids || [],
              insightType: data.insight_type as InsightType | undefined,
              status: data.status,
              createdAt: data.created_at?.toDate() || new Date(),
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.warn("[useNotifications] Snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // ── Dismiss single ────────────────────────────────────────────────────────
  const dismiss = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "pending_notifications", notificationId), {
        status: "dismissed",
      });
      // Optimistic update (snapshot will also confirm)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.warn("[useNotifications] Failed to dismiss:", err);
    }
  }, []);

  // ── Dismiss all ───────────────────────────────────────────────────────────
  const dismissAll = useCallback(async () => {
    if (!notifications.length) return;
    const batch = writeBatch(db);
    for (const n of notifications) {
      batch.update(doc(db, "pending_notifications", n.id), { status: "dismissed" });
    }
    try {
      await batch.commit();
      setNotifications([]);
    } catch (err) {
      console.warn("[useNotifications] Failed to dismiss all:", err);
    }
  }, [notifications]);

  return {
    notifications,
    insights,
    systemNotifs,
    unreadCount,
    loading,
    dismiss,
    dismissAll,
  };
};
