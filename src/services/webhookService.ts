
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

interface WebhookEvent {
  event_type: 'entry.created' | 'entry.updated' | 'entry.deleted';
  payload: unknown;
  webhook_url?: string;
}

function isUrlSafe(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (!['https:', 'http:'].includes(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    // Block private/internal IPs and localhost
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^169\.254\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const webhookService = {
  // Trigger a webhook event (can be called when entries are created/updated)
  triggerWebhook: async (event: WebhookEvent): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the current user
      const user = auth.currentUser;

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate webhook URL before use
      if (event.webhook_url && !isUrlSafe(event.webhook_url)) {
        return { success: false, error: 'Invalid webhook URL: must be a public HTTPS/HTTP endpoint' };
      }

      // Store the webhook event in Firebase Firestore
      const webhookEventsRef = collection(db, 'webhook_events');
      await addDoc(webhookEventsRef, {
        user_id: user.uid,
        event_type: event.event_type,
        payload: event.payload,
        webhook_url: event.webhook_url || null,
        status: 'pending',
        created_at: serverTimestamp()
      });

      // If webhook URL is provided, attempt to send the webhook
      if (event.webhook_url) {
        try {
          await fetch(event.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'no-cors',
            body: JSON.stringify({
              event_type: event.event_type,
              data: event.payload,
              timestamp: new Date().toISOString(),
              source: 'Save Me'
            }),
          });

          // Update webhook status - find the most recent event and update it
          const q = query(
            webhookEventsRef,
            where('user_id', '==', user.uid),
            where('event_type', '==', event.event_type),
            where('webhook_url', '==', event.webhook_url),
            orderBy('created_at', 'desc'),
            limit(1)
          );

          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await updateDoc(docRef, {
              status: 'success',
              last_attempt_at: new Date().toISOString(),
              attempts: 1
            });
          }

          return { success: true };
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);

          // Update webhook status as failed
          const q = query(
            webhookEventsRef,
            where('user_id', '==', user.uid),
            where('event_type', '==', event.event_type),
            where('webhook_url', '==', event.webhook_url),
            orderBy('created_at', 'desc'),
            limit(1)
          );

          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await updateDoc(docRef, {
              status: 'failed',
              last_attempt_at: new Date().toISOString(),
              attempts: 1
            });
          }

          return { success: false, error: 'Failed to send webhook' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook service error:', error);
      return { success: false, error: 'Internal webhook service error' };
    }
  },

  // Get webhook events for the current user
  getWebhookEvents: async (): Promise<{ events: Array<Record<string, unknown>>; error?: string }> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { events: [], error: 'User not authenticated' };
      }

      const webhookEventsRef = collection(db, 'webhook_events');
      const q = query(
        webhookEventsRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { events };
    } catch (error) {
      console.error('Failed to fetch webhook events:', error);
      return { events: [], error: 'Failed to fetch webhook events' };
    }
  }
};
