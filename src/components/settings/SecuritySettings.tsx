
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Smartphone } from "lucide-react";

export const SecuritySettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage your account security</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Enabled
          </Badge>
        </div>
        
        <Button variant="outline" className="w-full justify-start">
          <Key className="w-4 h-4 mr-2" />
          Change Password
        </Button>
        
        <Button variant="outline" className="w-full justify-start">
          <Smartphone className="w-4 h-4 mr-2" />
          Manage Devices
        </Button>
      </CardContent>
    </Card>
  );
};
