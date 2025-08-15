import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePlan } from "@/hooks/usePlan";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { requiresPlan } = usePlan();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState("month");

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

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (period: string) => {
      await apiRequest("POST", `/api/reports/generate?period=${period}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "Report generated successfully",
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
        description: "Failed to generate report",
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

  const canGenerateReports = requiresPlan('pro');

  const handleGenerateReport = () => {
    if (!canGenerateReports) {
      toast({
        title: "Upgrade Required",
        description: "AI-generated reports are available with Pro and Premium plans",
        variant: "destructive",
      });
      return;
    }
    
    generateReportMutation.mutate(selectedPeriod);
  };

  const formatPeriod = (period: string) => {
    if (period.startsWith('M')) {
      const [, year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
    if (period.startsWith('Q')) {
      return period.replace('Q', 'Quarter ');
    }
    if (period.startsWith('Y')) {
      return period.replace('Y', 'Year ');
    }
    return period;
  };

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
            <p className="text-slate-400">AI-generated insights and analysis</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger data-testid="select-report-period" className="w-40 bg-slate-700/50 border-slate-600/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              data-testid="button-generate-report"
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {generateReportMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate Report
            </Button>
          </div>
        </div>

        {/* Feature Gate for Free Users */}
        {!canGenerateReports && (
          <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                AI-Generated Reports Available with Pro
              </h3>
              <p className="text-slate-400 mb-6">
                Unlock detailed financial insights, trend analysis, and personalized recommendations
              </p>
              <Button 
                data-testid="button-upgrade-for-reports"
                onClick={() => window.location.href = '/subscribe'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {reportsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : reports?.length === 0 ? (
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No reports yet</h3>
              <p className="text-slate-400 mb-6">
                Generate your first AI-powered financial report to get detailed insights
              </p>
              {canGenerateReports && (
                <Button 
                  data-testid="button-generate-first-report"
                  onClick={handleGenerateReport}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Generate Your First Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reports?.map((report: any) => (
              <Card 
                key={report.id}
                data-testid={`card-report-${report.id}`}
                className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">
                          Financial Report - {formatPeriod(report.period)}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Generated on {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      data-testid={`button-download-report-${report.id}`}
                      variant="outline"
                      size="sm"
                      className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="prose prose-slate prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                        {report.summary}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
