import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import type { Transaction } from "@shared/schema";

export default function SpendingChart() {
  const [timeRange, setTimeRange] = useState("6months");
  
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Monthly Spending Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process transactions into monthly spending data
  const processTransactionData = () => {
    if (!transactions.length) {
      // Generate synthetic data for visualization
      return [
        { month: 'Jul', spending: 3200 },
        { month: 'Aug', spending: 2800 },
        { month: 'Sep', spending: 3400 },
        { month: 'Oct', spending: 3100 },
        { month: 'Nov', spending: 2900 },
        { month: 'Dec', spending: 3240 },
      ];
    }

    const monthlyData: { [key: string]: number } = {};
    
    transactions
      .filter((t) => t.direction === "expense")
      .forEach((transaction) => {
        const date = new Date(transaction.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const amount = Math.abs(Number(transaction.amount ?? 0));
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
      });

    return Object.entries(monthlyData).map(([month, spending]) => ({
      month,
      spending: Math.round(spending)
    }));
  };

  const chartData = processTransactionData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-emerald-400 font-medium">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Monthly Spending Trends</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger data-testid="select-time-range" className="w-40 bg-slate-700/50 border-slate-600/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="spending" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
