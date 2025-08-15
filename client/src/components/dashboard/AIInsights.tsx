import { usePlan } from "@/hooks/usePlan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, TrendingUp, Shield, Crown } from "lucide-react";

export default function AIInsights() {
  const { requiresPlan } = usePlan();
  const canViewInsights = requiresPlan('pro');

  if (!canViewInsights) {
    return (
      <div className="lg:col-span-1">
        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
            <p className="text-slate-400 text-sm mb-4">
              Unlock personalized financial insights with Pro
            </p>
            <Button 
              data-testid="button-upgrade-insights"
              onClick={() => window.location.href = '/subscribe'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const insights = [
    {
      icon: Lightbulb,
      iconColor: "text-amber-400",
      text: "You're spending 15% more on dining out this month. Consider setting a $400 monthly limit to stay on track."
    },
    {
      icon: TrendingUp,
      iconColor: "text-emerald-400",
      text: "Your investment portfolio is well-diversified. Consider adding international ETFs for better global exposure."
    },
    {
      icon: Shield,
      iconColor: "text-blue-400",
      text: "Great job! You're on track to reach your emergency fund goal by Q3 2024. Keep up the consistent saving."
    }
  ];

  return (
    <div className="lg:col-span-1">
      <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 backdrop-blur-sm border-emerald-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="bg-emerald-500/20 p-2 rounded-lg mr-3">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            AI Insights
            <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Pro
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div 
                key={index}
                data-testid={`insight-${index}`}
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-5 h-5 ${insight.iconColor} mt-0.5 flex-shrink-0`} />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </div>
            );
          })}
          
          <Button 
            data-testid="button-more-insights"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Get More Insights
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
