import { FormEvent, useState } from "react";
import { AlarmClock, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { taskReminderService } from "@/services/taskReminderService";

const getDefaultReminderTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

export const TaskReminderCard = () => {
  const [taskText, setTaskText] = useState("");
  const [scheduledAtInput, setScheduledAtInput] = useState(getDefaultReminderTime);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const result = await taskReminderService.createTaskReminder({ taskText, scheduledAtInput });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Task reminder set. SaveMe will notify you when it is time.");
      setTaskText("");
      setScheduledAtInput(getDefaultReminderTime());

      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch (error) {
      console.error("Failed to create task reminder:", error);
      toast.error("Failed to set task reminder");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 md:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <AlarmClock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary mb-1">
            <CalendarClock className="w-3.5 h-3.5" />
            Task reminders
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">Set a task alarm</h3>
          <p className="text-sm text-muted-foreground">
            Add what you need to do, choose the date and time, and SaveMe will surface the reminder in notifications.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="task-reminder-text">Task</Label>
          <Textarea
            id="task-reminder-text"
            value={taskText}
            onChange={(event) => setTaskText(event.target.value)}
            placeholder="Remind me to call the client"
            className="min-h-[44px] md:min-h-[40px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-reminder-time">Date and time</Label>
          <Input
            id="task-reminder-time"
            type="datetime-local"
            value={scheduledAtInput}
            onChange={(event) => setScheduledAtInput(event.target.value)}
          />
        </div>

        <Button type="submit" disabled={saving} className="md:mb-0">
          {saving ? "Setting..." : "Set reminder"}
        </Button>
      </form>
    </section>
  );
};
