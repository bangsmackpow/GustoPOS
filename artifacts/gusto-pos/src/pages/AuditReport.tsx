import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store";
import {
  ChevronLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { format } from "date-fns";

interface AuditResult {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  previousTotal: number;
  reportedTotal: number;
  variance: number;
  variancePercent: number;
  auditReason: string;
}

interface AuditReport {
  session: {
    id: string;
    status: string;
    typeFilter: string;
    startedAt: number;
    completedAt: number;
    completedByUserId: string;
    itemCount: number;
    completedCount: number;
  };
  summary: {
    totalItems: number;
    totalVariance: number;
    overages: number;
    shortages: number;
    onTarget: number;
  };
  results: AuditResult[];
}

export default function AuditReport() {
  const [, params] = useRoute("/settings/batch-audit/:id/report");
  const [, setLocation] = useLocation();
  const sessionId = params?.id;
  const { data: auth } = useGetCurrentAuthUser();
  const { language } = usePosStore();
  const { toast } = useToast();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/inventory/audit-sessions/${sessionId}/report`,
        );
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to load report",
        });
        setLocation("/settings");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId, setLocation, toast]);

  const getVarianceIcon = (variance: number) => {
    if (variance > 0)
      return <TrendingUp size={16} className="text-green-400" />;
    if (variance < 0)
      return <TrendingDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-muted-foreground" />;
  };

  const getVarianceClass = (variance: number) => {
    if (variance > 0) return "text-green-400";
    if (variance < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-muted-foreground">Report not found</div>
        <Button onClick={() => setLocation("/settings")}>
          <ChevronLeft size={18} className="mr-2" />
          Back to Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/settings")}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            <h1 className="text-xl font-display font-bold">Audit Report</h1>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {report.session.completedAt
            ? format(
                new Date(report.session.completedAt * 1000),
                "MMM d, yyyy h:mm a",
              )
            : "—"}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4">
            <div className="text-sm text-muted-foreground mb-1">
              Total Items
            </div>
            <div className="text-2xl font-bold">
              {report.summary.totalItems}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-sm text-muted-foreground mb-1">On Target</div>
            <div className="text-2xl font-bold text-green-400">
              {report.summary.onTarget}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Overages</div>
            <div className="text-2xl font-bold text-yellow-400">
              {report.summary.overages}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Shortages</div>
            <div className="text-2xl font-bold text-red-400">
              {report.summary.shortages}
            </div>
          </div>
        </div>

        {/* Total Variance */}
        <div className="glass rounded-2xl p-6">
          <div className="text-sm text-muted-foreground mb-2">Net Variance</div>
          <div
            className={`text-4xl font-bold ${
              report.summary.totalVariance > 0
                ? "text-green-400"
                : report.summary.totalVariance < 0
                  ? "text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            {report.summary.totalVariance > 0 ? "+" : ""}
            {report.summary.totalVariance.toFixed(1)} units
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {report.session.typeFilter || "All"} items audited by{" "}
            {report.session.completedByUserId || "unknown"}
          </div>
        </div>

        {/* Results Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-medium">Audit Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-sm">
                  <th className="p-3 font-medium">Item</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium text-right">Previous</th>
                  <th className="p-3 font-medium text-right">Counted</th>
                  <th className="p-3 font-medium text-right">Variance</th>
                  <th className="p-3 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {report.results.map((result: AuditResult) => (
                  <tr key={result.id} className="hover:bg-white/5">
                    <td className="p-3">{result.itemName}</td>
                    <td className="p-3 capitalize text-muted-foreground">
                      {result.itemType}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {result.previousTotal.toFixed(0)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {result.reportedTotal.toFixed(0)}
                    </td>
                    <td
                      className={`p-3 text-right font-mono flex items-center justify-end gap-1 ${getVarianceClass(
                        result.variance,
                      )}`}
                    >
                      {getVarianceIcon(result.variance)}
                      {result.variance > 0 ? "+" : ""}
                      {result.variance.toFixed(0)}
                    </td>
                    <td
                      className={`p-3 text-right font-mono ${getVarianceClass(
                        result.variance,
                      )}`}
                    >
                      {result.variancePercent > 0 ? "+" : ""}
                      {result.variancePercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
