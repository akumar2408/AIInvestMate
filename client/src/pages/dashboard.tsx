import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import AIInsights from "@/components/dashboard/AIInsights";
import SpendingChart from "@/components/dashboard/SpendingChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import GoalProgress from "@/components/dashboard/GoalProgress";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Financial Overview Cards */}
        <FinancialOverview />
        
        {/* AI Insights and Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AIInsights />
          <div className="lg:col-span-2">
            <SpendingChart />
          </div>
        </div>
        
        {/* Recent Activity and Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          <GoalProgress />
        </div>
        
        {/* Investment Portfolio Summary */}
        <PortfolioSummary />
      </main>
    </AppLayout>
  );
}
