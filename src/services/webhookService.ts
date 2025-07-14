
import { supabase } from '@/integrations/supabase/client';

interface WebhookEvent {
  event_type: 'entry.created' | 'entry.updated' | 'entry.deleted';
  payload: any;
  webhook_url?: string;
}

export const webhookService = {
  // Trigger a webhook event (can be called when entries are created/updated)
  triggerWebhook: async (event: WebhookEvent): Promise<{ success: boolean; error?: string }> => {
    try {
      // Store the webhook event in the database
      const { error: dbError } = await supabase
        .from('webhook_events')
        .insert({
          event_type: event.event_type,
          payload: event.payload,
          webhook_url: event.webhook_url,
          status: 'pending'
        });

      if (dbError) {
        console.error('Failed to store webhook event:', dbError);
        return { success: false, error: dbError.message };
      }

      // If webhook URL is provided, attempt to send the webhook
      if (event.webhook_url) {
        try {
          const response = await fetch(event.webhook_url, {
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

          // Update webhook status (note: with no-cors we can't check response status)
          await supabase
            .from('webhook_events')
            .update({ 
              status: 'success',
              last_attempt_at: new Date().toISOString(),
              attempts: 1
            })
            .eq('event_type', event.event_type)
            .eq('webhook_url', event.webhook_url)
            .order('created_at', { ascending: false })
            .limit(1);

          return { success: true };
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);
          
          // Update webhook status as failed
          await supabase
            .from('webhook_events')
            .update({ 
              status: 'failed',
              last_attempt_at: new Date().toISOString(),
              attempts: 1
            })
            .eq('event_type', event.event_type)
            .eq('webhook_url', event.webhook_url)
            .order('created_at', { ascending: false })
            .limit(1);

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
  getWebhookEvents: async (): Promise<{ events: any[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { events: [], error: error.message };
      }

      return { events: data || [] };
    } catch (error) {
      return { events: [], error: 'Failed to fetch webhook events' };
    }
  }
};
