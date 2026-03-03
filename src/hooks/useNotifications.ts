import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "./useAuthState";

export interface Notification {
  id: string;
  type: "reminder" | "action_due" | "system";
  text: string;
  entryId?: string | null;
  status: "pending" | "dismissed";
  createdAt: Date;
}

export const useNotifications = () => {
  const { user } = useAuthState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter((n) => n.status === "pending").length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "pending_notifications"),
        where("user_id", "==", user.uid),
        where("status", "==", "pending"),
        orderBy("created_at", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      setNotifications(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type || "reminder",
            text: data.text,
            entryId: data.entry_id || null,
            status: data.status,
            createdAt: data.created_at?.toDate() || new Date(),
          };
        })
      );
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const dismiss = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "pending_notifications", notificationId), {
        status: "dismissed",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.warn("Failed to dismiss notification:", err);
    }
  }, []);

  const dismissAll = useCallback(async () => {
    for (const n of notifications) {
      await updateDoc(doc(db, "pending_notifications", n.id), {
        status: "dismissed",
      }).catch(() => {});
    }
    setNotifications([]);
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, dismiss, dismissAll, refresh: fetchNotifications };
};
