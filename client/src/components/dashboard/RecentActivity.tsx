import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Building, 
  Car, 
  Film, 
  Coffee,
  ArrowUpRight,
  Plus,
  Minus
} from "lucide-react";

export default function RecentActivity() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 py-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-slate-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTransactionIcon = (category: string, direction: string) => {
    if (direction === 'income') return Building;
    
    switch (category?.toLowerCase()) {
      case 'groceries':
        return ShoppingCart;
      case 'transportation':
        return Car;
      case 'entertainment':
        return Film;
      case 'dining':
        return Coffee;
      default:
        return ShoppingCart;
    }
  };

  const getTransactionColor = (category: string, direction: string) => {
    if (direction === 'income') return 'bg-emerald-500/20 text-emerald-400';
    
    switch (category?.toLowerCase()) {
      case 'groceries':
        return 'bg-red-500/20 text-red-400';
      case 'transportation':
        return 'bg-blue-500/20 text-blue-400';
      case 'entertainment':
        return 'bg-purple-500/20 text-purple-400';
      case 'dining':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: string, direction: string) => {
    const value = parseFloat(amount);
    const formatted = Math.abs(value).toFixed(2);
    return direction === 'income' ? `+$${formatted}` : `-$${formatted}`;
  };

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <button 
            data-testid="link-view-all-transactions"
            onClick={() => window.location.href = '/transactions'}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center"
          >
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400">No recent transactions</p>
            <p className="text-slate-500 text-sm mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction: any) => {
              const Icon = getTransactionIcon(transaction.category, transaction.direction);
              const iconColor = getTransactionColor(transaction.category, transaction.direction);
              
              return (
                <div 
                  key={transaction.id}
                  data-testid={`transaction-${transaction.id}`}
                  className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {transaction.merchant || 'Unknown Merchant'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {transaction.category}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {transaction.direction === 'income' ? (
                      <Plus className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-semibold ${
                      transaction.direction === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatAmount(transaction.amount, transaction.direction)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
