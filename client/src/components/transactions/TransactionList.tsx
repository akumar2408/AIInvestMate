import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Building, 
  Car, 
  Film, 
  Coffee,
  Plus,
  Minus,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Transaction {
  id: string;
  amount: string;
  merchant: string;
  category: string;
  direction: "income" | "expense" | "transfer";
  date: string;
  notes?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function TransactionList({ transactions, isLoading }: TransactionListProps) {
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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatAmount = (amount: string, direction: string) => {
    const value = parseFloat(amount);
    const formatted = Math.abs(value).toFixed(2);
    return direction === 'income' ? `+$${formatted}` : `-$${formatted}`;
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 py-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-slate-700 rounded w-16"></div>
                <div className="w-6 h-6 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="py-12 text-center">
          <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
          <p className="text-slate-400 mb-6">
            No transactions match your current filters. Try adjusting your search or add a new transaction.
          </p>
          <Button 
            data-testid="button-add-first-transaction"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Add Your First Transaction
          </Button>
        </CardContent>
      </Card>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="space-y-6">
      {groupedTransactions.map(([dateKey, dayTransactions]) => (
        <Card key={dateKey} className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">
                {formatDate(dayTransactions[0].date)}
              </CardTitle>
              <div className="text-slate-400 text-sm">
                {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayTransactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.category, transaction.direction);
                const iconColor = getTransactionColor(transaction.category, transaction.direction);
                
                return (
                  <div 
                    key={transaction.id}
                    data-testid={`transaction-item-${transaction.id}`}
                    className="flex items-center justify-between py-3 px-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-white truncate">
                            {transaction.merchant}
                          </p>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 flex-shrink-0">
                            {transaction.category}
                          </Badge>
                        </div>
                        {transaction.notes && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
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
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            data-testid={`button-transaction-menu-${transaction.id}`}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            data-testid={`menu-edit-${transaction.id}`}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            data-testid={`menu-delete-${transaction.id}`}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
