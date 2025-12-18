
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Subscription = () => {
  const { user, isAuthenticated, session } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "Forever",
      description: "Perfect for getting started",
      features: [
        "Up to 50 entries",
        "Basic search",
        "Web access only",
        "Standard support"
      ],
      current: user?.subscriptionTier === 'free'
    },
    {
      name: "Basic",
      price: "$9",
      period: "per month",
      description: "For personal power users",
      features: [
        "Unlimited entries",
        "Advanced search & filters",
        "All platforms (Web, Mobile, Desktop)",
        "Voice input & commands",
        "Priority support"
      ],
      current: user?.subscriptionTier === 'basic'
    },
    {
      name: "Premium",
      price: "$19",
      period: "per month",
      description: "For teams and professionals",
      features: [
        "Everything in Basic",
        "Data export & backup",
        "Advanced encryption",
        "API access",
        "Custom integrations",
        "24/7 support"
      ],
      current: user?.subscriptionTier === 'premium'
    }
  ];

  const handleUpgrade = async (planName: string) => {
    console.log('handleUpgrade called with:', planName);

    if (planName === "Free") {
      console.log('Free plan selected, returning early');
      return;
    }

    console.log('Setting loading state for:', planName);
    setLoadingPlan(planName);

    try {
      console.log('Starting checkout for plan:', planName);
      console.log('Session token available:', !!session?.access_token);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planName },
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Checkout error:', error);
        toast.error(`Failed to start checkout: ${error.message || 'Unknown error'}`);
        return;
      }

      if (data?.error) {
        console.error('Checkout API error:', data.error);
        toast.error(`Checkout error: ${data.error}`);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('No URL in response:', data);
        toast.error('Failed to create checkout session. No URL returned.');
      }
    } catch (err) {
      console.error('Checkout exception:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {},
      });

      if (error) {
        console.error('Portal error:', error);
        toast.error('Failed to open billing portal. Please try again.');
        return;
      }

      if (data?.error) {
        console.error('Portal API error:', data.error);
        toast.info(data.error);
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        toast.info('No billing account found. Please subscribe to a plan first.');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
  };

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
                  'Manage Billing'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative hover:shadow-lg transition-shadow bg-white border ${
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
                  <span className="text-lg text-gray-600 ml-1">/{plan.period === "Forever" ? "forever" : "month"}</span>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {plan.period === "Forever" ? "No recurring charges" : "Billed monthly"}
                </div>
                <CardDescription className="mt-2 text-gray-600">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-medium ${plan.current ? 'bg-gray-400 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  disabled={plan.current || loadingPlan === plan.name || plan.name === "Free"}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Button clicked for plan:', plan.name, 'current:', plan.current, 'loading:', loadingPlan);
                    handleUpgrade(plan.name);
                  }}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : plan.current ? (
                    'Current Plan'
                  ) : plan.name === "Free" ? (
                    'Free Plan'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
                {!plan.current && plan.name !== "Free" && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    14-day free trial included
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
                <span className="font-medium text-gray-900">14 days on paid plans</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Payment Methods:</span>
                <span className="font-medium text-gray-900">Credit/Debit Cards, PayPal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Refund Policy:</span>
                <span className="font-medium text-gray-900">Pro-rated refunds available</span>
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
