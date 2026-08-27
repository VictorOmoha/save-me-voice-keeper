import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackActivationEvent } from "@/lib/analytics";
import { billingClient } from "@/services/billingClient";
import { isSellablePlanId, publicPlanCards } from "@/config/plans/publicPlans";

export const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const currentTier = user?.subscriptionTier || "free";
  const plans = publicPlanCards();
  const currentPlan = plans.find((plan) => plan.id === currentTier) || plans[0];

  const handleUpgrade = async (planId: string) => {
    if (!isSellablePlanId(planId) || planId === currentTier) return;

    setLoadingPlan(planId);
    trackActivationEvent("subscription_clicked", { source: "settings", plan: planId });
    try {
      const { url } = await billingClient.createCheckout(planId);
      trackActivationEvent("subscription_checkout_opened", { plan: planId, source: "settings" });
      window.location.href = url;
    } catch {
      trackActivationEvent("subscription_checkout_failed", { plan: planId, source: "settings" });
      toast.error("Could not open checkout. Try again or use the Subscription page.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    trackActivationEvent("billing_portal_clicked", { source: "settings" });
    setLoadingPortal(true);
    try {
      const { url } = await billingClient.createPortal(window.location.href);
      trackActivationEvent("billing_portal_opened", { source: "settings" });
      window.location.href = url;
    } catch {
      toast.error("Could not open the billing portal. Upgrade first, or try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription & Billing
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage your plan through Stripe Checkout and the customer portal</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <div>
            <p className="font-medium text-sm">{currentPlan.name} Plan</p>
            <p className="text-xs text-muted-foreground">
              {currentPlan.price}{currentPlan.period === "forever" ? " forever" : currentPlan.period} • {currentPlan.features[1]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentPlan.sellable ? "Billed monthly. No paid-plan trial." : "No recurring charges"}
            </p>
          </div>
          <Badge className="bg-primary text-primary-foreground">Current</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className={`p-3 border rounded-lg ${plan.id === currentTier ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm">{plan.name}</h3>
                {plan.id === currentTier && <Badge variant="secondary">Current</Badge>}
              </div>
              <p className="text-sm font-medium mb-2">{plan.price}{plan.period === "forever" ? "" : plan.period}</p>
              <ul className="space-y-1 mb-3">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="text-xs text-muted-foreground">• {feature}</li>
                ))}
              </ul>
              <Button
                variant={plan.id === currentTier ? "outline" : "default"}
                size="sm"
                className="w-full"
                disabled={plan.id === currentTier || !plan.sellable || loadingPlan === plan.id}
                onClick={() => handleUpgrade(plan.id)}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : plan.id === currentTier ? (
                  "Current Plan"
                ) : plan.sellable ? (
                  `Open ${plan.name}`
                ) : (
                  "Free Plan"
                )}
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loadingPortal}
          onClick={handleManageBilling}
        >
          {loadingPortal ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Open Billing Portal"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
