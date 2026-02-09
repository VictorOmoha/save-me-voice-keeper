import React from 'react';
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SavedEntry } from '@/types/dashboard';
import { Reminder } from '@/types/reminders';
import { useReminders } from '@/hooks/useReminders';
import { Link } from 'react-router-dom';

interface NotificationCenterProps {
  entries: SavedEntry[];
}

/**
 * Returns a relative time string for display, e.g. "in 3 days", "2 days overdue", "today".
 */
function formatRelativeTime(dueDate: Date): string {
  const now = new Date();
  const targetStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((targetStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === -1) return '1 day overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays} days`;
}

/**
 * Returns the appropriate icon for a reminder based on its type and priority.
 */
function ReminderIcon({ reminder }: { reminder: Reminder }) {
  if (reminder.priority === 'high') {
    return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
  }
  if (reminder.type === 'appointment') {
    return <Calendar className="w-4 h-4 text-yellow-500 shrink-0" />;
  }
  if (reminder.type === 'action_item') {
    return <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />;
  }
  return <Clock className="w-4 h-4 text-muted-foreground shrink-0" />;
}

/**
 * A single reminder item card.
 */
function ReminderCard({
  reminder,
  onMarkRead,
  onDismiss,
}: {
  reminder: Reminder;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const relativeTime = reminder.type === 'action_item' ? 'action item' : formatRelativeTime(reminder.dueDate);

  return (
    <div
      className={`flex items-start gap-3 p-3 border-b border-galvanized last:border-b-0 hover:bg-primary/5 transition-colors ${
        !reminder.isRead ? 'bg-primary/5' : ''
      }`}
      onClick={() => onMarkRead(reminder.id)}
    >
      <ReminderIcon reminder={reminder} />
      <div className="flex-1 min-w-0">
        <Link
          to={`/all-entries/${reminder.entryId}`}
          className="mono text-xs text-foreground hover:text-primary transition-colors block truncate"
        >
          {reminder.message}
        </Link>
        <span className={`mono text-[10px] mt-1 block ${
          reminder.priority === 'high' ? 'text-red-500' :
          reminder.priority === 'medium' ? 'text-yellow-500' :
          'text-muted-foreground'
        }`}>
          {relativeTime.toUpperCase()}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(reminder.id);
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
        aria-label="Dismiss reminder"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/**
 * Section header for grouping reminders.
 */
function SectionHeader({ label, color, count }: { label: string; color: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className={`mono text-[10px] font-bold tracking-wider px-3 py-2 border-b border-galvanized ${color}`}>
      {label} ({count})
    </div>
  );
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ entries }) => {
  const {
    reminders,
    briefing,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
  } = useReminders(entries);

  const hasReminders = reminders.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative btn-galvanized btn-galvanized-secondary"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center mono">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 bg-card border border-galvanized"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-galvanized">
          <span className="mono text-xs font-bold text-foreground tracking-wider">
            NOTIFICATIONS
          </span>
          {hasReminders && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                MARK_READ
              </button>
              <span className="text-galvanized">|</span>
              <button
                onClick={dismissAll}
                className="mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                DISMISS_ALL
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        {hasReminders && (
          <div className="px-3 py-2 border-b border-galvanized bg-primary/5">
            <p className="mono text-[10px] text-muted-foreground">
              {briefing.summary}
            </p>
          </div>
        )}

        {/* Reminder list */}
        {hasReminders ? (
          <ScrollArea className="max-h-80">
            {/* Overdue section */}
            <SectionHeader label="OVERDUE" color="text-red-500" count={briefing.overdueItems.length} />
            {briefing.overdueItems.map((r) => (
              <ReminderCard key={r.id} reminder={r} onMarkRead={markAsRead} onDismiss={dismiss} />
            ))}

            {/* Today section */}
            <SectionHeader label="TODAY" color="text-yellow-500" count={briefing.todayItems.length} />
            {briefing.todayItems.map((r) => (
              <ReminderCard key={r.id} reminder={r} onMarkRead={markAsRead} onDismiss={dismiss} />
            ))}

            {/* Upcoming section */}
            <SectionHeader label="UPCOMING" color="text-blue-400" count={briefing.upcomingItems.length} />
            {briefing.upcomingItems.map((r) => (
              <ReminderCard key={r.id} reminder={r} onMarkRead={markAsRead} onDismiss={dismiss} />
            ))}

            {/* Items beyond 7 days that are still within 30 days (low priority) */}
            {(() => {
              const laterItems = reminders.filter((r) => {
                const isOverdue = briefing.overdueItems.some((o) => o.id === r.id);
                const isToday = briefing.todayItems.some((t) => t.id === r.id);
                const isUpcoming = briefing.upcomingItems.some((u) => u.id === r.id);
                return !isOverdue && !isToday && !isUpcoming;
              });
              if (laterItems.length === 0) return null;
              return (
                <>
                  <SectionHeader label="LATER" color="text-muted-foreground" count={laterItems.length} />
                  {laterItems.map((r) => (
                    <ReminderCard key={r.id} reminder={r} onMarkRead={markAsRead} onDismiss={dismiss} />
                  ))}
                </>
              );
            })()}
          </ScrollArea>
        ) : (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="mono text-xs text-muted-foreground">
              No reminders - you're all caught up!
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
