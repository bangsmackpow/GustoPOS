import React, { useState } from "react";
import {
  useGetShifts,
  useGetEndOfNightReport,
} from "@workspace/api-client-react";
import {
  useStartShiftMutation,
  useCloseShiftMutation,
} from "@/hooks/use-pos-mutations";
import { usePosStore } from "@/store";
import { formatMoney, getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Play,
  StopCircle,
  ReceiptText,
  Wine,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  History,
  Package,
  X,
  Users,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Trash2,
} from "lucide-react";
import { format, subDays } from "date-fns";

export default function Reports() {
  const { language, activeStaff } = usePosStore();
  const { toast } = useToast();
  const { data: shifts, isLoading: loadingShifts } = useGetShifts();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [openTabsError, setOpenTabsError] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "shifts" | "analytics" | "forecast" | "audits"
  >("shifts");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [forecastDays, setForecastDays] = useState(14);
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [auditDays, setAuditDays] = useState(90);
  const [auditHistory, setAuditHistory] = useState<any>(null);
  const [varianceSummary, setVarianceSummary] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState("");

  // Find currently active shift
  const activeShift = shifts?.find((s) => s.status === "active");

  const { data: report } = useGetEndOfNightReport(
    selectedShiftId || activeShift?.id || "",
    // @ts-expect-error - Orval generated type requires queryKey even when passing partial options
    { query: { enabled: !!(selectedShiftId || activeShift?.id) } },
  );

  const startShift = useStartShiftMutation();
  const _closeShift = useCloseShiftMutation();

  const handleStartShift = () => {
    if (!activeStaff) return;
    const name = `Shift ${format(new Date(), "MMM d, p")}`;
    startShift.mutate({ data: { name, openedByUserId: activeStaff.id } });
  };

  const executeCloseShift = async () => {
    if (!activeShift) return;

    try {
      const res = await fetch(`/api/shifts/${activeShift.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualCashMxn: Number(actualCash) }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.openTabs) {
          setOpenTabsError(data);
        } else {
          throw new Error(data.error || "Failed to close shift");
        }
        return;
      }

      // Success - invalidate queries
      setShowCloseModal(false);
      window.location.reload();
    } catch (err: any) {
      // Error already handled above if it's an open tabs error
      if (!openTabsError) {
        console.error("Error closing shift:", err);
      }
    }
  };

  const generateAnalyticsReport = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Please select both dates",
      });
      return;
    }

    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${endDate}T23:59:59Z`,
      });
      const res = await fetch(`/api/analytics/sales?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const result = await res.json();
      setAnalyticsData(result);
      toast({
        title: getTranslation("success", language),
        description: "Report generated successfully",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: err.message || "Failed to generate report",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const generateForecastReport = async () => {
    setForecastLoading(true);
    try {
      const params = new URLSearchParams({
        days: forecastDays.toString(),
      });
      const res = await fetch(
        `/api/analytics/inventory/forecast?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch forecast");
      const result = await res.json();
      setForecastData(result);
      toast({
        title: getTranslation("success", language),
        description: "Forecast generated successfully",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: err.message || "Failed to generate forecast",
      });
    } finally {
      setForecastLoading(false);
    }
  };

  const generateAuditReport = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        days: auditDays.toString(),
      });
      // Fetch both history and variance summary
      const historyRes = await fetch(
        `/api/inventory-audits/history?${params.toString()}`,
      );
      const varianceRes = await fetch(
        `/api/inventory-audits/variance-summary?${params.toString()}`,
      );

      if (!historyRes.ok || !varianceRes.ok)
        throw new Error("Failed to fetch audit data");

      const history = await historyRes.json();
      const variance = await varianceRes.json();

      setAuditHistory(history);
      setVarianceSummary(variance);
      toast({
        title: getTranslation("success", language),
        description: "Audit report generated successfully",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: err.message || "Failed to generate audit report",
      });
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      {/* Header with Tabs */}
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-secondary/30 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">
              {getTranslation("reports", language)}
            </h1>
            <p className="text-muted-foreground mt-1">
              Operational Insights & Nightly Summaries
            </p>
          </div>

          <div className="flex gap-3">
            {activeShift ? (
              <Button
                variant="destructive"
                className="h-14 px-8 rounded-2xl gap-2 shadow-lg shadow-destructive/20"
                onClick={() => setShowCloseModal(true)}
              >
                <StopCircle size={20} />{" "}
                {getTranslation("close_shift", language)}
              </Button>
            ) : (
              <Button
                className="h-14 px-8 rounded-2xl gap-2 shadow-lg shadow-primary/20"
                onClick={handleStartShift}
              >
                <Play size={20} /> {getTranslation("start_shift", language)}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab("shifts")}
            className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "shifts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ReceiptText size={18} className="inline mr-2" />
            Shift Reports
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp size={18} className="inline mr-2" />
            {getTranslation("sales_analytics", language)}
          </button>
          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "forecast"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap size={18} className="inline mr-2" />
            {getTranslation("inventory_forecast", language)}
          </button>
          <button
            onClick={() => setActiveTab("audits")}
            className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "audits"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={18} className="inline mr-2" />
            {getTranslation("inventory_audits", language)}
          </button>
        </div>
      </div>

      {activeTab === "shifts" ? (
        /* Shifts Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: History */}
          <div className="lg:col-span-4 space-y-6">
            <section className="glass rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-lg font-medium text-primary flex items-center gap-2 mb-6">
                <History size={20} />{" "}
                {getTranslation("shift_history", language)}
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {shifts?.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      selectedShiftId === shift.id ||
                      (!selectedShiftId && activeShift?.id === shift.id)
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold">{shift.name}</div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                          shift.status === "active"
                            ? "bg-emerald-500 text-white animate-pulse"
                            : "bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </div>
                    <div className="text-[10px] mt-2 opacity-70">
                      {format(new Date(shift.startedAt), "MMM d, h:mm a")}
                    </div>
                  </button>
                ))}
                {loadingShifts && (
                  <div className="text-center py-10 text-muted-foreground">
                    Loading shifts...
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Report Details */}
          <div className="lg:col-span-8">
            {report ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                      <DollarSign size={20} />
                    </div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                      Total Sales
                    </p>
                    <p className="text-3xl font-display font-bold mt-1">
                      ${report.totalSalesMxn.toLocaleString()}{" "}
                      <span className="text-xs font-sans text-muted-foreground ml-1">
                        MXN
                      </span>
                    </p>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                      <ReceiptText size={20} />
                    </div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                      Tabs Closed
                    </p>
                    <p className="text-3xl font-display font-bold mt-1">
                      {report.totalTabsClosed}
                    </p>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                      <TrendingUp size={20} />
                    </div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                      Avg Tab
                    </p>
                    <p className="text-3xl font-display font-bold mt-1">
                      $
                      {(report.totalTabsClosed > 0
                        ? report.totalSalesMxn / report.totalTabsClosed
                        : 0
                      ).toFixed(0)}
                    </p>
                  </div>

                  {report.shift?.cashVarianceMxn !== null && report.shift?.cashVarianceMxn !== undefined && (
                    <div className="glass p-6 rounded-3xl border border-white/5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                        report.shift.cashVarianceMxn >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"
                      }`}>
                        <DollarSign size={20} />
                      </div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                        Cash Variance
                      </p>
                      <div className="mt-1">
                        <p className={`text-3xl font-display font-bold ${
                          report.shift.cashVarianceMxn >= 0 ? "text-emerald-400" : "text-destructive"
                        }`}>
                          {report.shift.cashVarianceMxn >= 0 ? "+" : ""}${report.shift.cashVarianceMxn.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">
                          Expected: ${report.shift.expectedCashMxn?.toLocaleString() ?? 0}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profit Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="glass rounded-3xl p-6 border border-white/5">
                    <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-6">
                      <TrendingUp size={20} /> Top Profit Drivers
                    </h3>
                    <div className="space-y-4">
                      {report.salesByDrink.slice(0, 5).map((drink, i) => (
                        <div
                          key={drink.drinkId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground/50 w-4">
                              #{i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">
                                {language === "en"
                                  ? drink.drinkName
                                  : drink.drinkNameEs || drink.drinkName}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase">
                                {drink.quantitySold} units sold
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">
                              +${drink.profitMxn.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Profit
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="glass rounded-3xl p-6 border border-white/5">
                    <h3 className="text-lg font-medium text-amber-400 flex items-center gap-2 mb-6">
                      <Wine size={20} /> Most Common Items
                    </h3>
                    <div className="space-y-4">
                      {report.topSellers.slice(0, 5).map((drink, i) => (
                        <div
                          key={drink.drinkId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground/50 w-4">
                              #{i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">
                                {language === "en"
                                  ? drink.drinkName
                                  : drink.drinkNameEs || drink.drinkName}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase">
                                ${drink.totalSalesMxn.toLocaleString()} Total
                                Sales
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-400">
                              {drink.quantitySold} qty
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Volume
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Inventory Summary */}
                <section className="glass rounded-3xl p-6 border border-white/5">
                  <h3 className="text-lg font-medium text-primary flex items-center gap-2 mb-6">
                    <Package size={20} /> Inventory Velocity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {report.inventoryUsed.map((item) => (
                      <div
                        key={item.ingredientId}
                        className="flex items-center justify-between pb-2 border-b border-white/5"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.ingredientName}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            Current: {item.currentStock} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            -{item.amountUsed.toFixed(0)} {item.unit}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            Usage
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Low Stock Alerts */}
                {report.lowStockAlerts && report.lowStockAlerts.length > 0 && (
                  <section className="bg-destructive/10 rounded-3xl p-6 border border-destructive/20">
                    <h3 className="text-lg font-medium text-destructive flex items-center gap-2 mb-4">
                      <AlertTriangle size={20} /> Low Stock Warnings
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {report.lowStockAlerts.map((item: any) => (
                        <div
                          key={item.ingredientId}
                          className="p-3 bg-destructive/5 rounded-2xl border border-destructive/10"
                        >
                          <p className="text-xs font-bold truncate">
                            {item.ingredientName}
                          </p>
                          <p className="text-lg font-display font-bold text-destructive">
                            {item.currentStock}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {item.unit} left
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Deleted Items */}
                {(report as any).deletedItems &&
                  (report as any).deletedItems.length > 0 && (
                    <section className="glass rounded-3xl p-6 border border-white/5">
                      <h3 className="text-lg font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <Trash2 size={20} /> Deleted Inventory Items
                      </h3>
                      <div className="space-y-2">
                        {(report as any).deletedItems.map((item: any) => (
                          <div
                            key={item.ingredientId}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                          >
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                {item.ingredientName}
                              </p>
                            </div>
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full">
                              Deleted
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center glass rounded-3xl border border-white/5">
                <BarChart3
                  size={48}
                  className="text-muted-foreground mb-4 opacity-20"
                />
                <p className="text-muted-foreground font-medium">
                  Select a shift from the history to view its performance
                  report.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Analytics Tab */
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
              <Clock size={18} /> {getTranslation("date_range", language)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {getTranslation("from_date", language)}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {getTranslation("to_date", language)}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={generateAnalyticsReport}
                  disabled={analyticsLoading}
                  className="w-full"
                >
                  {analyticsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    getTranslation("generate_report", language)
                  )}
                </Button>
              </div>
            </div>
          </div>

          {analyticsData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {getTranslation("revenue", language)}
                  </p>
                  <p className="text-3xl font-display font-bold text-primary">
                    {formatMoney(analyticsData.summary.totalRevenue || 0)}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {getTranslation("tip", language)}
                  </p>
                  <p className="text-3xl font-display font-bold text-emerald-400">
                    {formatMoney(analyticsData.summary.totalTips || 0)}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {getTranslation("discount", language)}
                  </p>
                  <p className="text-3xl font-display font-bold text-yellow-400">
                    {formatMoney(analyticsData.summary.totalDiscount || 0)}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {getTranslation("total_tabs", language)}
                  </p>
                  <p className="text-3xl font-display font-bold text-blue-400">
                    {analyticsData.summary.tabsCount}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Avg Ticket
                  </p>
                  <p className="text-3xl font-display font-bold text-purple-400">
                    {formatMoney(
                      (analyticsData.summary.totalRevenue || 0) /
                        (analyticsData.summary.tabsCount || 1),
                    )}
                  </p>
                </div>
              </div>

              {/* Sales by Drink */}
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
                  <Wine size={18} />{" "}
                  {getTranslation("sales_by_drink", language)}
                </h3>
                {analyticsData.salesByDrink.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No sales data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-muted-foreground text-xs">
                          <th className="p-3 font-medium">
                            {getTranslation("name", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("units_sold", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("avg_price", language)}
                          </th>
                          <th className="p-3 font-medium text-right">
                            {getTranslation("revenue", language)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {analyticsData.salesByDrink.map(
                          (drink: any, idx: number) => (
                            <tr
                              key={idx}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="p-3 font-medium">
                                {language === "es" && drink.drinkNameEs
                                  ? drink.drinkNameEs
                                  : drink.drinkName}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {drink.unitsPriced}
                              </td>
                              <td className="p-3 text-emerald-400">
                                {formatMoney(drink.averagePrice)}
                              </td>
                              <td className="p-3 text-right font-bold text-primary">
                                {formatMoney(drink.totalRevenue)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sales by Staff */}
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
                  <Users size={18} />{" "}
                  {getTranslation("sales_by_staff", language)}
                </h3>
                {analyticsData.salesByStaff.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No staff data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-muted-foreground text-xs">
                          <th className="p-3 font-medium">
                            {getTranslation("name", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("total_tabs", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("avg_ticket", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("tips_earned", language)}
                          </th>
                          <th className="p-3 font-medium text-right">
                            {getTranslation("revenue", language)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {analyticsData.salesByStaff.map(
                          (staff: any, idx: number) => (
                            <tr
                              key={idx}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="p-3 font-medium">
                                {staff.userName}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {staff.tabsCount}
                              </td>
                              <td className="p-3 text-blue-400">
                                {formatMoney(staff.avgTicket)}
                              </td>
                              <td className="p-3 text-emerald-400">
                                {formatMoney(staff.tipsTotal)}
                              </td>
                              <td className="p-3 text-right font-bold text-primary">
                                {formatMoney(staff.totalRevenue)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Hourly Breakdown */}
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
                  <TrendingUp size={18} />{" "}
                  {getTranslation("hourly_breakdown", language)}
                </h3>
                {analyticsData.hourlySales.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No hourly data available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analyticsData.hourlySales.map((hour: any, idx: number) => {
                      const maxRevenue = Math.max(
                        ...analyticsData.hourlySales.map(
                          (h: any) => h.totalRevenue,
                        ),
                      );
                      const percentage =
                        maxRevenue > 0
                          ? (hour.totalRevenue / maxRevenue) * 100
                          : 0;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">
                              {String(hour.hour).padStart(2, "0")}:00
                            </span>
                            <div className="text-muted-foreground">
                              <span>{hour.tabsCount} tabs • </span>
                              <span className="text-primary font-bold">
                                {formatMoney(hour.totalRevenue)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center glass rounded-3xl border border-white/5">
              <TrendingUp
                size={48}
                className="text-muted-foreground mb-4 opacity-20"
              />
              <p className="text-muted-foreground font-medium">
                Select a date range and generate a report to view sales
                analytics.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === "forecast" && (
        <div className="space-y-8">
          {/* Controls */}
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              {getTranslation("forecast_period", language)}
            </h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground block mb-2">
                  {getTranslation("analysis_period", language)}
                </label>
                <select
                  value={forecastDays}
                  onChange={(e) => setForecastDays(parseInt(e.target.value))}
                  className="w-full bg-secondary/50 border border-white/10 rounded-xl p-3 text-foreground"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </div>
              <Button
                onClick={generateForecastReport}
                disabled={forecastLoading}
                className="px-8 h-11 rounded-xl"
              >
                {forecastLoading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  getTranslation("generate_report", language)
                )}
              </Button>
            </div>
          </div>

          {forecastData ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    {getTranslation("critical_items", language)}
                  </p>
                  <p className="text-4xl font-display font-bold text-red-500">
                    {forecastData.summary.critical}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    {getTranslation("low_items", language)}
                  </p>
                  <p className="text-4xl font-display font-bold text-yellow-500">
                    {forecastData.summary.low}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    {getTranslation("ok_items", language)}
                  </p>
                  <p className="text-4xl font-display font-bold text-emerald-500">
                    {forecastData.summary.ok}
                  </p>
                </div>
              </div>

              {/* Forecast Table */}
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                  <Package size={20} />{" "}
                  {getTranslation("inventory_forecast", language)}
                </h3>
                {forecastData.forecasts.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No inventory data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-muted-foreground text-xs">
                          <th className="p-3 font-medium">
                            {getTranslation("name", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("stock_status", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("current_stock", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("usage_rate", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("days_remaining", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("suggested_reorder", language)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {forecastData.forecasts.map(
                          (item: any, idx: number) => {
                            const statusColor =
                              item.alertLevel === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : item.alertLevel === "low"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-emerald-500/20 text-emerald-400";
                            const statusLabel =
                              item.alertLevel === "critical"
                                ? getTranslation("alert_critical", language)
                                : item.alertLevel === "low"
                                  ? getTranslation("alert_low", language)
                                  : getTranslation("alert_ok", language);
                            return (
                              <tr
                                key={idx}
                                className="hover:bg-white/5 transition-colors"
                              >
                                <td className="p-3 font-medium">
                                  {language === "es" && item.itemNameEs
                                    ? item.itemNameEs
                                    : item.itemName}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${statusColor}`}
                                  >
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {item.currentStock.toFixed(1)} {item.baseUnit}
                                </td>
                                <td className="p-3 text-blue-400">
                                  {item.dailyVelocity.toFixed(2)}{" "}
                                  {item.baseUnit}/day
                                </td>
                                <td className="p-3 font-bold">
                                  {item.daysUntilStockout === -1 ? (
                                    <span className="text-muted-foreground">
                                      No usage
                                    </span>
                                  ) : (
                                    <span
                                      className={
                                        item.daysUntilStockout <= 2
                                          ? "text-red-400"
                                          : item.daysUntilStockout <= 5
                                            ? "text-yellow-400"
                                            : "text-emerald-400"
                                      }
                                    >
                                      {item.daysUntilStockout.toFixed(1)} days
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-primary font-bold">
                                  {item.suggestedReorderPoint.toFixed(1)}{" "}
                                  {item.baseUnit}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center glass rounded-3xl border border-white/5">
              <Zap
                size={48}
                className="text-muted-foreground mb-4 opacity-20"
              />
              <p className="text-muted-foreground font-medium">
                Select an analysis period and generate a forecast to view
                inventory predictions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audits Tab */}
      {activeTab === "audits" && (
        <div className="space-y-8">
          {/* Controls */}
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package size={20} className="text-purple-400" />
              {getTranslation("variance_analysis", language)}
            </h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground block mb-2">
                  {getTranslation("analysis_period", language)}
                </label>
                <select
                  value={auditDays}
                  onChange={(e) => setAuditDays(parseInt(e.target.value))}
                  className="w-full bg-secondary/50 border border-white/10 rounded-xl p-3 text-foreground"
                >
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 180 days</option>
                </select>
              </div>
              <Button
                onClick={generateAuditReport}
                disabled={auditLoading}
                className="px-8 h-11 rounded-xl"
              >
                {auditLoading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  getTranslation("generate_report", language)
                )}
              </Button>
            </div>
          </div>

          {varianceSummary ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {getTranslation("total_tabs", language)}{" "}
                    {getTranslation("audits", language)}
                  </p>
                  <p className="text-4xl font-display font-bold text-blue-400">
                    {varianceSummary.summary.totalAudits}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Items Audited
                  </p>
                  <p className="text-4xl font-display font-bold text-purple-400">
                    {varianceSummary.summary.itemsAudited}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    With Variance
                  </p>
                  <p className="text-4xl font-display font-bold text-yellow-400">
                    {varianceSummary.summary.itemsWithVariance}
                  </p>
                </div>
                <div className="glass rounded-3xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Recommendations
                  </p>
                  <p className="text-4xl font-display font-bold text-orange-400">
                    {varianceSummary.recommendations.length}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {varianceSummary.recommendations.length > 0 && (
                <div className="glass rounded-3xl p-6 space-y-4">
                  <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                    <AlertTriangle size={20} />{" "}
                    {getTranslation("recommendations", language)}
                  </h3>
                  <div className="space-y-3">
                    {varianceSummary.recommendations.map(
                      (rec: any, idx: number) => {
                        const severityColor =
                          rec.severity === "critical"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : rec.severity === "high"
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                              : rec.severity === "medium"
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-400";
                        return (
                          <div
                            key={idx}
                            className={`p-4 border rounded-2xl ${severityColor}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold">{rec.itemName}</p>
                                <p className="text-xs opacity-75 capitalize">
                                  {rec.issue}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                                  rec.severity === "critical"
                                    ? "bg-red-500/30"
                                    : rec.severity === "high"
                                      ? "bg-orange-500/30"
                                      : rec.severity === "medium"
                                        ? "bg-yellow-500/30"
                                        : "bg-blue-500/30"
                                }`}
                              >
                                {rec.severity}
                              </span>
                            </div>
                            <p className="text-sm">{rec.recommendation}</p>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Variance by Item */}
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                  <BarChart3 size={20} /> Item Variance Summary
                </h3>
                {varianceSummary.itemVariances.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No audit data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-muted-foreground text-xs">
                          <th className="p-3 font-medium">
                            {getTranslation("name", language)}
                          </th>
                          <th className="p-3 font-medium">Audits</th>
                          <th className="p-3 font-medium">Avg Variance %</th>
                          <th className="p-3 font-medium">Total Variance</th>
                          <th className="p-3 font-medium">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {varianceSummary.itemVariances.map(
                          (item: any, idx: number) => {
                            const isUnderage = item.avgVariancePercent < 0;
                            const isOverage = item.avgVariancePercent > 0;
                            const varianceColor = isUnderage
                              ? "text-red-400"
                              : isOverage
                                ? "text-yellow-400"
                                : "text-muted-foreground";
                            return (
                              <tr
                                key={idx}
                                className="hover:bg-white/5 transition-colors"
                              >
                                <td className="p-3 font-medium">
                                  {language === "es" && item.itemNameEs
                                    ? item.itemNameEs
                                    : item.itemName}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {item.auditCount}
                                </td>
                                <td
                                  className={`p-3 font-bold ${varianceColor}`}
                                >
                                  {item.avgVariancePercent.toFixed(1)}%
                                </td>
                                <td className="p-3 text-blue-400">
                                  {item.totalVariance.toFixed(1)}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                                      item.lastVariancePercent < -5
                                        ? "bg-red-500/20 text-red-400"
                                        : item.lastVariancePercent > 5
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : "bg-emerald-500/20 text-emerald-400"
                                    }`}
                                  >
                                    {item.lastVariancePercent.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Audit History */}
              {auditHistory && auditHistory.audits.length > 0 && (
                <div className="glass rounded-3xl p-6 space-y-4">
                  <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                    <History size={20} />{" "}
                    {getTranslation("audit_history", language)}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-muted-foreground text-xs">
                          <th className="p-3 font-medium">
                            {getTranslation("name", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("system_stock", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("physical_count", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("audit_variance", language)}
                          </th>
                          <th className="p-3 font-medium">
                            {getTranslation("audited_at", language)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auditHistory.audits
                          .slice(0, 20)
                          .map((audit: any, idx: number) => (
                            <tr
                              key={idx}
                              className="hover:bg-white/5 transition-colors text-xs"
                            >
                              <td className="p-3 font-medium">
                                {language === "es" && audit.itemNameEs
                                  ? audit.itemNameEs
                                  : audit.itemName}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {audit.systemStock.toFixed(1)} {audit.baseUnit}
                              </td>
                              <td className="p-3 text-blue-400">
                                {audit.physicalCount.toFixed(1)}{" "}
                                {audit.baseUnit}
                              </td>
                              <td
                                className={`p-3 font-bold ${
                                  audit.variance < 0
                                    ? "text-red-400"
                                    : audit.variance > 0
                                      ? "text-yellow-400"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {audit.variance.toFixed(1)} (
                                {audit.variancePercent.toFixed(1)}%)
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {format(
                                  new Date(audit.auditedAt),
                                  "MMM d, h:mm a",
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
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center glass rounded-3xl border border-white/5">
              <Package
                size={48}
                className="text-muted-foreground mb-4 opacity-20"
              />
              <p className="text-muted-foreground font-medium">
                Select an analysis period and generate a report to view
                inventory audit data.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Open Tabs Error Modal */}
      {openTabsError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setOpenTabsError(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={24} className="text-amber-500" />
              <h2 className="text-2xl font-display font-bold text-amber-500">
                Cannot Close Shift
              </h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Shift cannot be closed with open tabs. Please close the following
              tabs first:
            </p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {openTabsError.openTabs?.map((tab: any) => (
                <div
                  key={tab.id}
                  className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {tab.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tab.totalMxn} MXN
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpenTabsError(null)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setOpenTabsError(null);
                  // Navigate to dashboard to close tabs
                  window.location.href = "/";
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
          <div className="glass p-8 rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-3xl font-display font-bold mb-4 flex items-center gap-3">
              <StopCircle className="text-destructive" />
              {getTranslation("close_shift", language)}
            </h2>
            <p className="text-muted-foreground mb-6">
              Enter the exact amount of cash physically in the drawer to calculate variance.
            </p>
            
            <div className="mb-8">
              <label className="text-sm font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                Actual Drawer Cash
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-2xl pl-8 pr-4 py-4 text-2xl font-display font-bold text-foreground focus:ring-primary focus:border-primary transition-all"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={executeCloseShift}
                className="w-full h-14 bg-destructive text-destructive-foreground rounded-2xl font-bold text-lg hover:brightness-110 transition-all active:scale-95"
              >
                Confirm Close
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="w-full h-14 bg-transparent text-muted-foreground rounded-2xl font-medium text-lg hover:text-foreground transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
