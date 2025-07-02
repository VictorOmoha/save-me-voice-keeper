
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Crown, Zap, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  
  const currentTier = user?.subscriptionTier || 'free';
  
  const plans = [
    {
      name: 'Free',
      price: '$0',
      storage: '500 MB',
      features: ['Basic data entry', 'CSV export', 'Limited templates'],
      icon: CreditCard,
      current: currentTier === 'free'
    },
    {
      name: 'Basic',
      price: '$9.99/month',
      storage: '5 GB',
      features: ['Advanced forms', 'Voice input', 'Custom fields', 'Priority support'],
      icon: Zap,
      current: currentTier === 'basic'
    },
    {
      name: 'Premium',
      price: '$19.99/month',
      storage: '50 GB',
      features: ['Automation', 'API access', 'Advanced analytics', 'Custom branding'],
      icon: Crown,
      current: currentTier === 'premium'
    },
    {
      name: 'Enterprise',
      price: 'Contact us',
      storage: '500 GB',
      features: ['SSO', 'Admin controls', 'Custom integrations', 'Dedicated support'],
      icon: Building,
      current: currentTier === 'enterprise'
    }
  ];

  const handleUpgrade = (planName: string) => {
    toast.info(`Upgrade to ${planName} plan coming soon`);
    setIsUpgradeDialogOpen(false);
  };

  const currentPlan = plans.find(plan => plan.current) || plans[0];

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
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <div>
            <p className="font-medium text-sm">{currentPlan.name} Plan</p>
            <p className="text-xs text-muted-foreground">
              {currentPlan.price} • Storage: {currentPlan.storage}
            </p>
          </div>
          <Badge className="bg-primary text-primary-foreground">Current</Badge>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                Upgrade Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Choose Your Plan</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <div 
                      key={plan.name}
                      className={`p-4 border rounded-lg ${plan.current ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5" />
                        <h3 className="font-semibold">{plan.name}</h3>
                        {plan.current && <Badge variant="secondary">Current</Badge>}
                      </div>
                      <p className="text-lg font-bold mb-2">{plan.price}</p>
                      <p className="text-sm text-muted-foreground mb-3">Storage: {plan.storage}</p>
                      <ul className="space-y-1 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-xs text-muted-foreground">• {feature}</li>
                        ))}
                      </ul>
                      <Button 
                        variant={plan.current ? "outline" : "default"}
                        size="sm" 
                        className="w-full"
                        disabled={plan.current}
                        onClick={() => handleUpgrade(plan.name)}
                      >
                        {plan.current ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Billing history coming soon")}>
            Billing History
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Payment update coming soon")}>
            Update Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
