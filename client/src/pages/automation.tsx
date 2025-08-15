import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurringRulesList } from "@/components/recurring-rules/RecurringRulesList";
import { CategoryRulesList } from "@/components/category-rules/CategoryRulesList";
import { Clock, Zap, TrendingUp, Bot } from "lucide-react";

export default function AutomationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up rules to automate your financial tracking and categorization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recurring Rules
            </CardTitle>
            <CardDescription>
              Auto-post transactions like rent, salary, subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2</div>
            <p className="text-sm text-gray-600">Active rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Auto-Categorization
            </CardTitle>
            <CardDescription>
              Smart rules to categorize transactions automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <p className="text-sm text-gray-600">Category rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Efficiency
            </CardTitle>
            <CardDescription>
              Time saved through automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">85%</div>
            <p className="text-sm text-gray-600">Less manual work</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recurring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="recurring" 
            className="flex items-center gap-2"
            data-testid="tab-recurring-rules"
          >
            <Clock className="h-4 w-4" />
            Recurring Rules
          </TabsTrigger>
          <TabsTrigger 
            value="categorization" 
            className="flex items-center gap-2"
            data-testid="tab-category-rules"
          >
            <Zap className="h-4 w-4" />
            Auto-Categorization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-6">
          <RecurringRulesList />
        </TabsContent>

        <TabsContent value="categorization" className="space-y-6">
          <CategoryRulesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}