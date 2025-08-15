import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import BudgetForm from "@/components/budgets/BudgetForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Budgets() {
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

  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ["/api/budgets"],
    enabled: isAuthenticated,
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/budgets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Budget created successfully",
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
        description: "Failed to create budget",
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

  // Calculate spending by category for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlySpending = (transactions || []).reduce((acc: any, transaction: any) => {
    const transactionMonth = transaction.date.slice(0, 7);
    if (transactionMonth === currentMonth && transaction.direction === 'expense') {
      acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(parseFloat(transaction.amount));
    }
    return acc;
  }, {});

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Budgets</h1>
            <p className="text-slate-400">Set spending limits and track your progress</p>
          </div>
          <Button 
            data-testid="button-add-budget"
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Budget
          </Button>
        </div>

        {/* Budget List */}
        {budgetsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (budgets || []).length === 0 ? (
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No budgets yet</h3>
              <p className="text-slate-400 mb-6">
                Create your first budget to start tracking your spending limits
              </p>
              <Button 
                data-testid="button-create-first-budget"
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(budgets || []).map((budget: any) => {
              const spent = monthlySpending[budget.category] || 0;
              const remaining = parseFloat(budget.monthlyCap) - spent;
              const percentage = Math.min((spent / parseFloat(budget.monthlyCap)) * 100, 100);
              const isOverBudget = spent > parseFloat(budget.monthlyCap);
              
              return (
                <Card 
                  key={budget.id} 
                  data-testid={`card-budget-${budget.id}`}
                  className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50"
                >
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{budget.category}</span>
                      {isOverBudget && (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Spent</span>
                        <span className={isOverBudget ? "text-red-400 font-semibold" : "text-white"}>
                          ${spent.toFixed(2)}
                        </span>
                      </div>
                      
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        data-testid={`progress-budget-${budget.id}`}
                      />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Budget</span>
                        <span className="text-white">${parseFloat(budget.monthlyCap).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Remaining</span>
                        <div className="flex items-center space-x-1">
                          {remaining >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={remaining >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                            ${Math.abs(remaining).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {isOverBudget && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-red-400 text-sm">
                            Over budget by ${(spent - parseFloat(budget.monthlyCap)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Budget Form Modal */}
        {showForm && (
          <BudgetForm
            onSubmit={(data) => createBudgetMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSubmitting={createBudgetMutation.isPending}
          />
        )}
      </main>
    </AppLayout>
  );
}
