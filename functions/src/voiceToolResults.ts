export type VoiceToolResult = Record<string, unknown>;

export const ok = (data: Record<string, unknown> = {}): VoiceToolResult => ({
  success: true,
  data,
});

export const fail = (error: string, data: Record<string, unknown> = {}): VoiceToolResult => ({
  success: false,
  error,
  data,
});

export const command = (
  appCommand: string,
  fields: Record<string, unknown> = {},
  data: Record<string, unknown> = {}
): VoiceToolResult => ({
  success: true,
  appCommand,
  ...fields,
  data,
});

export const novaAction = (
  actionType: string,
  actionData: Record<string, unknown>,
  data: Record<string, unknown> = {}
): VoiceToolResult => ({
  success: true,
  appCommand: "novaAction",
  actionType,
  actionData,
  data,
});
