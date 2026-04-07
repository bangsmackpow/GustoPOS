import React, { useMemo, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
  Banknote,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale/es";
import { Link } from "wouter";

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
  const { data: rushes } = useGetRushes();

  const startShift = useStartShiftMutation();
  const closeShift = useCloseShiftMutation();
  const [closeError, setCloseError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showCloseSummary, setShowCloseSummary] = useState(false);
  const [forceClose, setForceClose] = useState(false);

  const lowStock =
    ingredients?.filter((i) => i.currentStock <= i.lowStockThreshold) || [];
  const openTabsCount = tabs?.length || 0;
  const totalSales =
    tabs?.reduce((sum, tab) => sum + Number(tab.totalMxn), 0) || 0;

  const activeShiftData = activeShift?.shift;

  // Only show upcoming or ongoing rushes (next 24 hours)
  const upcomingRushes = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (
      rushes
        ?.filter((r) => {
          const startTime = new Date(r.startTime).getTime();
          return startTime > now - 1000 * 60 * 60 * 4; // Show started in last 4 hours or upcoming
        })
        .slice(0, 5) || []
    );
  }, [rushes]);

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
          <Button
            size="lg"
            className="rounded-2xl h-14 px-8 shadow-lg shadow-primary/20"
            onClick={() =>
              startShift.mutate({
                data: {
                  name: `Shift ${format(new Date(), "MMM d, h:mm a", { locale: language === "es" ? esLocale : undefined })}`,
                  openedByUserId: activeStaff?.id || "",
                },
              })
            }
            disabled={!activeStaff || startShift.isPending}
          >
            <Play className="mr-2" size={20} />
            {getTranslation("start_shift", language)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {getTranslation("open_tabs", language)}
            </p>
            <p className="text-2xl font-bold">{openTabsCount}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {getTranslation("running_sales", language)}
            </p>
            <p className="text-2xl font-bold">{formatMoney(totalSales)}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {getTranslation("low_stock_alerts", language)}
            </p>
            <p className="text-2xl font-bold">{lowStock.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Local Events Section (Dynamic Rushes) */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Zap size={20} className="text-primary" />{" "}
            {getTranslation("pv_rushes", language)}
          </h3>
          <div className="glass rounded-3xl overflow-hidden divide-y divide-white/5 border border-white/5 min-h-[300px]">
            {upcomingRushes.map((rush) => {
              const Icon =
                TYPE_ICONS[rush.type as keyof typeof TYPE_ICONS] || MapPin;
              return (
                <div
                  key={rush.id}
                  className="p-5 hover:bg-white/5 transition-colors flex items-center gap-4"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${IMPACT_COLORS[rush.impact as keyof typeof IMPACT_COLORS] || IMPACT_COLORS.low}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm">{rush.title}</h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${rush.impact === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        {rush.impact} {getTranslation("impact", language)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="opacity-60 uppercase font-bold tracking-tighter">
                        {rush.type}
                      </span>{" "}
                      • {format(new Date(rush.startTime), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            {upcomingRushes.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p>{getTranslation("no_events_24h", language)}</p>
                <Link href="/settings">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary mt-2"
                  >
                    {getTranslation("manage_rushes", language)} →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Package size={20} className="text-primary" />{" "}
            {getTranslation("low_stock", language)}
          </h3>
          <div className="glass rounded-3xl p-6 border border-white/5 min-h-[300px]">
            {lowStock.length > 0 ? (
              <div className="space-y-4">
                {lowStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5"
                  >
                    <span className="font-medium">
                      {language === "es" && item.nameEs
                        ? item.nameEs
                        : item.name}
                    </span>
                    <span className="text-primary font-bold">
                      {item.currentStock} {item.baseUnit}{" "}
                      {getTranslation("left", language)}
                    </span>
                  </div>
                ))}
                <Link href="/inventory">
                  <Button variant="link" className="w-full text-primary">
                    {getTranslation("manage_inventory", language)} →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                <Package size={48} className="mb-4 opacity-20" />
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
                    { id: activeShiftData.id, force: forceClose },
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
