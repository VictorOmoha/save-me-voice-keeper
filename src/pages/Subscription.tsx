
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackActivationEvent } from "@/lib/analytics";
import { billingClient } from "@/services/billingClient";
import { isSellablePlanId, publicPlanCards } from "@/config/plans/publicPlans";

const Subscription = () => {
  const { user, isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [searchParams] = useSearchParams();
  const autoOpenedPlanRef = useRef<string | null>(null);
  const requestedPlan = searchParams.get('plan');

  const plans = publicPlanCards().map((plan) => ({
    ...plan,
    current: user?.subscriptionTier === plan.id,
  }));

  const handleUpgrade = async (planId: string) => {
    trackActivationEvent("subscription_clicked", { source: "subscription_page", plan: planId });

    if (!isSellablePlanId(planId)) {
      return;
    }

    setLoadingPlan(planId);

    try {
      const { url } = await billingClient.createCheckout(planId);
      trackActivationEvent("subscription_checkout_opened", { plan: planId });
      window.location.href = url;
    } catch (err) {
      trackActivationEvent("subscription_checkout_failed", { plan: planId });
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    trackActivationEvent("billing_portal_clicked");
    setLoadingPortal(true);

    try {
      const { url } = await billingClient.createPortal(window.location.href);
      trackActivationEvent("billing_portal_opened");
      window.location.href = url;
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
  };

  useEffect(() => {
    if (!requestedPlan || autoOpenedPlanRef.current === requestedPlan) {
      return;
    }

    if (requestedPlan === 'free' || requestedPlan === user?.subscriptionTier) {
      autoOpenedPlanRef.current = requestedPlan;
      return;
    }

    if (!isSellablePlanId(requestedPlan)) {
      autoOpenedPlanRef.current = requestedPlan;
      return;
    }

    autoOpenedPlanRef.current = requestedPlan;
    void handleUpgrade(requestedPlan);
  }, [requestedPlan, user?.subscriptionTier]);

  if (!isAuthenticated) {
    return <Navigate to={requestedPlan ? `/login?next=${encodeURIComponent(`/subscription?plan=${requestedPlan}`)}` : "/login"} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        searchQuery=""
        onSearchChange={() => {}}
        userName="User"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-700">
            Manage your plan and billing preferences
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="mb-8 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Current Plan</CardTitle>
            <CardDescription className="text-gray-600">Your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="default" className="bg-blue-600 text-white font-semibold">
                    {user?.subscriptionTier?.toUpperCase()} PLAN
                  </Badge>
                  {user?.subscriptionActive && (
                    <Badge variant="outline" className="text-green-700 border-green-600 bg-green-50 font-medium">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700">
                  {user?.subscriptionTier === 'free' && "You're on our free plan with basic features."}
                  {user?.subscriptionTier === 'basic' && "Enjoy unlimited entries and voice features."}
                  {user?.subscriptionTier === 'premium' && "Access to all premium features and priority support."}
                </p>
              </div>
              <Button onClick={handleManageBilling} variant="outline" disabled={loadingPortal} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                {loadingPortal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Open Billing Portal'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative hover:shadow-lg transition-shadow bg-white border ${
              plan.current ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'
            }`}>
              {plan.current && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-semibold">
                  Current Plan
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-lg text-gray-600 ml-1">{plan.period === "forever" ? "/forever" : plan.period}</span>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {plan.sellable ? "Billed monthly" : "No recurring charges"}
                </div>
                <CardDescription className="mt-2 text-gray-600">{plan.blurb}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-medium ${plan.current ? 'bg-gray-400 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  disabled={plan.current || loadingPlan === plan.id || !plan.sellable}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : plan.current ? (
                    'Current Plan'
                  ) : plan.sellable ? (
                    `Open ${plan.name}`
                  ) : (
                    'Free Plan'
                  )}
                </Button>
                {!plan.current && plan.sellable && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    No trial; billed monthly
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Billing Information */}
        <Card className="mt-8 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Billing Information</CardTitle>
            <CardDescription className="text-gray-600">Pricing details and payment terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Billing Cycle:</span>
                <span className="font-medium text-gray-900">Monthly (cancel anytime)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Free Trial:</span>
                <span className="font-medium text-gray-900">No paid-plan trial</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Payment Methods:</span>
                <span className="font-medium text-gray-900">Managed securely in Stripe Checkout</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Plan Changes:</span>
                <span className="font-medium text-gray-900">Manage or cancel in the billing portal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="mt-8 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Billing History</CardTitle>
            <CardDescription className="text-gray-600">Your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-700">No billing history available</p>
              <p className="text-sm text-gray-600">Transaction history will appear here once you upgrade</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
