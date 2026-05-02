export type TaskReminderSource = "manual_task_reminder" | "voice_agent";

export interface TaskReminderDoc {
  user_id: string;
  text: string;
  task_text: string;
  notification_text: string;
  type: "task_reminder";
  source: TaskReminderSource;
  trigger_at: Date;
  status: "pending";
  entry_id: string | null;
  action_item_id: string | null;
}

export const getTaskReminderValidationError = (
  taskText: string,
  scheduledAtInput: string,
  now: Date = new Date()
): string | null => {
  if (!taskText.trim()) return "Task is required";
  if (!scheduledAtInput.trim()) return "Reminder date and time are required";

  const scheduledAt = new Date(scheduledAtInput);
  if (Number.isNaN(scheduledAt.getTime())) return "Reminder date and time are invalid";
  if (scheduledAt.getTime() <= now.getTime()) return "Reminder time must be in the future";

  return null;
};

export const buildTaskReminderDoc = (
  userId: string,
  taskText: string,
  scheduledAt: Date,
  source: TaskReminderSource = "manual_task_reminder"
): TaskReminderDoc => {
  const normalizedTask = taskText.trim();

  return {
    user_id: userId,
    text: normalizedTask,
    task_text: normalizedTask,
    notification_text: `Reminder: ${normalizedTask}`,
    type: "task_reminder",
    source,
    trigger_at: scheduledAt,
    status: "pending",
    entry_id: null,
    action_item_id: null,
  };
};
