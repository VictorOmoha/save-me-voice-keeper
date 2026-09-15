export type DeliveryState = 'sent' | 'skipped' | 'retry' | 'failed';
export interface ChannelResult { state: DeliveryState; reason?: string }
export interface EmailMessage { from: string; to: string[]; subject: string; text: string }
export interface DeliveryPreferences {
  reminder_notifications?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export const MAX_ATTEMPTS = 6;
export const DELIVERY_WINDOW_MS = 60 * 60 * 1000;

export function channelEnabled(preferences: DeliveryPreferences, channel: 'email' | 'push'): boolean {
  // External delivery requires an explicit opt-in. Legacy reminders inherit preferences.
  return preferences.reminder_notifications !== false && preferences[`${channel}_notifications`] === true;
}

export function reminderText(reminder: Record<string, unknown>): string {
  const value = reminder.notification_text || reminder.task_text || reminder.text;
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 2000) : 'Your reminder is due.';
}

export function appOrigin(): string {
  const url = new URL(process.env.REMINDER_APP_ORIGIN || 'https://saveme.space');
  if (url.protocol !== 'https:') throw new Error('REMINDER_APP_ORIGIN must use HTTPS');
  return url.origin;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.REMINDER_EMAIL_FROM?.trim());
}

export function emailMessage(text: string): Omit<EmailMessage, 'to'> {
  return {
    from: process.env.REMINDER_EMAIL_FROM || '',
    subject: 'Your SaveMe reminder',
    text: `${text}\n\nOpen your reminders: ${appOrigin()}/dashboard?reminders=open\n\nManage reminder delivery: ${appOrigin()}/settings?tab=notifications`,
  };
}

export async function sendReminderEmail(message: EmailMessage, key: string): Promise<ChannelResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok) return {state: 'sent'};
    // Never store provider responses: they can contain addresses or credentials.
    return {state: response.status === 429 || response.status >= 500 ? 'retry' : 'failed', reason: `email_http_${response.status}`};
  } catch {
    return {state: 'retry', reason: 'email_unavailable'};
  }
}

export function retryAt(attempt: number, now: number): number {
  return now + Math.min(15, 2 ** Math.max(0, attempt - 1)) * 60_000;
}

export function terminal(result?: ChannelResult): boolean {
  return Boolean(result && result.state !== 'retry');
}
