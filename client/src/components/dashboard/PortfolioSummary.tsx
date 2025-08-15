import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowUpRight, PieChart } from "lucide-react";

export default function PortfolioSummary() {
  const { data: investments, isLoading } = useQuery({
    queryKey: ["/api/investments"],
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Investment Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded w-3/4 mx-auto mb-1"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculatePortfolioStats = () => {
    if (!investments || investments.length === 0) {
      return {
        totalValue: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
        diversityScore: 0,
      };
    }

    const totalValue = investments.reduce((sum: number, inv: any) => {
      return sum + (parseFloat(inv.quantity) * parseFloat(inv.costBasis));
    }, 0);

    // Mock daily change calculation (in real app, would use current prices)
    const dailyChange = totalValue * (Math.random() * 0.04 - 0.02); // ±2% random
    const dailyChangePercent = (dailyChange / totalValue) * 100;

    // Calculate diversity score based on number of holdings and types
    const uniqueTypes = new Set(investments.map((inv: any) => inv.type)).size;
    const holdingsCount = investments.length;
    const diversityScore = Math.min(10, (uniqueTypes * 2) + (holdingsCount * 0.5));

    return {
      totalValue,
      dailyChange,
      dailyChangePercent,
      diversityScore,
    };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'etf': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'crypto': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'mutual_fund': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const stats = calculatePortfolioStats();
  const topHoldings = investments?.slice(0, 3) || [];

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Investment Portfolio</CardTitle>
          <button 
            data-testid="link-view-investments"
            onClick={() => window.location.href = '/investments'}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center"
          >
            View Details
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {investments?.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-2">No investments yet</p>
            <p className="text-slate-500 text-sm">Start building your portfolio</p>
          </div>
        ) : (
          <>
            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Value</p>
                <p data-testid="text-portfolio-value" className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.totalValue)}
                </p>
                <div className="flex items-center justify-center mt-1 text-sm">
                  {stats.dailyChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                  )}
                  <span className={stats.dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(Math.abs(stats.dailyChange))} ({Math.abs(stats.dailyChangePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm">Today's Change</p>
                <p data-testid="text-daily-change" className={`text-2xl font-bold mt-1 ${
                  stats.dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {stats.dailyChange >= 0 ? '+' : ''}{formatCurrency(stats.dailyChange)}
                </p>
                <p className={`text-sm mt-1 ${stats.dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.dailyChange >= 0 ? '+' : ''}{stats.dailyChangePercent.toFixed(2)}%
                </p>
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm">Diversity Score</p>
                <p data-testid="text-diversity-score" className="text-2xl font-bold text-white mt-1">
                  {stats.diversityScore.toFixed(1)}/10
                </p>
                <p className="text-emerald-400 text-sm mt-1">Well Diversified</p>
              </div>
            </div>

            {/* Top Holdings */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Top Holdings</h4>
              {topHoldings.map((holding: any) => {
                const currentValue = parseFloat(holding.quantity) * parseFloat(holding.costBasis);
                const mockChange = Math.random() * 6 - 3; // Random change between -3% and +3%
                
                return (
                  <div 
                    key={holding.id}
                    data-testid={`holding-${holding.id}`}
                    className="flex items-center justify-between py-3 px-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">{holding.symbol}</p>
                          <Badge className={getTypeColor(holding.type)}>
                            {holding.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {parseFloat(holding.quantity).toFixed(2)} shares
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {mockChange >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <p className="text-white font-semibold">
                          {formatCurrency(currentValue)}
                        </p>
                      </div>
                      <p className={`text-sm ${mockChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mockChange >= 0 ? '+' : ''}{mockChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
