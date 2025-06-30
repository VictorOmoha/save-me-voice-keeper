
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

export const SubscriptionSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription & Billing
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing information</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div>
            <p className="font-medium text-sm">Personal Plan</p>
            <p className="text-xs text-muted-foreground">$9.99/month • Next billing: Jan 15, 2024</p>
          </div>
          <Badge className="bg-blue-600 text-white">Active</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Upgrade Plan
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Billing History
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Update Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
