
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Crown, Zap, Building, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const currentTier = user?.subscriptionTier || 'free';
  
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      storage: '500 MB',
      features: ['Basic data entry', 'CSV export', 'Limited templates'],
      icon: CreditCard,
      current: currentTier === 'free'
    },
    {
      name: 'Basic',
      price: '$9',
      period: 'per month',
      storage: '5 GB',
      features: ['Advanced forms', 'Voice input', 'Custom fields', 'Priority support'],
      icon: Zap,
      current: currentTier === 'basic'
    },
    {
      name: 'Premium',
      price: '$19',
      period: 'per month',
      storage: '50 GB',
      features: ['Automation', 'API access', 'Advanced analytics', 'Custom branding'],
      icon: Crown,
      current: currentTier === 'premium'
    },
    {
      name: 'Enterprise',
      price: 'Contact us',
      period: 'Custom billing',
      storage: '500 GB',
      features: ['SSO', 'Admin controls', 'Custom integrations', 'Dedicated support'],
      icon: Building,
      current: currentTier === 'enterprise'
    }
  ];

  const handleUpgrade = async (planName: string) => {
    if (planName === "Free") return;

    if (planName === "Enterprise") {
      toast.info("Please contact us for Enterprise pricing");
      return;
    }

    setLoadingPlan(planName);

    try {
      // TODO: Implement Firebase-based checkout when payment integration is ready
      toast.info("Billing is not configured in this environment yet.");
    } catch (err) {
      console.error('Checkout exception:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
      setIsUpgradeDialogOpen(false);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);

    try {
      // TODO: Implement Firebase-based billing portal when payment integration is ready
      toast.info("Billing is not configured in this environment yet.");
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
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
              {currentPlan.price}{currentPlan.period !== 'Forever' && currentPlan.period !== 'Custom billing' ? `/${currentPlan.period.replace('per ', '')}` : ''} • Storage: {currentPlan.storage}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentPlan.period === 'Forever' ? 'No recurring charges' : 
               currentPlan.period === 'Custom billing' ? 'Custom billing terms' : 
               'Monthly billing'}
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
                <p className="text-sm text-muted-foreground">
                  Clear pricing • Monthly billing • Cancel anytime • 14-day free trial on paid plans
                </p>
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
                      <div className="flex items-baseline mb-2">
                        <span className="text-lg font-bold">{plan.price}</span>
                        {plan.period !== 'Forever' && plan.period !== 'Custom billing' && (
                          <span className="text-sm text-muted-foreground ml-1">/{plan.period.replace('per ', '')}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {plan.period === 'Forever' ? 'No recurring charges' : 
                         plan.period === 'Custom billing' ? 'Custom terms' : 
                         'Billed monthly'}
                      </p>
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
                        disabled={plan.current || loadingPlan === plan.name || plan.name === "Free"}
                        onClick={() => handleUpgrade(plan.name)}
                      >
                        {loadingPlan === plan.name ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Opening...
                          </>
                        ) : plan.current ? (
                          'Current Plan'
                        ) : plan.name === "Free" ? (
                          'Free Plan'
                        ) : plan.name === "Enterprise" ? (
                          'Open Enterprise Contact'
                        ) : (
                          'Open Plan'
                        )}
                      </Button>
                      {!plan.current && plan.name !== "Free" && plan.name !== "Enterprise" && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          14-day free trial
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={loadingPortal}
            onClick={handleManageBilling}
          >
            {loadingPortal ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Manage Billing'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
