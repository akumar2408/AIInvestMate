import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, ArrowUpRight } from "lucide-react";

export default function GoalProgress() {
  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/goals"],
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Goals Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-slate-700 rounded mb-1"></div>
                <div className="h-3 bg-slate-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateTimeRemaining = (targetDate: string) => {
    if (!targetDate) return '';
    
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day remaining';
    if (diffDays < 30) return `${diffDays} days remaining`;
    
    const months = Math.floor(diffDays / 30);
    if (months === 1) return '1 month remaining';
    return `${months} months remaining`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-emerald-500 to-emerald-400';
    if (percentage >= 75) return 'from-emerald-500 to-emerald-400';
    if (percentage >= 50) return 'from-blue-500 to-blue-400';
    if (percentage >= 25) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  const displayGoals = goals?.slice(0, 3) || [];

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Goals Progress</CardTitle>
          <button 
            data-testid="link-manage-goals"
            onClick={() => window.location.href = '/goals'}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center"
          >
            Manage Goals
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {displayGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-2">No goals set yet</p>
            <p className="text-slate-500 text-sm mb-4">Create your first financial goal</p>
            <Button 
              data-testid="button-create-goal"
              onClick={() => window.location.href = '/goals'}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayGoals.map((goal: any) => {
              const current = parseFloat(goal.current);
              const target = parseFloat(goal.target);
              const percentage = Math.min((current / target) * 100, 100);
              const progressColor = getProgressColor(percentage);
              
              return (
                <div key={goal.id} data-testid={`goal-progress-${goal.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{goal.name}</span>
                    <span className="text-sm text-slate-400">
                      ${current.toFixed(0)} / ${target.toFixed(0)}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2 mb-1" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {percentage.toFixed(0)}% complete
                    </span>
                    {goal.targetDate && (
                      <span className="text-slate-400">
                        {calculateTimeRemaining(goal.targetDate)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            <Button 
              data-testid="button-create-new-goal"
              onClick={() => window.location.href = '/goals'}
              variant="outline"
              className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
