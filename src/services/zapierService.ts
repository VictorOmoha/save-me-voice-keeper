
interface ZapierPayload {
  entryTitle: string;
  expirationDate: string;
  userEmail: string;
  [key: string]: unknown;
}

interface EntryLike {
  title?: string;
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

function isUrlSafe(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (!['https:', 'http:'].includes(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' || hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' || hostname === '[::1]' ||
      hostname.endsWith('.local') || hostname.endsWith('.internal') ||
      /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) || /^169\.254\./.test(hostname)
    ) return false;
    return true;
  } catch { return false; }
}

export const zapierService = {
  sendWebhook: async (webhookUrl: string, payload: ZapierPayload, isTest: boolean = false) => {
    try {
      if (!isUrlSafe(webhookUrl)) {
        throw new Error('Invalid webhook URL: must be a public HTTPS/HTTP endpoint');
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: "Save Me",
          testMode: isTest
        }),
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending webhook to Zapier:', error);
      throw error;
    }
  },

  sendEntryCreatedWebhook: async (webhookUrl: string, entry: EntryLike, userEmail: string) => {
    // Extract expiration date from various possible field names
    const rawExpirationDate = entry.fields?.expirationDate ||
                          entry.fields?.['Expiration Date'] ||
                          entry.fields?.['expiration_date'];
    const expirationDate = typeof rawExpirationDate === 'string'
      ? rawExpirationDate
      : new Date().toISOString().split('T')[0];

    const payload = {
      entryTitle: entry.title,
      expirationDate: expirationDate,
      userEmail: userEmail,
      entryData: entry,
      eventType: 'entry.created'
    };

    console.log('Sending entry webhook with payload:', payload);
    return zapierService.sendWebhook(webhookUrl, payload, false);
  }
};
