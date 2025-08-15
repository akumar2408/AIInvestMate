import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CategoryRule, Category } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CreateCategoryRuleDialog } from "./CreateCategoryRuleDialog";

export function CategoryRulesList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: categoryRules = [], isLoading } = useQuery({
    queryKey: ["/api/category-rules"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/category-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-rules"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/category-rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-rules"] });
    },
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

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
          <h2 className="text-2xl font-bold">Auto-Categorization Rules</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically categorize transactions based on merchant names and amounts
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-create-category-rule"
        >
          Add Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {categoryRules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categorization rules yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create rules to automatically categorize transactions based on merchant patterns
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create your first rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          categoryRules
            .sort((a: CategoryRule, b: CategoryRule) => (b.priority || 0) - (a.priority || 0))
            .map((rule: CategoryRule) => (
              <Card key={rule.id} className={rule.isActive ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Rule #{rule.priority || 0}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => 
                          toggleMutation.mutate({ id: rule.id, isActive: checked })
                        }
                        data-testid={`switch-category-rule-${rule.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(rule.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-category-rule-${rule.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Merchant Pattern:</span>
                      <Badge variant="secondary" className="font-mono">
                        {rule.merchantRegex}
                      </Badge>
                    </div>
                    
                    {(rule.amountMin || rule.amountMax) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Amount Range:</span>
                        <Badge variant="outline">
                          {rule.amountMin && `$${rule.amountMin}`}
                          {rule.amountMin && rule.amountMax && ' - '}
                          {rule.amountMax && `$${rule.amountMax}`}
                        </Badge>
                      </div>
                    )}
                    
                    {rule.categoryId && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Auto-assign to:</span>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          {getCategoryName(rule.categoryId)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      When a transaction merchant matches <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{rule.merchantRegex}</code>
                      {(rule.amountMin || rule.amountMax) && (
                        <span>
                          {' '}and amount is{' '}
                          {rule.amountMin && rule.amountMax ? `between $${rule.amountMin} and $${rule.amountMax}` :
                           rule.amountMin ? `at least $${rule.amountMin}` :
                           `at most $${rule.amountMax}`}
                        </span>
                      )}
                      , it will be automatically categorized as <strong>{getCategoryName(rule.categoryId!)}</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      <CreateCategoryRuleDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        categories={categories}
      />
    </div>
  );
}