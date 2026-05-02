import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { buildTaskReminderDoc, getTaskReminderValidationError } from "@/utils/taskReminder";

export interface CreateTaskReminderInput {
  taskText: string;
  scheduledAtInput: string;
}

export const taskReminderService = {
  createTaskReminder: async ({ taskText, scheduledAtInput }: CreateTaskReminderInput) => {
    const user = auth.currentUser;
    if (!user) {
      return { reminderId: null, error: "User not authenticated" };
    }

    const validationError = getTaskReminderValidationError(taskText, scheduledAtInput);
    if (validationError) {
      return { reminderId: null, error: validationError };
    }

    const scheduledAt = new Date(scheduledAtInput);
    const reminder = buildTaskReminderDoc(user.uid, taskText, scheduledAt);
    const docRef = await addDoc(collection(db, "reminders"), {
      ...reminder,
      trigger_at: Timestamp.fromDate(reminder.trigger_at),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return { reminderId: docRef.id, error: null };
  },
};
