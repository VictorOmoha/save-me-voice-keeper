
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

export const zapierService = {
  sendWebhook: async (webhookUrl: string, payload: ZapierPayload, isTest: boolean = false) => {
    try {
      console.log('Sending payload to Zapier:', { webhookUrl, payload, isTest });

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
    const expirationDate = entry.fields?.expirationDate || 
                          entry.fields?.['Expiration Date'] || 
                          entry.fields?.['expiration_date'] ||
                          new Date().toISOString().split('T')[0];

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
