import * as admin from "firebase-admin";
import { command, VoiceToolResult } from "../voiceToolResults";

export async function handleSettingsTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  db: admin.firestore.Firestore
): Promise<VoiceToolResult | null> {
  const prefsRef = db.collection("user_preferences").doc(userId);

  switch (toolName) {
  case "updateTheme": {
    await prefsRef.set({theme: args.theme}, {merge: true});
    return command("updateTheme", { theme: args.theme }, { theme: args.theme });
  }

  case "updateProfile": {
    const profileRef = db.collection("profiles").doc(userId);
    const updates: Record<string, unknown> = {};
    const fullName = typeof args.fullName === "string" ? args.fullName : undefined;
    const phone = typeof args.phone === "string" ? args.phone : undefined;

    if (fullName) updates.fullName = fullName;
    if (phone) updates.phone = phone;

    await profileRef.set(updates, {merge: true});
    if (fullName) {
      await admin.auth().updateUser(userId, {displayName: fullName});
    }
    return command("settingsUpdated", { setting: "profile" }, { setting: "profile", updates });
  }

  case "toggleNotification": {
    const notificationType = typeof args.type === "string" ? args.type : "";
    const enabled = typeof args.enabled === "boolean" ? args.enabled : false;
    await prefsRef.set({[notificationType]: enabled}, {merge: true});
    return command("settingsUpdated", { setting: notificationType, value: enabled }, { setting: notificationType, value: enabled });
  }

  case "updateVoiceSettings": {
    const voiceUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        voiceUpdates[key] = value;
      }
    }
    await prefsRef.set(voiceUpdates, {merge: true});
    return command("settingsUpdated", { setting: "voice", updates: voiceUpdates }, { setting: "voice", updates: voiceUpdates });
  }

  case "exportUserData": {
    return command("exportData", { format: args.format || "json" }, { format: args.format || "json" });
  }

  default:
    return null;
  }
}
