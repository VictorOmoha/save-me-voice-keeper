
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true,
    automation: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved notification preferences
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notifications));
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Email Notifications</p>
            <p className="text-xs text-muted-foreground">Receive updates via email</p>
          </div>
          <Switch
            checked={notifications.email}
            onCheckedChange={(checked) => handleNotificationChange('email', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Push Notifications</p>
            <p className="text-xs text-muted-foreground">Get browser notifications</p>
          </div>
          <Switch
            checked={notifications.push}
            onCheckedChange={(checked) => handleNotificationChange('push', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Smart Reminders</p>
            <p className="text-xs text-muted-foreground">Get reminded about important entries</p>
          </div>
          <Switch
            checked={notifications.reminders}
            onCheckedChange={(checked) => handleNotificationChange('reminders', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Automation Alerts</p>
            <p className="text-xs text-muted-foreground">Notifications from automated workflows</p>
          </div>
          <Switch
            checked={notifications.automation}
            onCheckedChange={(checked) => handleNotificationChange('automation', checked)}
          />
        </div>
        
        <Button 
          onClick={handleSaveSettings} 
          disabled={isLoading}
          className="w-full mt-4"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};
