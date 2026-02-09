import { useState, useEffect, useCallback, useMemo } from 'react';
import { SavedEntry } from '@/types/dashboard';
import { Reminder, DailyBriefing } from '@/types/reminders';
import { scanEntriesForReminders, generateDailyBriefing } from '@/utils/reminderScanner';

const STORAGE_KEY = 'saveme-reminders-state';

interface ReminderPersistedState {
  readIds: string[];
  dismissedIds: string[];
}

function loadPersistedState(): ReminderPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
        dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds : [],
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { readIds: [], dismissedIds: [] };
}

function savePersistedState(state: ReminderPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useReminders(entries: SavedEntry[]) {
  const [persistedState, setPersistedState] = useState<ReminderPersistedState>(loadPersistedState);

  // Scan entries whenever they change
  const scannedReminders = useMemo(() => scanEntriesForReminders(entries), [entries]);

  // Apply persisted read/dismissed state to scanned reminders, then filter out dismissed
  const reminders = useMemo(() => {
    return scannedReminders
      .map((r) => ({
        ...r,
        isRead: persistedState.readIds.includes(r.id),
        isDismissed: persistedState.dismissedIds.includes(r.id),
      }))
      .filter((r) => !r.isDismissed);
  }, [scannedReminders, persistedState]);

  // Generate briefing from active (non-dismissed) reminders
  const briefing: DailyBriefing = useMemo(() => generateDailyBriefing(reminders), [reminders]);

  // Count unread reminders
  const unreadCount = useMemo(() => reminders.filter((r) => !r.isRead).length, [reminders]);

  // Persist state changes to localStorage
  useEffect(() => {
    savePersistedState(persistedState);
  }, [persistedState]);

  const markAsRead = useCallback((id: string) => {
    setPersistedState((prev) => {
      if (prev.readIds.includes(id)) return prev;
      return { ...prev, readIds: [...prev.readIds, id] };
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setPersistedState((prev) => {
      if (prev.dismissedIds.includes(id)) return prev;
      return { ...prev, dismissedIds: [...prev.dismissedIds, id] };
    });
  }, []);

  const dismissAll = useCallback(() => {
    setPersistedState((prev) => {
      const allIds = scannedReminders.map((r) => r.id);
      const newDismissed = Array.from(new Set([...prev.dismissedIds, ...allIds]));
      return { ...prev, dismissedIds: newDismissed };
    });
  }, [scannedReminders]);

  const markAllAsRead = useCallback(() => {
    setPersistedState((prev) => {
      const allIds = reminders.map((r) => r.id);
      const newRead = Array.from(new Set([...prev.readIds, ...allIds]));
      return { ...prev, readIds: newRead };
    });
  }, [reminders]);

  const refreshReminders = useCallback(() => {
    // Reset persisted state to re-evaluate all reminders
    setPersistedState(loadPersistedState());
  }, []);

  return {
    reminders,
    briefing,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    refreshReminders,
  };
}
