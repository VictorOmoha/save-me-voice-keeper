
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, TestTube } from "lucide-react";
import { toast } from "sonner";

interface TestPayload {
  entryTitle: string;
  expirationDate: string;
  userEmail: string;
}

export const WebhookTesting = () => {
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.zapier.com/hooks/catch/23790183/u2t2vvq/");
  const [isLoading, setIsLoading] = useState(false);
  const [testPayload, setTestPayload] = useState<TestPayload>({
    entryTitle: "Sample Car Warranty",
    expirationDate: "2026-08-01",
    userEmail: "omohavictor@gmail.com"
  });

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

      // Since we're using no-cors, we won't get a proper response status
      // Instead, we'll show a more informative message
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

    setIsLoading(true);
    console.log("Sending actual entry data to Zapier webhook:", webhookUrl);

    try {
      // Get actual entry data from localStorage or context if available
      const savedEntries = localStorage.getItem('savedEntries');
      const entries = savedEntries ? JSON.parse(savedEntries) : [];
      const latestEntry = entries[0]; // Get the most recent entry

      const payload = {
        entryTitle: latestEntry?.title || "No entries available",
        expirationDate: latestEntry?.fields?.expirationDate || new Date().toISOString().split('T')[0],
        userEmail: testPayload.userEmail,
        timestamp: new Date().toISOString(),
        source: "Save Me",
        testMode: false,
        entryData: latestEntry
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
          <Input
            id="webhook-url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
          />
        </div>

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
            disabled={isLoading}
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
          <p>• Check your Zap's history in Zapier to see received webhooks</p>
        </div>
      </CardContent>
    </Card>
  );
};
