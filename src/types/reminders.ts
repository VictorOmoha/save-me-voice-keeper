export interface Reminder {
  id: string;
  entryId: string;
  entryTitle: string;
  type: 'expiration' | 'appointment' | 'action_item' | 'follow_up';
  message: string;
  dueDate: Date;
  isRead: boolean;
  isDismissed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface DailyBriefing {
  date: Date;
  overdueItems: Reminder[];
  todayItems: Reminder[];
  upcomingItems: Reminder[];  // next 7 days
  summary: string;
}
