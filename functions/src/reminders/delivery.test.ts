import {afterEach, describe, expect, it, vi} from 'vitest';
import {channelEnabled, emailMessage, reminderText, retryAt, sendReminderEmail} from './delivery';

afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs();});

describe('Reminder delivery policy', () => {
  it('requires an explicit channel preference and respects the master switch', () => {
    expect(channelEnabled({}, 'email')).toBe(false);
    expect(channelEnabled({}, 'push')).toBe(false);
    expect(channelEnabled({email_notifications: true}, 'email')).toBe(true);
    expect(channelEnabled({email_notifications: true, reminder_notifications: false}, 'email')).toBe(false);
  });
  it('handles manual and Nova reminders, including missing or oversized text', () => {
    expect(reminderText({notification_text: ' Call Mum '})).toBe('Call Mum');
    expect(reminderText({text: 'Nova reminder'})).toBe('Nova reminder');
    expect(reminderText({})).toBe('Your reminder is due.');
    expect(reminderText({text: 'x'.repeat(3000)})).toHaveLength(2000);
  });
  it('includes first-party reminder and preferences links in plain-text emails', () => {
    vi.stubEnv('REMINDER_APP_ORIGIN', 'https://example.com/untrusted/path');
    expect(emailMessage('<b>Call Mum</b>').text).toContain('<b>Call Mum</b>');
    expect(emailMessage('Call Mum').text).toContain('https://example.com/settings?tab=notifications');
    expect(emailMessage('Call Mum').text).not.toContain('untrusted/path');
  });
  it('backs off retryable failures', () => {
    expect(retryAt(1, 0)).toBe(60_000);
    expect(retryAt(3, 0)).toBe(240_000);
    expect(retryAt(6, 0)).toBe(900_000);
  });
});

describe('Email provider adapter', () => {
  const message = {from: 'test@example.com', to: ['recipient@example.com'], subject: 'Reminder', text: 'Call Mum'};
  it('uses a stable idempotency key and never accepts an arbitrary provider URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ok: true});
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendReminderEmail(message, 'reminder/1/email')).toEqual({state: 'sent'});
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      headers: expect.objectContaining({'Idempotency-Key': 'reminder/1/email'}), body: JSON.stringify(message),
    }));
  });
  it.each([[429, 'retry'], [503, 'retry'], [401, 'failed'], [422, 'failed']])('classifies HTTP %i as %s', async (status, state) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status}));
    expect(await sendReminderEmail(message, 'reminder/1/email')).toEqual({state, reason: `email_http_${status}`});
  });
  it('retries a timeout without leaking the exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sensitive provider details')));
    expect(await sendReminderEmail(message, 'reminder/1/email')).toEqual({state: 'retry', reason: 'email_unavailable'});
  });
});
