import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SavedEntry } from '@/types/dashboard';
import { useReminders } from '@/hooks/useReminders';
import { Link } from 'react-router-dom';

interface UpcomingItemsWidgetProps {
  entries: SavedEntry[];
  maxItems?: number;
}

/**
 * Format a date for compact display, e.g. "Feb 12" or "Mar 3".
 */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Returns a relative time string for display.
 */
function formatRelativeTime(dueDate: Date): string {
  const now = new Date();
  const targetStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((targetStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === -1) return '1d overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays}d`;
}

export const UpcomingItemsWidget: React.FC<UpcomingItemsWidgetProps> = ({
  entries,
  maxItems = 5,
}) => {
  const { reminders } = useReminders(entries);

  // Filter to only date-based reminders (not action items) and take the first N
  const dateReminders = reminders
    .filter((r) => r.type !== 'action_item')
    .slice(0, maxItems);

  return (
    <Card className="border-galvanized bg-card">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="mono text-xs font-bold tracking-wider text-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            UPCOMING
          </CardTitle>
          {dateReminders.length > 0 && (
            <span className="mono text-[10px] text-muted-foreground">
              {dateReminders.length} ITEM{dateReminders.length !== 1 ? 'S' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {dateReminders.length > 0 ? (
          <div className="space-y-0">
            {dateReminders.map((reminder) => {
              const relTime = formatRelativeTime(reminder.dueDate);
              const isOverdue = reminder.dueDate < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <Link
                  key={reminder.id}
                  to={`/all-entries/${reminder.entryId}`}
                  className="flex items-center gap-3 py-2 border-b border-galvanized last:border-b-0 hover:bg-primary/5 transition-colors group"
                >
                  <div className="shrink-0 w-12 text-center">
                    <span className={`mono text-[10px] font-bold ${
                      isOverdue ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {formatShortDate(reminder.dueDate).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mono text-xs text-foreground truncate">
                      {reminder.message}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span className={`mono text-[10px] ${
                      isOverdue ? 'text-red-500' :
                      relTime === 'today' ? 'text-yellow-500' :
                      'text-muted-foreground'
                    }`}>
                      {relTime.toUpperCase()}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="mono text-[10px] text-muted-foreground">
              No upcoming dates found
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
