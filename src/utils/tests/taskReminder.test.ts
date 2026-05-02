import { describe, expect, it } from "vitest";
import { buildTaskReminderDoc, getTaskReminderValidationError } from "@/utils/taskReminder";

describe("task reminder utilities", () => {
  it("rejects an empty task", () => {
    expect(getTaskReminderValidationError("", "2026-05-02T09:30")).toBe("Task is required");
  });

  it("rejects missing reminder date and time", () => {
    expect(getTaskReminderValidationError("Call the client", "")).toBe("Reminder date and time are required");
  });

  it("rejects a past reminder time", () => {
    expect(
      getTaskReminderValidationError("Call the client", "2026-05-01T08:00", new Date("2026-05-01T10:00:00"))
    ).toBe("Reminder time must be in the future");
  });

  it("builds the Firestore reminder document for a future task", () => {
    const scheduledAt = new Date("2026-05-02T09:30:00");
    expect(buildTaskReminderDoc("user-123", "  Call the client  ", scheduledAt)).toMatchObject({
      user_id: "user-123",
      text: "Call the client",
      task_text: "Call the client",
      notification_text: "Reminder: Call the client",
      type: "task_reminder",
      source: "manual_task_reminder",
      status: "pending",
      entry_id: null,
      action_item_id: null,
    });
  });
});
