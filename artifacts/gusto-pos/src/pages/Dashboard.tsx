import React, { useMemo, useState, useEffect } from "react";
import {
  useGetActiveShift,
  useGetTabs,
  useGetIngredients,
  useGetRushes,
} from "@workspace/api-client-react";
import {
  useStartShiftMutation,
  useCloseShiftMutation,
} from "@/hooks/use-pos-mutations";
import { usePosStore } from "@/store";
import { getTranslation, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Receipt,
  AlertTriangle,
  Package,
  TrendingUp,
  Users,
  Anchor,
  Calendar,
  Zap,
  Music,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Beer,
  Martini,
} from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale/es";
import { Link } from "wouter";
import { CashboxVerificationModal } from "@/components/CashboxVerificationModal";
import { StaffClockInWidget } from "@/components/StaffClockInWidget";

const IMPACT_COLORS = {
  high: "bg-primary/20 text-primary",
  medium: "bg-blue-500/20 text-blue-400",
  low: "bg-secondary text-muted-foreground",
};

const TYPE_ICONS = {
  cruise: Anchor,
  festival: Users,
  music: Music,
  other: MapPin,
};

export default function Dashboard() {
  const { language, activeStaff } = usePosStore();
  const { data: activeShift } = useGetActiveShift();
  const { data: tabs } = useGetTabs({ status: "open" });
  const { data: ingredients } = useGetIngredients();
  const { data: rushes, refetch: refetchRushes } = useGetRushes();

  useEffect(() => {
    const interval = setInterval(() => {
      refetchRushes();
    }, 60000);

    const handleFocus = () => refetchRushes();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetchRushes]);

  const startShift = useStartShiftMutation();
  const closeShift = useCloseShiftMutation();
  const [closeError, setCloseError] = useState<string | null>(null);
  const [showCloseSummary, setShowCloseSummary] = useState(false);
  const [forceClose, setForceClose] = useState(false);
  const [showCashboxModal, setShowCashboxModal] = useState(false);

  const lowStock =
    ingredients?.filter((i) => i.currentStock <= i.lowStockThreshold) || [];
  const openTabsCount = tabs?.length || 0;
  const totalSales =
    tabs?.reduce((sum, tab) => sum + Number(tab.totalMxn), 0) || 0;

  const activeShiftData = activeShift?.shift;
  const [rushFilter, setRushFilter] = useState<
    "today" | "tomorrow" | "week" | "all"
  >("week");
  const [tabsCollapsed, setTabsCollapsed] = useState(true);
  const [rushesCollapsed, setRushesCollapsed] = useState(true);

  const upcomingRushes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    const weekStart = todayStart + 7 * 24 * 60 * 60 * 1000;

    const filtered =
      rushes?.filter((r) => {
        const startTime = new Date(r.startTime).getTime();

        switch (rushFilter) {
          case "today":
            return startTime >= todayStart && startTime < tomorrowStart;
          case "tomorrow":
            return (
              startTime >= tomorrowStart &&
              startTime < tomorrowStart + 24 * 60 * 60 * 1000
            );
          case "week":
            return startTime >= todayStart && startTime < weekStart;
          case "all":
            return startTime >= todayStart;
          default:
            return startTime >= todayStart && startTime < weekStart;
        }
      }) || [];

    return filtered;
  }, [rushes, rushFilter]);

  const sortedTabs = useMemo(() => {
    if (!tabs) return [];
    return [...tabs].sort(
      (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
    );
  }, [tabs]);

  const displayedTabs = tabsCollapsed ? sortedTabs.slice(0, 5) : sortedTabs;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold">
            {getTranslation("dashboard", language)}
          </h1>
          <p className="text-muted-foreground">
            {activeStaff
              ? `${getTranslation("welcome_back", language)}, ${activeStaff.firstName}`
              : getTranslation("please_switch_staff", language)}
          </p>
        </div>

        {activeShiftData ? (
          <Button
            variant="destructive"
            size="lg"
            className="rounded-2xl h-14 px-8 shadow-lg shadow-destructive/20"
            onClick={() => setShowCloseSummary(true)}
            disabled={closeShift.isPending}
          >
            <Square className="mr-2" size={20} />
            {getTranslation("close_shift", language)}
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              className="rounded-2xl h-14 px-8 shadow-lg shadow-primary/20"
              onClick={() => setShowCashboxModal(true)}
              disabled={!activeStaff}
            >
              <Play className="mr-2" size={20} />
              {getTranslation("start_shift", language)}
            </Button>
            <CashboxVerificationModal
              isOpen={showCashboxModal}
              onClose={() => setShowCashboxModal(false)}
              onConfirm={(expectedCashMxn) => {
                setShowCashboxModal(false);
                startShift.mutate({
                  data: {
                    name: `Shift ${format(new Date(), "MMM d, h:mm a", { locale: language === "es" ? esLocale : undefined })}`,
                    openedByUserId: activeStaff?.id || "",
                    expectedCashMxn,
                  },
                });
              }}
              isLoading={startShift.isPending}
            />
          </>
        )}
      </div>

      {/* Active Employees Row - 2 columns wide */}
      {activeShiftData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <StaffClockInWidget shiftId={activeShiftData.id} />
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {getTranslation("open_tabs", language)}
            </p>
            <p className="text-xl font-bold">{openTabsCount}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {getTranslation("running_sales", language)}
            </p>
            <p className="text-xl font-bold">{formatMoney(totalSales)}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {getTranslation("low_stock_alerts", language)}
            </p>
            <p className="text-xl font-bold">{lowStock.length}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Eventos" : "Events"}
            </p>
            <p className="text-xl font-bold">{upcomingRushes.length}</p>
          </div>
        </div>
      </div>

      {/* Three-column layout: Open Tabs, Rushes, Specials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Tabs - Collapsible */}
        <div className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <Receipt size={18} className="text-primary" />
              {getTranslation("open_tabs", language)}
            </h3>
            <button
              onClick={() => setTabsCollapsed(!tabsCollapsed)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={tabsCollapsed ? "Expand" : "Collapse"}
            >
              {tabsCollapsed ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {displayedTabs.length > 0 ? (
              displayedTabs.map((tab) => (
                <Link key={tab.id} href={`/tab/${tab.id}`}>
                  <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">
                          {tab.nickname || `Tab #${tab.id.slice(0, 6)}`}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(tab.openedAt), "h:mm a")}
                        </p>
                      </div>
                      <span className="text-primary font-bold">
                        {formatMoney(Number(tab.totalMxn))}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {language === "es" ? "Sin pestañas abiertas" : "No open tabs"}
                </p>
              </div>
            )}
          </div>
          {sortedTabs.length > 5 && (
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => setTabsCollapsed(!tabsCollapsed)}
                className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors py-1"
              >
                {tabsCollapsed
                  ? `${language === "es" ? `Ver más (${sortedTabs.length - 5})` : `Show more (${sortedTabs.length - 5})`}`
                  : language === "es"
                    ? "Ver menos"
                    : "Show less"}
              </button>
            </div>
          )}
        </div>

        {/* Rushes - Collapsible */}
        <div className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              {getTranslation("pv_rushes", language)}
            </h3>
            <button
              onClick={() => setRushesCollapsed(!rushesCollapsed)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={rushesCollapsed ? "Expand" : "Collapse"}
            >
              {rushesCollapsed ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="px-4 pt-2 flex gap-1 flex-wrap">
            {(["today", "tomorrow", "week"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setRushFilter(filter)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  rushFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-white/10 hover:bg-white/5"
                }`}
              >
                {filter === "today"
                  ? language === "es"
                    ? "Hoy"
                    : "Today"
                  : filter === "tomorrow"
                    ? language === "es"
                      ? "Mañana"
                      : "Tomorrow"
                    : language === "es"
                      ? "Semana"
                      : "Week"}
              </button>
            ))}
          </div>

          <div className="divide-y divide-white/5">
            {(rushesCollapsed
              ? upcomingRushes.slice(0, 3)
              : upcomingRushes
            ).map((rush) => {
              const Icon =
                TYPE_ICONS[rush.type as keyof typeof TYPE_ICONS] || MapPin;
              return (
                <div
                  key={rush.id}
                  className="p-4 hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${IMPACT_COLORS[rush.impact as keyof typeof IMPACT_COLORS] || IMPACT_COLORS.low}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{rush.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rush.startTime), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${rush.impact === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    {rush.impact}
                  </span>
                </div>
              );
            })}

            {upcomingRushes.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Calendar size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">
                  {rushFilter === "today"
                    ? language === "es"
                      ? "Sin eventos hoy"
                      : "No events today"
                    : language === "es"
                      ? "Sin eventos"
                      : "No upcoming events"}
                </p>
              </div>
            )}
          </div>

          {upcomingRushes.length > 3 && (
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => setRushesCollapsed(!rushesCollapsed)}
                className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors py-1"
              >
                {rushesCollapsed
                  ? `${language === "es" ? `Ver más (${upcomingRushes.length - 3})` : `Show more (${upcomingRushes.length - 3})`}`
                  : language === "es"
                    ? "Ver menos"
                    : "Show less"}
              </button>
            </div>
          )}
        </div>

        {/* Specials - Collapsible */}
        <div className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <Martini size={18} className="text-primary" />
              {language === "es" ? "Especiales" : "Specials"}
            </h3>
            <Link href="/specials">
              <Button variant="ghost" size="sm">
                {language === "es" ? "Ver todo" : "View all"}
              </Button>
            </Link>
          </div>
          <div className="p-6 text-center text-muted-foreground">
            <Martini size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">
              {language === "es"
                ? "Ver specials para ofertas activas"
                : "Check specials page for active deals"}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts - 2 columns wide below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <Package size={18} className="text-amber-400" />
              {getTranslation("low_stock", language)}
            </h3>
            <Link href="/inventory">
              <Button variant="ghost" size="sm">
                {getTranslation("manage_inventory", language)} →
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {lowStock.length > 0 ? (
              lowStock.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.type === "spirit" || item.type === "mixer" ? (
                      <Martini size={16} className="text-muted-foreground" />
                    ) : item.type === "beer" ? (
                      <Beer size={16} className="text-muted-foreground" />
                    ) : (
                      <Package size={16} className="text-muted-foreground" />
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-amber-400 font-bold">
                    {item.currentStock} {item.baseUnit}{" "}
                    {getTranslation("left", language)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p>{getTranslation("all_good", language)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Close Shift Summary Modal */}
      {showCloseSummary && activeShiftData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => {
                setShowCloseSummary(false);
                setForceClose(false);
              }}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold text-destructive mb-6">
              {getTranslation("close_shift_summary", language)}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-muted-foreground">
                  {getTranslation("shift_name", language)}
                </span>
                <span className="font-bold">{activeShiftData.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Receipt size={16} />{" "}
                  {getTranslation("open_tabs_label", language)}
                </span>
                <span
                  className={`font-bold ${openTabsCount > 0 ? "text-destructive" : "text-emerald-400"}`}
                >
                  {openTabsCount}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-muted-foreground flex items-center gap-2">
                  <TrendingUp size={16} />{" "}
                  {getTranslation("total_sales_open_tabs", language)}
                </span>
                <span className="font-bold text-primary">
                  {formatMoney(totalSales)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-muted-foreground flex items-center gap-2">
                  <AlertTriangle size={16} />{" "}
                  {getTranslation("low_stock_items", language)}
                </span>
                <span className="font-bold text-amber-400">
                  {lowStock.length}
                </span>
              </div>
            </div>

            {openTabsCount > 0 && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                <p className="text-sm text-destructive font-medium">
                  {getTranslation("open_tabs_warning", language)
                    .replace("{count}", String(openTabsCount))
                    .replace("{plural}", openTabsCount > 1 ? "s" : "")}
                </p>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceClose}
                    onChange={(e) => setForceClose(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30"
                  />
                  <span className="text-xs font-medium text-destructive/80">
                    {getTranslation("force_close", language)}
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCloseSummary(false);
                  setForceClose(false);
                }}
              >
                {getTranslation("cancel", language)}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setCloseError(null);
                  closeShift.mutate(
                    { id: activeShiftData.id },
                    {
                      onError: (error: any) => {
                        if (
                          error?.response?.data?.error?.includes("open tabs")
                        ) {
                          setCloseError(
                            "Cannot close shift: open tabs remain. Please close all tabs first.",
                          );
                        } else {
                          setCloseError(
                            error?.message || "Failed to close shift.",
                          );
                        }
                      },
                    },
                  );
                  setShowCloseSummary(false);
                  setForceClose(false);
                }}
                disabled={closeShift.isPending}
              >
                {closeShift.isPending
                  ? getTranslation("closing", language)
                  : getTranslation("confirm_close", language)}
              </Button>
              {closeError && (
                <div className="col-span-2 mt-2 text-destructive text-sm text-center">
                  {closeError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
