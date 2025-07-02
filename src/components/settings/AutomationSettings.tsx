
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Zap, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

interface Platform {
  id: string;
  name: string;
  connected: boolean;
  apiKey?: string;
  webhookUrl?: string;
}

export const AutomationSettings = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'n8n', name: 'n8n', connected: false },
    { id: 'make', name: 'Make.com', connected: false },
    { id: 'zapier', name: 'Zapier', connected: false },
    { id: 'webhook', name: 'Custom Webhook', connected: false }
  ]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ apiKey: '', webhookUrl: '' });

  const handleConnect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setConfigForm({ apiKey: platform.apiKey || '', webhookUrl: platform.webhookUrl || '' });
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedPlatform) return;

    setPlatforms(prev => prev.map(p => 
      p.id === selectedPlatform.id 
        ? { 
            ...p, 
            connected: true, 
            apiKey: configForm.apiKey,
            webhookUrl: configForm.webhookUrl 
          }
        : p
    ));
    
    toast.success(`${selectedPlatform.name} connected successfully`);
    setIsConfigDialogOpen(false);
    setSelectedPlatform(null);
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, connected: false, apiKey: '', webhookUrl: '' } : p
    ));
    toast.success("Platform disconnected");
  };

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Automation
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure automation and integrations</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-sm">Connected Platforms</p>
            <p className="text-xs text-muted-foreground">{connectedCount} platforms connected</p>
          </div>
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Platform
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedPlatform ? `Configure ${selectedPlatform.name}` : 'Select Platform'}
                </DialogTitle>
              </DialogHeader>
              {selectedPlatform && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <Input
                      value={configForm.apiKey}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter API key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook URL</label>
                    <Input
                      value={configForm.webhookUrl}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="Enter webhook URL"
                    />
                  </div>
                  <Button onClick={handleSaveConfig} className="w-full">
                    Connect Platform
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium text-sm">{platform.name}</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={platform.connected ? "secondary" : "outline"}
                  className={platform.connected ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : ""}
                >
                  {platform.connected ? 'Connected' : 'Not Connected'}
                </Badge>
                {platform.connected ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDisconnect(platform.id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleConnect(platform)}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
