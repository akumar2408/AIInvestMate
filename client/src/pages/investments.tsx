import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import InvestmentForm from "@/components/investments/InvestmentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Investments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [showForm, setShowForm] = useState(false);

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

  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/investments"],
    enabled: isAuthenticated,
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/investments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Investment added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to add investment",
        variant: "destructive",
      });
    },
  });

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

  // Calculate portfolio summary
  const totalValue = investments?.reduce((sum: number, inv: any) => {
    return sum + (parseFloat(inv.quantity) * parseFloat(inv.costBasis));
  }, 0) || 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'etf': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'crypto': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'mutual_fund': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    // For demo purposes, using mock performance data
    const mockPerformance = Math.random() > 0.5;
    return mockPerformance ? (
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Investment Portfolio</h1>
            <p className="text-slate-400">Track and manage your investment holdings</p>
          </div>
          <Button 
            data-testid="button-add-investment"
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Portfolio Value</p>
                  <p data-testid="text-total-value" className="text-2xl font-bold text-white mt-1">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-emerald-500/20 p-3 rounded-lg">
                  <PieChart className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Holdings</p>
                  <p data-testid="text-total-holdings" className="text-2xl font-bold text-white mt-1">
                    {investments?.length || 0}
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Diversity Score</p>
                  <p data-testid="text-diversity-score" className="text-2xl font-bold text-white mt-1">
                    8.2/10
                  </p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <p className="text-emerald-400 text-xs mt-2">Well Diversified</p>
            </CardContent>
          </Card>
        </div>

        {/* Investments List */}
        {investmentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : investments?.length === 0 ? (
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="py-12 text-center">
              <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No investments yet</h3>
              <p className="text-slate-400 mb-6">
                Add your first investment to start tracking your portfolio
              </p>
              <Button 
                data-testid="button-create-first-investment"
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Add Your First Investment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investments?.map((investment: any) => {
                  const currentValue = parseFloat(investment.quantity) * parseFloat(investment.costBasis);
                  
                  return (
                    <div 
                      key={investment.id}
                      data-testid={`row-investment-${investment.id}`}
                      className="flex items-center justify-between py-4 px-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {investment.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-medium">
                              {investment.symbol}
                            </p>
                            <Badge className={getTypeColor(investment.type)}>
                              {investment.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">
                            {investment.name || investment.symbol}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(investment.type)}
                          <p className="text-white font-semibold">
                            ${currentValue.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {parseFloat(investment.quantity).toFixed(4)} shares
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Form Modal */}
        {showForm && (
          <InvestmentForm
            onSubmit={(data) => createInvestmentMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSubmitting={createInvestmentMutation.isPending}
          />
        )}
      </main>
    </AppLayout>
  );
}
