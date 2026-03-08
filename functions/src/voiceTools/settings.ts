import * as admin from "firebase-admin";
import { command, VoiceToolResult } from "../voiceToolResults";

export async function handleSettingsTool(
  toolName: string,
  args: Record<string, any>,
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
    const updates: Record<string, any> = {};
    if (args.fullName) updates.fullName = args.fullName;
    if (args.phone) updates.phone = args.phone;
    await profileRef.set(updates, {merge: true});
    if (args.fullName) {
      await admin.auth().updateUser(userId, {displayName: args.fullName});
    }
    return command("settingsUpdated", { setting: "profile" }, { setting: "profile", updates });
  }

  case "toggleNotification": {
    await prefsRef.set({[args.type]: args.enabled}, {merge: true});
    return command("settingsUpdated", { setting: args.type, value: args.enabled }, { setting: args.type, value: args.enabled });
  }

  case "updateVoiceSettings": {
    const voiceUpdates: Record<string, any> = {};
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
