import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, TestTube, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { SavedWebhookConfigs } from "./SavedWebhookConfigs";
import { useAuth } from "@/contexts/AuthContext";

interface TestField {
  key: string;
  type: 'text' | 'email' | 'date' | 'number';
  value: string;
  label: string;
}

interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface SavedWebhookConfig {
  id: string;
  name: string;
  webhookUrl: string;
  fields: TestField[];
  createdAt: string;
}

export const WebhookTesting = () => {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latestEntry, setLatestEntry] = useState<SavedEntry | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [currentConfigName, setCurrentConfigName] = useState("Default Configuration");
  const [testFields, setTestFields] = useState<TestField[]>([
    { key: 'entryTitle', type: 'text', value: 'Sample Car Warranty', label: 'Entry Title' },
    { key: 'expirationDate', type: 'date', value: '2026-08-01', label: 'Expiration Date' },
    { key: 'userEmail', type: 'email', value: '', label: 'User Email' }
  ]);

  // Load saved webhook URL and user email on component mount
  useEffect(() => {
    const savedWebhookUrl = localStorage.getItem('zapierWebhookUrl');
    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
    }

    // Get current user email from auth context
    if (user?.email) {
      setUserEmail(user.email);
      setTestFields(prev => prev.map(field =>
        field.key === 'userEmail' ? { ...field, value: user.email || '' } : field
      ));
    }

    loadLatestEntry();
  }, [user]);

  // Load the latest entry from the database
  const loadLatestEntry = async () => {
    if (!user) return;

    try {
      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('user_id', '==', user.uid),
        orderBy('updated_at', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();

        const entry: SavedEntry = {
          id: docSnap.id,
          title: data.title || '',
          fields: typeof data.fields === 'object' && data.fields !== null ? data.fields as Record<string, any> : {},
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        };

        setLatestEntry(entry);

        // Update test fields with latest entry data
        const expirationDate = entry.fields?.expirationDate ||
                              entry.fields?.['Expiration Date'] ||
                              entry.fields?.['expiration_date'] ||
                              new Date().toISOString().split('T')[0];

        setTestFields(prev => prev.map(field => {
          if (field.key === 'entryTitle') {
            return { ...field, value: entry.title };
          }
          if (field.key === 'expirationDate') {
            return { ...field, value: expirationDate };
          }
          return field;
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

  // Add new test field
  const handleAddField = () => {
    const newField: TestField = {
      key: `field_${Date.now()}`,
      type: 'text',
      value: '',
      label: 'New Field'
    };
    setTestFields(prev => [...prev, newField]);
  };

  // Remove test field
  const handleRemoveField = (index: number) => {
    setTestFields(prev => prev.filter((_, i) => i !== index));
  };

  // Update test field
  const handleUpdateField = (index: number, updates: Partial<TestField>) => {
    setTestFields(prev => prev.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  // Load a saved configuration
  const handleLoadConfig = (config: SavedWebhookConfig) => {
    setWebhookUrl(config.webhookUrl);
    setTestFields(config.fields);
    setCurrentConfigName(config.name);
  };

  // Build test payload from fields
  const buildTestPayload = () => {
    const payload: Record<string, any> = {};
    testFields.forEach(field => {
      payload[field.key] = field.value;
    });
    return {
      ...payload,
      timestamp: new Date().toISOString(),
      source: "Save Me",
      testMode: true,
      configurationName: currentConfigName
    };
  };

  const handleSendTestPayload = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    setIsLoading(true);
    console.log("Sending test payload to Zapier webhook:", webhookUrl);

    try {
      const payload = buildTestPayload();
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      toast.success("Test payload sent to Zapier! Check your Zap's history to confirm it was received.");
      console.log("Test payload sent successfully", payload);
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
                            latestEntry.fields?.['expiration_date'] ||
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
    <div className="space-y-6">
      {/* Saved Configurations */}
      <SavedWebhookConfigs
        currentFields={testFields}
        currentWebhookUrl={webhookUrl}
        onLoadConfig={handleLoadConfig}
        userTier={user?.subscriptionTier || 'free'}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Webhook Testing - {currentConfigName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test your webhook integration by sending customizable test payloads or actual data
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL Configuration */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
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

          {/* Customizable Test Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Test Payload Fields</h3>
              <Button onClick={handleAddField} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>
            
            <div className="space-y-3">
              {testFields.map((field, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">Field Key</Label>
                    <Input
                      value={field.key}
                      onChange={(e) => handleUpdateField(index, { key: e.target.value })}
                      placeholder="fieldName"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                      placeholder="Field Label"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select 
                      value={field.type} 
                      onValueChange={(value: 'text' | 'email' | 'date' | 'number') => 
                        handleUpdateField(index, { type: value })
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type}
                      value={field.value}
                      onChange={(e) => handleUpdateField(index, { value: e.target.value })}
                      placeholder="Field value"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleRemoveField(index)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={testFields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payload Preview */}
          <div className="space-y-2">
            <Label>Payload Preview</Label>
            <Textarea
              readOnly
              value={JSON.stringify(buildTestPayload(), null, 2)}
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
            <p>• Configure custom fields above to match your webhook requirements</p>
            <p>• Test payload sends the configured sample data above</p>
            <p>• Latest Entry Data sends your most recent saved entry</p>
            <p>• Webhooks are automatically triggered when you create or update entries</p>
            <p>• Check your webhook destination to see received data</p>
            <p>• Save different configurations for various webhook testing scenarios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
