import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Target } from "lucide-react";

type DashboardSummary = {
  totalBalance: number;
  monthlySpending: number;
  investmentValue: number;
  savingsProgress: number;
};

export default function FinancialOverview() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-700 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  // Mock previous values for percentage calculations
  const previousValues = {
    totalBalance: (summary?.totalBalance || 0) * 0.976,
    monthlySpending: (summary?.monthlySpending || 0) * 1.052,
    investmentValue: (summary?.investmentValue || 0) * 0.913,
  };

  const balanceChange = formatChange(summary?.totalBalance || 0, previousValues.totalBalance);
  const spendingChange = formatChange(summary?.monthlySpending || 0, previousValues.monthlySpending);
  const investmentChange = formatChange(summary?.investmentValue || 0, previousValues.investmentValue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Balance */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Balance</p>
              <p data-testid="text-total-balance" className="text-2xl font-bold text-white mt-1">
                {formatCurrency(summary?.totalBalance || 0)}
              </p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {balanceChange.isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
            )}
            <span className={`font-medium ${balanceChange.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {balanceChange.isPositive ? '+' : '-'}{balanceChange.value}%
            </span>
            <span className="text-slate-400 ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Spending */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">This Month Spending</p>
              <p data-testid="text-monthly-spending" className="text-2xl font-bold text-white mt-1">
                {formatCurrency(summary?.monthlySpending || 0)}
              </p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {spendingChange.isPositive ? (
              <TrendingUp className="w-4 h-4 text-red-400 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-400 mr-1" />
            )}
            <span className={`font-medium ${spendingChange.isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
              {spendingChange.isPositive ? '+' : '-'}{spendingChange.value}%
            </span>
            <span className="text-slate-400 ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Investment Value */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Investment Value</p>
              <p data-testid="text-investment-value" className="text-2xl font-bold text-white mt-1">
                {formatCurrency(summary?.investmentValue || 0)}
              </p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {investmentChange.isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
            )}
            <span className={`font-medium ${investmentChange.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {investmentChange.isPositive ? '+' : '-'}{investmentChange.value}%
            </span>
            <span className="text-slate-400 ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Savings Progress */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Savings Progress</p>
              <p data-testid="text-savings-progress" className="text-2xl font-bold text-white mt-1">
                {(summary?.savingsProgress || 0).toFixed(0)}%
              </p>
            </div>
            <div className="bg-amber-500/20 p-3 rounded-lg">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(summary?.savingsProgress || 0, 100)}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
