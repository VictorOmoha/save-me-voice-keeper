
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, TestTube, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TestPayload {
  entryTitle: string;
  expirationDate: string;
  userEmail: string;
}

interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const WebhookTesting = () => {
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.zapier.com/hooks/catch/23790183/u2t2vvq/");
  const [isLoading, setIsLoading] = useState(false);
  const [latestEntry, setLatestEntry] = useState<SavedEntry | null>(null);
  const [userEmail, setUserEmail] = useState("omohavictor@gmail.com");
  const [testPayload, setTestPayload] = useState<TestPayload>({
    entryTitle: "Sample Car Warranty",
    expirationDate: "2026-08-01",
    userEmail: "omohavictor@gmail.com"
  });

  // Load saved webhook URL and user email on component mount
  useEffect(() => {
    const savedWebhookUrl = localStorage.getItem('zapierWebhookUrl');
    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
    }

    // Get current user email
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setTestPayload(prev => ({ ...prev, userEmail: user.email }));
      }
    };

    getCurrentUser();
    loadLatestEntry();
  }, []);

  // Load the latest entry from the database
  const loadLatestEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error loading latest entry:', error);
        return;
      }

      if (data) {
        setLatestEntry(data);
        
        // Update test payload with latest entry data
        const expirationDate = data.fields?.expirationDate || 
                              data.fields?.['Expiration Date'] || 
                              new Date().toISOString().split('T')[0];
        
        setTestPayload(prev => ({
          ...prev,
          entryTitle: data.title,
          expirationDate: expirationDate
        }));
      }
    } catch (error) {
      console.error('Error loading latest entry:', error);
    }
  };

  // Save webhook URL to localStorage
  const handleSaveWebhookUrl = () => {
    localStorage.setItem('zapierWebhookUrl', webhookUrl);
    toast.success("Webhook URL saved successfully!");
  };

  const handleSendTestPayload = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    setIsLoading(true);
    console.log("Sending test payload to Zapier webhook:", webhookUrl);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          ...testPayload,
          timestamp: new Date().toISOString(),
          source: "Save Me",
          testMode: true
        }),
      });

      toast.success("Test payload sent to Zapier! Check your Zap's history to confirm it was received.");
      console.log("Test payload sent successfully");
    } catch (error) {
      console.error("Error sending test payload:", error);
      toast.error("Failed to send test payload. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendActualEntry = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    if (!latestEntry) {
      toast.error("No entries available to send");
      return;
    }

    setIsLoading(true);
    console.log("Sending actual entry data to Zapier webhook:", webhookUrl);

    try {
      const expirationDate = latestEntry.fields?.expirationDate || 
                            latestEntry.fields?.['Expiration Date'] || 
                            new Date().toISOString().split('T')[0];

      const payload = {
        entryTitle: latestEntry.title,
        expirationDate: expirationDate,
        userEmail: userEmail,
        timestamp: new Date().toISOString(),
        source: "Save Me",
        testMode: false,
        entryData: latestEntry,
        eventType: 'entry.created'
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      toast.success("Actual entry data sent to Zapier! Check your Zap's history to confirm it was received.");
      console.log("Actual entry data sent successfully");
    } catch (error) {
      console.error("Error sending actual entry data:", error);
      toast.error("Failed to send actual entry data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh latest entry data
  const handleRefreshData = async () => {
    await loadLatestEntry();
    toast.success("Latest entry data refreshed!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Webhook Testing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test your Zapier webhook integration by sending sample or actual data
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Webhook URL Configuration */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="flex-1"
            />
            <Button onClick={handleSaveWebhookUrl} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Latest Entry Info */}
        {latestEntry && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Latest Entry Data</h3>
              <Button onClick={handleRefreshData} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Title:</strong> {latestEntry.title}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Last Updated:</strong> {new Date(latestEntry.updated_at).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Expiration Date:</strong> {latestEntry.fields?.expirationDate || latestEntry.fields?.['Expiration Date'] || 'Not set'}
            </p>
          </div>
        )}

        {/* Test Payload Configuration */}
        <div className="space-y-4">
          <h3 className="font-medium">Test Payload Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-title">Entry Title</Label>
              <Input
                id="entry-title"
                value={testPayload.entryTitle}
                onChange={(e) => setTestPayload(prev => ({ ...prev, entryTitle: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiration-date">Expiration Date</Label>
              <Input
                id="expiration-date"
                type="date"
                value={testPayload.expirationDate}
                onChange={(e) => setTestPayload(prev => ({ ...prev, expirationDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">User Email</Label>
            <Input
              id="user-email"
              type="email"
              value={testPayload.userEmail}
              onChange={(e) => setTestPayload(prev => ({ ...prev, userEmail: e.target.value }))}
            />
          </div>
        </div>

        {/* Payload Preview */}
        <div className="space-y-2">
          <Label>Payload Preview</Label>
          <Textarea
            readOnly
            value={JSON.stringify({
              ...testPayload,
              timestamp: new Date().toISOString(),
              source: "Save Me",
              testMode: true
            }, null, 2)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSendTestPayload}
            disabled={isLoading}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? "Sending..." : "Send Test Payload"}
          </Button>
          
          <Button
            onClick={handleSendActualEntry}
            disabled={isLoading || !latestEntry}
            variant="outline"
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Latest Entry Data
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Test payload sends the configured sample data above</p>
          <p>• Latest Entry Data sends your most recent saved entry</p>
          <p>• Webhooks are automatically triggered when you create or update entries</p>
          <p>• Check your Zap's history in Zapier to see received webhooks</p>
        </div>
      </CardContent>
    </Card>
  );
};
