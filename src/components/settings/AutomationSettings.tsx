
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export const AutomationSettings = () => {
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
            <p className="text-xs text-muted-foreground">2 platforms connected</p>
          </div>
          <Button variant="outline" size="sm">Manage</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium text-sm">n8n</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Connected
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium text-sm">Make.com</span>
            <Badge variant="outline">Not Connected</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
