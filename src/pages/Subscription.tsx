
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Subscription = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
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

  const handleUpgrade = (planName: string) => {
    toast.success(`Redirecting to ${planName} upgrade...`);
    // In a real app, this would initiate Stripe checkout
  };

  const handleManageBilling = () => {
    toast.success("Opening billing portal...");
    // In a real app, this would open Stripe customer portal
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
          <p className="text-gray-600">
            Manage your plan and billing preferences
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="default" className="bg-gradient-primary text-primary-foreground">
                    {user?.subscriptionTier?.toUpperCase()} PLAN
                  </Badge>
                  {user?.subscriptionActive && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">
                  {user?.subscriptionTier === 'free' && "You're on our free plan with basic features."}
                  {user?.subscriptionTier === 'basic' && "Enjoy unlimited entries and voice features."}
                  {user?.subscriptionTier === 'premium' && "Access to all premium features and priority support."}
                </p>
              </div>
              <Button onClick={handleManageBilling} variant="outline">
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative hover:shadow-lg transition-shadow ${
              plan.current ? 'border-blue-500 shadow-lg' : ''
            }`}>
              {plan.current && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                  Current Plan
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mb-2">{plan.price}</div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.current ? 'bg-gray-400' : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'}`}
                  disabled={plan.current}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Billing History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No billing history available</p>
              <p className="text-sm">Transaction history will appear here once you upgrade</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
