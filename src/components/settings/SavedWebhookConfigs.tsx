
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Download, Edit } from "lucide-react";
import { toast } from "sonner";

interface TestField {
  key: string;
  type: 'text' | 'email' | 'date' | 'number';
  value: string;
  label: string;
}

interface SavedWebhookConfig {
  id: string;
  name: string;
  webhookUrl: string;
  fields: TestField[];
  createdAt: string;
}

interface SavedWebhookConfigsProps {
  currentFields: TestField[];
  currentWebhookUrl: string;
  onLoadConfig: (config: SavedWebhookConfig) => void;
  userTier?: string;
}

export const SavedWebhookConfigs = ({ 
  currentFields, 
  currentWebhookUrl, 
  onLoadConfig,
  userTier = 'free'
}: SavedWebhookConfigsProps) => {
  const [savedConfigs, setSavedConfigs] = useState<SavedWebhookConfig[]>(() => {
    const saved = localStorage.getItem('savedWebhookConfigs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configName, setConfigName] = useState("");

  // Tier-based limits
  const getLimitForTier = (tier: string) => {
    switch (tier) {
      case 'free': return 3;
      case 'basic': return 10;
      case 'premium': return 20;
      default: return 3;
    }
  };

  const limit = getLimitForTier(userTier);
  const canSaveMore = savedConfigs.length < limit;

  const handleSaveConfig = () => {
    if (!configName.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }

    if (!canSaveMore) {
      toast.error(`You've reached the limit of ${limit} saved configurations for your ${userTier} plan`);
      return;
    }

    const newConfig: SavedWebhookConfig = {
      id: Date.now().toString(),
      name: configName.trim(),
      webhookUrl: currentWebhookUrl,
      fields: currentFields,
      createdAt: new Date().toISOString()
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedWebhookConfigs', JSON.stringify(updatedConfigs));
    
    toast.success(`Configuration "${configName}" saved successfully!`);
    setConfigName("");
    setIsDialogOpen(false);
  };

  const handleDeleteConfig = (configId: string) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== configId);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedWebhookConfigs', JSON.stringify(updatedConfigs));
    toast.success("Configuration deleted");
  };

  const handleLoadConfig = (config: SavedWebhookConfig) => {
    onLoadConfig(config);
    toast.success(`Configuration "${config.name}" loaded`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Saved Webhook Configurations
          </span>
          <Badge variant="outline">
            {savedConfigs.length}/{limit} saved
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Save and reuse webhook testing configurations for different use cases
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Current tier: <Badge variant="secondary" className="capitalize">{userTier}</Badge>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!canSaveMore}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Current Config
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Webhook Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="config-name">Configuration Name</Label>
                  <Input
                    id="config-name"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Car Warranty Notifications"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Configuration Preview</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Webhook URL:</strong> {currentWebhookUrl || 'Not set'}</p>
                    <p><strong>Fields:</strong> {currentFields.length} configured</p>
                    <div className="max-h-20 overflow-y-auto bg-muted/50 p-2 rounded text-xs">
                      {currentFields.map((field, index) => (
                        <div key={index}>
                          {field.label} ({field.key}): {field.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveConfig} className="w-full">
                  Save Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!canSaveMore && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You've reached the limit for your {userTier} plan. Upgrade to save more configurations.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {savedConfigs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No saved configurations yet</p>
              <p className="text-xs">Save your current webhook setup to reuse it later</p>
            </div>
          ) : (
            savedConfigs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{config.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {config.fields.length} fields • Created {new Date(config.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                    {config.webhookUrl}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadConfig(config)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Load
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteConfig(config.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {userTier === 'free' && (
          <div className="text-xs text-muted-foreground text-center">
            Upgrade to Basic (10 configs) or Premium (20 configs) for more saved configurations
          </div>
        )}
      </CardContent>
    </Card>
  );
};
