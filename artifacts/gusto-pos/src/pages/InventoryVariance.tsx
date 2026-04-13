import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";

interface VarianceItem {
  itemId: string;
  itemName: string;
  itemNameEs?: string;
  auditCount: number;
  totalVariance: number;
  avgVariancePercent: number;
  maxVariance: number;
  minVariance: number;
  negativeCount: number;
  positiveCount: number;
  lastVariancePercent: number;
}

interface Recommendation {
  itemId: string;
  itemName: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

interface VarianceSummary {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalAudits: number;
    itemsAudited: number;
    itemsWithVariance: number;
  };
  itemVariances: VarianceItem[];
  recommendations: Recommendation[];
}

export default function InventoryVariance() {
  const { language } = usePosStore();
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery<VarianceSummary>({
    queryKey: [`/api/inventory-audits/variance-summary?days=${days}`],
    queryFn: async () => {
      const response = await fetch(
        `/api/inventory-audits/variance-summary?days=${days}`,
      );
      if (!response.ok) throw new Error("Failed to fetch variance summary");
      return response.json();
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "high":
        return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      default:
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle size={16} />;
      case "high":
        return <AlertTriangle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">
            {getTranslation("error", language)}
          </p>
          <Link href="/inventory">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              {language === "es" ? "Volver" : "Go Back"}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { summary, itemVariances, recommendations } = data;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/inventory">
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold">
              {language === "es"
                ? "Análisis de Variación"
                : "Variance Analysis"}
            </h1>
            <p className="text-muted-foreground">
              {language === "es"
                ? "Identifica problemas sistemáticos en el inventario"
                : "Identify systematic inventory issues"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {d} {language === "es" ? "días" : "days"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BarChart3 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Total Auditorías" : "Total Audits"}
                </p>
                <p className="text-2xl font-bold">{summary.totalAudits}</p>
              </div>
            </div>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Info size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Items Auditados" : "Items Audited"}
                </p>
                <p className="text-2xl font-bold">{summary.itemsAudited}</p>
              </div>
            </div>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle size={20} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Con Variación" : "With Variance"}
                </p>
                <p className="text-2xl font-bold">
                  {summary.itemsWithVariance}
                </p>
              </div>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              {language === "es" ? "Recomendaciones" : "Recommendations"}
            </h2>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${getSeverityColor(
                    rec.severity,
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getSeverityIcon(rec.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{rec.itemName}</span>
                        <span className="text-xs uppercase px-2 py-0.5 rounded bg-white/10">
                          {rec.severity}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{rec.issue}</p>
                      <p className="text-sm opacity-80 mt-1">
                        {rec.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4">
            {language === "es"
              ? "Historial de Variación por Item"
              : "Variance History by Item"}
          </h2>
          {itemVariances.length === 0 ? (
            <div className="glass p-8 rounded-2xl border border-white/10 text-center">
              <p className="text-muted-foreground">
                {language === "es"
                  ? "No hay datos de auditoría para este período"
                  : "No audit data for this period"}
              </p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground text-sm">
                      <th className="p-3 font-medium">
                        {language === "es" ? "Item" : "Item"}
                      </th>
                      <th className="p-3 font-medium text-center">
                        {language === "es" ? "Auditorías" : "Audits"}
                      </th>
                      <th className="p-3 font-medium text-right">
                        {language === "es"
                          ? "Variación Total"
                          : "Total Variance"}
                      </th>
                      <th className="p-3 font-medium text-right">
                        {language === "es" ? "% Promedio" : "Avg %"}
                      </th>
                      <th className="p-3 font-medium text-center">
                        {language === "es" ? "Última Variación" : "Last Var %"}
                      </th>
                      <th className="p-3 font-medium text-center">
                        {language === "es" ? "Tendencia" : "Trend"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {itemVariances.map((item) => (
                      <tr
                        key={item.itemId}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 font-medium">
                          {language === "es" && item.itemNameEs
                            ? item.itemNameEs
                            : item.itemName}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {item.auditCount}
                        </td>
                        <td
                          className={`p-3 text-right font-mono ${
                            item.totalVariance > 0
                              ? "text-emerald-400"
                              : item.totalVariance < 0
                                ? "text-red-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {item.totalVariance > 0 ? "+" : ""}
                          {item.totalVariance.toFixed(1)}
                        </td>
                        <td
                          className={`p-3 text-right font-mono ${
                            Math.abs(item.avgVariancePercent) > 5
                              ? "text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.avgVariancePercent.toFixed(1)}%
                        </td>
                        <td
                          className={`p-3 text-center font-mono ${
                            item.lastVariancePercent > 0
                              ? "text-emerald-400"
                              : item.lastVariancePercent < 0
                                ? "text-red-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {item.lastVariancePercent > 0 ? "+" : ""}
                          {item.lastVariancePercent.toFixed(1)}%
                        </td>
                        <td className="p-3 text-center">
                          {item.negativeCount > item.positiveCount ? (
                            <TrendingDown
                              size={18}
                              className="text-red-400 mx-auto"
                            />
                          ) : item.positiveCount > item.negativeCount ? (
                            <TrendingUp
                              size={18}
                              className="text-emerald-400 mx-auto"
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
