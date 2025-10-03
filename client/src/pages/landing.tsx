import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, TrendingUp, Shield, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AI Investmate</span>
            </div>
            <Button 
              data-testid="button-login"
              onClick={() => window.location.href = '/api/login'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Smart Financial Management with AI
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Take control of your finances with AI-powered insights, automated tracking, 
              and personalized coaching to reach your financial goals faster.
            </p>
            <Button 
              data-testid="button-get-started"
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3"
            >
              Start Your Financial Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-800/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-slate-400 text-lg">
              Powerful features designed to simplify your financial life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-emerald-400" />
                </div>
                <CardTitle className="text-white">AI Money Coach</CardTitle>
                <CardDescription className="text-slate-400">
                  Get personalized financial advice and insights powered by advanced AI
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Smart Tracking</CardTitle>
                <CardDescription className="text-slate-400">
                  Automatic transaction categorization and spending pattern analysis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Bank-Level Security</CardTitle>
                <CardDescription className="text-slate-400">
                  Your financial data is protected with enterprise-grade security
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-slate-400 text-lg">
              Start free and upgrade as your needs grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Free</CardTitle>
                <div className="text-3xl font-bold text-white">$0<span className="text-base text-slate-400">/month</span></div>
                <CardDescription className="text-slate-400">
                  Perfect for getting started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
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
                <Button 
                  data-testid="button-free-plan"
                  className="w-full mt-6 bg-slate-700 hover:bg-slate-600"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/50 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Pro</CardTitle>
                <div className="text-3xl font-bold text-white">$9.99<span className="text-base text-slate-400">/month</span></div>
                <CardDescription className="text-slate-400">
                  AI-powered insights and automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
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
                    Monthly AI reports
                  </li>
                </ul>
                <Button 
                  data-testid="button-pro-plan"
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Premium</CardTitle>
                <div className="text-3xl font-bold text-white">$19.99<span className="text-base text-slate-400">/month</span></div>
                <CardDescription className="text-slate-400">
                  Advanced portfolio management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
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
                    Priority support
                  </li>
                </ul>
                <Button 
                  data-testid="button-premium-plan"
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AI Investmate</span>
          </div>
          <p className="text-slate-400">
            Your intelligent financial companion for a better tomorrow.
          </p>
        </div>
      </footer>
    </div>
  );
}
