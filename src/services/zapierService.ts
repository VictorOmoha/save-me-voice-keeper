
interface ZapierPayload {
  entryTitle: string;
  expirationDate: string;
  userEmail: string;
  [key: string]: any;
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

  sendEntryCreatedWebhook: async (webhookUrl: string, entry: any, userEmail: string) => {
    const payload = {
      entryTitle: entry.title,
      expirationDate: entry.fields?.expirationDate || new Date().toISOString().split('T')[0],
      userEmail: userEmail,
      entryData: entry,
      eventType: 'entry.created'
    };

    return zapierService.sendWebhook(webhookUrl, payload, false);
  }
};
