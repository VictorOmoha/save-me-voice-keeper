import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Bell } from "lucide-react";
import { useState } from "react";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const { preferences, updatePreferences, isLoading: prefsLoading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleNotificationChange = async (key: string, value: boolean) => {
    setIsUpdating(true);
    const success = await updatePreferences({ [key]: value });
    if (success) {
      toast({
        title: "Settings updated",
        description: "Notification preference has been saved.",
      });
    }
    setIsUpdating(false);
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
            checked={preferences.email_notifications}
            onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
            disabled={prefsLoading || isUpdating}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Push Notifications</p>
            <p className="text-xs text-muted-foreground">Get browser notifications</p>
          </div>
          <Switch
            checked={preferences.push_notifications}
            onCheckedChange={(checked) => handleNotificationChange('push_notifications', checked)}
            disabled={prefsLoading || isUpdating}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Smart Reminders</p>
            <p className="text-xs text-muted-foreground">Get reminded about important entries</p>
          </div>
          <Switch
            checked={preferences.reminder_notifications}
            onCheckedChange={(checked) => handleNotificationChange('reminder_notifications', checked)}
            disabled={prefsLoading || isUpdating}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Automation Alerts</p>
            <p className="text-xs text-muted-foreground">Notifications from automated workflows</p>
          </div>
          <Switch
            checked={preferences.automation_notifications}
            onCheckedChange={(checked) => handleNotificationChange('automation_notifications', checked)}
            disabled={prefsLoading || isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
};