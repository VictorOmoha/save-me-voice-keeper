
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

export const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true,
    automation: false
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
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
      </CardContent>
    </Card>
  );
};
