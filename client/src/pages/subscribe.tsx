import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Subscribe() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { plan } = usePlan();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleUpgrade = async (selectedPlan: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/billing/checkout", { plan: selectedPlan });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await apiRequest("POST", "/api/billing/portal");
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400">
            Unlock the full power of AI-driven financial management
          </p>
          {plan !== 'free' && (
            <div className="mt-6">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Current Plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <Card className={`backdrop-blur-sm border-slate-700/50 ${
            plan === 'free' ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/40'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Free</CardTitle>
                {plan === 'free' && (
                  <Badge className="bg-slate-600 text-white">Current</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white">
                $0<span className="text-base text-slate-400">/month</span>
              </div>
              <CardDescription className="text-slate-400">
                Perfect for getting started with basic financial tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Basic transaction tracking
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Manual categorization
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Basic budgets & goals
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  CSV export
                </li>
              </ul>
              {plan === 'free' ? (
                <Button 
                  data-testid="button-current-plan"
                  disabled 
                  className="w-full bg-slate-600 text-white cursor-not-allowed"
                >
                  Current Plan
                </Button>
              ) : (
                <Button 
                  data-testid="button-downgrade-free"
                  onClick={handleManageBilling}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  Manage Billing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`backdrop-blur-sm border-emerald-500/50 relative ${
            plan === 'pro' ? 'bg-emerald-900/20 border-emerald-500' : 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/20'
          }`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-emerald-600 text-white">
                {plan === 'pro' ? 'Current Plan' : 'Most Popular'}
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-emerald-400" />
                  Pro
                </CardTitle>
              </div>
              <div className="text-3xl font-bold text-white">
                $9.99<span className="text-base text-slate-400">/month</span>
              </div>
              <CardDescription className="text-slate-400">
                AI-powered insights and automation for serious users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Everything in Free
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  AI-powered insights
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Auto-categorization
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Expense forecasting
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Advanced budgets & goals
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Monthly AI reports
                </li>
              </ul>
              {plan === 'pro' ? (
                <Button 
                  data-testid="button-manage-pro"
                  onClick={handleManageBilling}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  data-testid="button-upgrade-pro"
                  onClick={() => handleUpgrade('pro')}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  {plan === 'premium' ? 'Downgrade to Pro' : 'Upgrade to Pro'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={`backdrop-blur-sm border-slate-700/50 ${
            plan === 'premium' ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/50' : 'bg-slate-800/40'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-purple-400" />
                  Premium
                </CardTitle>
                {plan === 'premium' && (
                  <Badge className="bg-purple-600 text-white">Current</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white">
                $19.99<span className="text-base text-slate-400">/month</span>
              </div>
              <CardDescription className="text-slate-400">
                Advanced portfolio management and premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Portfolio analysis
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  What-if simulator
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Tax estimator
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Fraud alerts
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-3" />
                  Priority support
                </li>
              </ul>
              {plan === 'premium' ? (
                <Button 
                  data-testid="button-manage-premium"
                  onClick={handleManageBilling}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  data-testid="button-upgrade-premium"
                  onClick={() => handleUpgrade('premium')}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  Upgrade to Premium
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-400" />
              Why Upgrade?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-emerald-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">AI-Powered Insights</h3>
                <p className="text-slate-400 text-sm">
                  Get personalized recommendations and smart categorization
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Advanced Security</h3>
                <p className="text-slate-400 text-sm">
                  Enhanced fraud detection and security monitoring
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Premium Support</h3>
                <p className="text-slate-400 text-sm">
                  Priority customer support and dedicated assistance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
