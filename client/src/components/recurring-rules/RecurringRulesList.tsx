import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RecurringRule } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Clock, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { CreateRecurringRuleDialog } from "./CreateRecurringRuleDialog";

export function RecurringRulesList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: recurringRules = [], isLoading } = useQuery({
    queryKey: ["/api/recurring-rules"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recurring-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-rules"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/recurring-rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-rules"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Rules</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically post recurring transactions like rent, salary, and subscriptions
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-create-recurring-rule"
        >
          Add Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {recurringRules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recurring rules yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Set up recurring transactions to automatically track your regular income and expenses
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create your first rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          recurringRules.map((rule: RecurringRule) => (
            <Card key={rule.id} className={rule.isActive ? "" : "opacity-60"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ id: rule.id, isActive: checked })
                      }
                      data-testid={`switch-rule-${rule.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-rule-${rule.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className={`font-semibold ${
                      rule.direction === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {rule.direction === 'income' ? '+' : '-'}${rule.amount}
                    </span>
                  </div>
                  <Badge variant="secondary">{rule.cadence}</Badge>
                  {rule.category && (
                    <Badge variant="outline">{rule.category}</Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Merchant: {rule.merchant}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>Next run: {format(new Date(rule.nextRunAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateRecurringRuleDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}