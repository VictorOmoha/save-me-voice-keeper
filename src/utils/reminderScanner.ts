import { SavedEntry } from '@/types/dashboard';
import { Reminder, DailyBriefing } from '@/types/reminders';

/** Field key patterns that indicate date-related fields */
const DATE_FIELD_PATTERNS = ['date', 'expir', 'due', 'deadline', 'appointment', 'renewal', 'follow'];

/** Text patterns that indicate action items */
const ACTION_ITEM_PATTERNS = [
  /\bTODO\b/i,
  /\bASAP\b/i,
  /\bfollow\s*up\b/i,
  /\bremind\s*me\b/i,
  /\bdon'?t\s*forget\b/i,
  /\bneed\s*to\b/i,
];

/**
 * Determine the reminder type based on the field key name.
 */
function inferReminderType(fieldKey: string): Reminder['type'] {
  const key = fieldKey.toLowerCase();
  if (key.includes('expir') || key.includes('renewal')) return 'expiration';
  if (key.includes('appointment')) return 'appointment';
  if (key.includes('follow')) return 'follow_up';
  return 'expiration'; // default for generic date fields
}

/**
 * Attempt to parse a value as a Date.
 * Handles Date objects, ISO strings, timestamp numbers, and common date strings.
 */
function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    // Handle seconds-based timestamps (Firestore) vs milliseconds
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle Firestore Timestamp-like objects with toDate()
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate();
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle Firestore Timestamp-like objects with seconds/nanoseconds
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = (value as { seconds: number }).seconds;
    const d = new Date(seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Convert a field key like "expiration_date" into a human-readable label like "Expiration date".
 */
function humanizeFieldKey(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c, i) => (i === 0 ? c.toUpperCase() : c.toLowerCase()));
}

/**
 * Generate a human-readable relative time description.
 */
function relativeTimeMessage(entryTitle: string, fieldLabel: string, diffDays: number): string {
  const title = entryTitle || 'Item';

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return `${title} - ${fieldLabel} was yesterday`;
    return `${title} - ${fieldLabel} was ${absDays} days ago`;
  }

  if (diffDays === 0) return `${title} - ${fieldLabel} is today`;
  if (diffDays === 1) return `${title} - ${fieldLabel} is tomorrow`;
  return `${title} - ${fieldLabel} in ${diffDays} days`;
}

/**
 * Calculate the difference in calendar days between two dates.
 * Positive means the target is in the future; negative means it's in the past.
 */
function diffInDays(target: Date, from: Date): number {
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((targetStart.getTime() - fromStart.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Scan all entries for date-related fields and text-based action items,
 * generating a list of Reminder objects.
 */
export function scanEntriesForReminders(entries: SavedEntry[]): Reminder[] {
  const reminders: Reminder[] = [];
  const now = new Date();

  for (const entry of entries) {
    const fields = entry.fields;
    if (!fields || typeof fields !== 'object') continue;

    for (const [fieldKey, fieldValue] of Object.entries(fields)) {
      const keyLower = fieldKey.toLowerCase();

      // Check if field key matches a date-related pattern
      const isDateField = DATE_FIELD_PATTERNS.some((pattern) => keyLower.includes(pattern));

      if (isDateField) {
        const parsedDate = parseDate(fieldValue);
        if (!parsedDate) continue;

        const days = diffInDays(parsedDate, now);
        const fieldLabel = humanizeFieldKey(fieldKey);
        const message = relativeTimeMessage(entry.title, fieldLabel, days);
        const type = inferReminderType(fieldKey);

        let priority: Reminder['priority'];
        if (days < 0) {
          // Overdue
          priority = 'high';
        } else if (days === 0) {
          // Due today
          priority = 'high';
        } else if (days <= 7) {
          // Within a week
          priority = 'medium';
        } else if (days <= 30) {
          // Within a month
          priority = 'low';
        } else {
          // More than 30 days away -- skip
          continue;
        }

        reminders.push({
          id: `${entry.id}-${fieldKey}`,
          entryId: entry.id,
          entryTitle: entry.title,
          type,
          message,
          dueDate: parsedDate,
          isRead: false,
          isDismissed: false,
          priority,
        });
      }

      // Scan text fields for action item patterns
      if (typeof fieldValue === 'string' && fieldValue.length > 0) {
        for (const pattern of ACTION_ITEM_PATTERNS) {
          if (pattern.test(fieldValue)) {
            const id = `${entry.id}-${fieldKey}-action`;
            // Avoid duplicates if multiple patterns match the same field
            if (reminders.some((r) => r.id === id)) break;

            // Extract a snippet for the message (first 80 chars)
            const snippet = fieldValue.length > 80 ? fieldValue.slice(0, 77) + '...' : fieldValue;

            reminders.push({
              id,
              entryId: entry.id,
              entryTitle: entry.title,
              type: 'action_item',
              message: `${entry.title} - "${snippet}"`,
              dueDate: entry.updatedAt || new Date(),
              isRead: false,
              isDismissed: false,
              priority: 'medium',
            });
            break; // Only one action_item reminder per field
          }
        }
      }
    }
  }

  // Sort by priority (high first) then by due date (soonest first)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  reminders.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return reminders;
}

/**
 * Generate a daily briefing from a list of reminders.
 * Groups reminders into overdue, today, and upcoming (next 7 days) buckets,
 * and produces a human-readable summary.
 */
export function generateDailyBriefing(reminders: Reminder[]): DailyBriefing {
  const now = new Date();
  const overdueItems: Reminder[] = [];
  const todayItems: Reminder[] = [];
  const upcomingItems: Reminder[] = [];

  for (const reminder of reminders) {
    if (reminder.isDismissed) continue;

    const days = diffInDays(reminder.dueDate, now);

    if (reminder.type === 'action_item') {
      // Action items don't have meaningful due dates; treat as today
      todayItems.push(reminder);
    } else if (days < 0) {
      overdueItems.push(reminder);
    } else if (days === 0) {
      todayItems.push(reminder);
    } else if (days <= 7) {
      upcomingItems.push(reminder);
    }
  }

  // Build summary
  const parts: string[] = [];
  if (overdueItems.length > 0) {
    parts.push(`${overdueItems.length} overdue item${overdueItems.length === 1 ? '' : 's'}`);
  }
  if (todayItems.length > 0) {
    parts.push(`${todayItems.length} item${todayItems.length === 1 ? '' : 's'} due today`);
  }
  if (upcomingItems.length > 0) {
    parts.push(`${upcomingItems.length} upcoming this week`);
  }

  const summary = parts.length > 0
    ? `You have ${parts.join(' and ')}`
    : 'No upcoming reminders - you\'re all caught up!';

  return {
    date: now,
    overdueItems,
    todayItems,
    upcomingItems,
    summary,
  };
}
