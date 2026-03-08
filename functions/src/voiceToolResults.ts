export type VoiceToolResult = Record<string, any>;

export const ok = (data: Record<string, any> = {}): VoiceToolResult => ({
  success: true,
  data,
});

export const fail = (error: string, data: Record<string, any> = {}): VoiceToolResult => ({
  success: false,
  error,
  data,
});

export const command = (
  appCommand: string,
  fields: Record<string, any> = {},
  data: Record<string, any> = {}
): VoiceToolResult => ({
  success: true,
  appCommand,
  ...fields,
  data,
});

export const novaAction = (
  actionType: string,
  actionData: Record<string, any>,
  data: Record<string, any> = {}
): VoiceToolResult => ({
  success: true,
  appCommand: "novaAction",
  actionType,
  actionData,
  data,
});
