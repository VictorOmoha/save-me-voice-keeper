import {createHash} from 'crypto';

export class ConnectionError extends Error {
  constructor(message: string, public status = 400) {super(message);}
}
export interface ExternalTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}
export interface Connection {
  user_id: string;
  provider: 'google_calendar' | 'google_drive' | 'mcp';
  name: string;
  account: string;
  revision: string;
  endpoint?: string;
  tools: ExternalTool[];
  enabled_tools: string[];
  credentials_secret: {refresh_token?: string; bearer_token?: string};
  created_at: unknown;
  updated_at: unknown;
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const connectionId = (uid: string, provider: string) => digest(`${uid}:${provider}`);
export function publicConnection(id: string, value: Connection) {
  return {id, provider: value.provider, name: value.name, account: value.account, revision: value.revision,
    endpoint: value.endpoint, tools: value.tools, enabled_tools: value.enabled_tools};
}
export function objectArgs(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Buffer.byteLength(JSON.stringify(value)) > 16000) throw new ConnectionError('Tool arguments must be a JSON object of at most 16 KB');
  return value as Record<string, unknown>;
}
export function requiredText(value: unknown, label: string, max = 2000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ConnectionError(`Invalid ${label}`);
  return value.trim();
}
export function exactId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new ConnectionError('Invalid connection id');
  return value;
}
