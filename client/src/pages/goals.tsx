import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import GoalForm from "@/components/goals/GoalForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Goals() {
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

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/goals"],
    enabled: isAuthenticated,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Goal created successfully",
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
        description: "Failed to create goal",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTimeRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "1 day remaining";
    if (diffDays < 30) return `${diffDays} days remaining`;
    
    const months = Math.floor(diffDays / 30);
    if (months === 1) return "1 month remaining";
    return `${months} months remaining`;
  };

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
            <p className="text-slate-400">Set targets and track your progress</p>
          </div>
          <Button 
            data-testid="button-add-goal"
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Goals List */}
        {goalsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : goals?.length === 0 ? (
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No goals yet</h3>
              <p className="text-slate-400 mb-6">
                Set your first financial goal and start working towards it
              </p>
              <Button 
                data-testid="button-create-first-goal"
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals?.map((goal: any) => {
              const current = parseFloat(goal.current);
              const target = parseFloat(goal.target);
              const percentage = Math.min((current / target) * 100, 100);
              const remaining = target - current;
              const isCompleted = current >= target;
              
              return (
                <Card 
                  key={goal.id} 
                  data-testid={`card-goal-${goal.id}`}
                  className={`backdrop-blur-sm border-slate-700/50 ${
                    isCompleted 
                      ? "bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/50" 
                      : "bg-slate-800/40"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{goal.name}</span>
                      {isCompleted && (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">
                          ${current.toFixed(2)} / ${target.toFixed(2)}
                        </span>
                      </div>
                      
                      <Progress 
                        value={percentage} 
                        className="h-3"
                        data-testid={`progress-goal-${goal.id}`}
                      />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Complete</span>
                        <span className={isCompleted ? "text-emerald-400 font-semibold" : "text-white"}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      {!isCompleted && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Remaining</span>
                          <span className="text-white">${remaining.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {goal.targetDate && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">
                            {formatDate(goal.targetDate)}
                          </span>
                        </div>
                      )}
                      
                      {goal.targetDate && !isCompleted && (
                        <div className="text-xs text-slate-400">
                          {calculateTimeRemaining(goal.targetDate)}
                        </div>
                      )}
                      
                      {isCompleted && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                          <p className="text-emerald-400 text-sm font-medium">
                            🎉 Goal completed!
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

        {/* Goal Form Modal */}
        {showForm && (
          <GoalForm
            onSubmit={(data) => createGoalMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSubmitting={createGoalMutation.isPending}
          />
        )}
      </main>
    </AppLayout>
  );
}
