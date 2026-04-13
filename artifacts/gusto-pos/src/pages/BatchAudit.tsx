import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface SessionItem {
  id: string;
  name: string;
  nameEs: string;
  type: string;
  subtype: string;
  currentBulk: number;
  currentPartial: number;
  currentStock: number;
  baseUnitAmount: number;
  containerWeightG: number;
  fullBottleWeightG: number;
  density: number;
  trackingMode: string;
}

interface AuditSession {
  id: string;
  status: string;
  typeFilter: string;
  itemCount: number;
  completedCount: number;
  startedAt: number;
}

const TYPE_LABELS: Record<string, string> = {
  spirit: "Spirits",
  beer: "Beer",
  mixer: "Mixers",
  ingredient: "Ingredients",
  merch: "Merch",
  misc: "Misc",
};

export default function BatchAudit() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: auth } = useGetCurrentAuthUser();

  const [session, setSession] = useState<AuditSession | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [auditData, setAuditData] = useState<
    Record<string, { bulk: number; partial: number }>
  >({});

  const [, params] = useRoute("/settings/batch-audit/:id");
  const sessionId = params?.id;

  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionData = async () => {
      setLoading(true);
      try {
        const [sessionRes, itemsRes] = await Promise.all([
          fetch(`/api/inventory/audit-sessions/${sessionId}`),
          fetch(`/api/inventory/audit-sessions/${sessionId}/items`),
        ]);

        if (!sessionRes.ok || !itemsRes.ok) {
          throw new Error("Failed to load audit session");
        }

        const sessionData = await sessionRes.json();
        const itemsData = await itemsRes.json();

        setSession(sessionData);
        setItems(itemsData);

        const initialData: Record<string, { bulk: number; partial: number }> =
          {};
        itemsData.forEach((item: SessionItem) => {
          initialData[item.id] = {
            bulk: item.currentBulk || 0,
            partial: item.currentPartial || 0,
          };
        });
        setAuditData(initialData);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to load audit session",
        });
        setLocation("/settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, setLocation, toast]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameEs &&
          item.nameEs.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [items, search]);

  const sortedItems = useMemo(() => {
    const itemsCopy = [...filteredItems];
    if (!sortConfig) return itemsCopy;
    return itemsCopy.sort((a: any, b: any) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const updateAuditData = (
    itemId: string,
    field: "bulk" | "partial",
    value: number,
  ) => {
    setAuditData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const getVariance = (item: SessionItem) => {
    const data = auditData[item.id] || { bulk: 0, partial: 0 };
    const baseUnitAmount = item.baseUnitAmount || 750;
    const expectedTotal =
      (item.currentBulk || 0) * baseUnitAmount + (item.currentPartial || 0);
    const reportedTotal = data.bulk * baseUnitAmount + data.partial;
    const variance = reportedTotal - expectedTotal;
    const variancePercent =
      expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;
    return { variance, variancePercent, expectedTotal, reportedTotal };
  };

  const getPartialDisplay = (item: SessionItem, current: boolean = false) => {
    const data = auditData[item.id] || { bulk: 0, partial: 0 };
    const partial = current ? item.currentPartial || 0 : data.partial;
    const containerWeight = item.containerWeightG || 0;
    const fullWeight = item.fullBottleWeightG || 0;
    const density = item.density || 0.94;

    const isPool =
      item.trackingMode === "pool" ||
      (item.trackingMode === "auto" &&
        (item.type === "spirit" || item.type === "mixer"));

    if (!isPool) {
      return partial > 0 ? `${partial} units` : "0 units";
    }

    const hasValidWeights = containerWeight > 0 && fullWeight > 0;

    if (hasValidWeights && partial > 0) {
      const liquidWeight = partial - containerWeight;
      return liquidWeight > 0 ? `${liquidWeight.toFixed(0)}g` : "0g";
    }

    if (partial > 0) {
      const estimatedMl = partial * density;
      return `~${estimatedMl.toFixed(0)}ml`;
    }

    return "0";
  };

  const getCurrentPartialDisplay = (item: SessionItem) => {
    return getPartialDisplay(item, true);
  };

  const handleSubmit = async () => {
    if (!sessionId || !auth?.user?.id) return;

    const itemsToSubmit = Object.entries(auditData).map(([itemId, data]) => ({
      itemId,
      reportedBulk: data.bulk,
      reportedPartial: data.partial,
    }));

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/inventory/audit-sessions/${sessionId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: itemsToSubmit,
            completedByUserId: auth.user.id,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit audit");
      }

      const result = await res.json();

      qc.invalidateQueries({ queryKey: ["/api/inventory/items"] });

      toast({
        title: "Audit Submitted",
        description: `${result.auditsCreated} item audits recorded successfully`,
      });

      setLocation("/settings");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to submit audit",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeFilterLabel = () => {
    if (!session?.typeFilter || session.typeFilter === "all")
      return "All Items";
    return TYPE_LABELS[session.typeFilter] || session.typeFilter;
  };

  const auditedCount = Object.keys(auditData).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading audit session...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Filter Sidebar */}
      <div
        className={`glass border-r border-white/5 flex flex-col transition-all duration-300 ${
          filterSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          {!filterSidebarCollapsed && (
            <span className="font-medium text-sm">Filters</span>
          )}
          <button
            onClick={() => setFilterSidebarCollapsed(!filterSidebarCollapsed)}
            className="p-1 hover:bg-white/5 rounded"
          >
            {filterSidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        {!filterSidebarCollapsed && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-1 block">
                Search
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-muted-foreground uppercase mb-2">
                Session Info
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{getTypeFilterLabel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{session?.itemCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">
                    {session?.status || "unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="glass border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/settings")}
            >
              <ChevronLeft size={18} className="mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                Batch Audit: {getTypeFilterLabel()}
              </h1>
              <p className="text-sm text-muted-foreground">
                {auditedCount} of {items.length} items entered
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/settings")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || auditedCount === 0}
            >
              {submitting ? "Submitting..." : "Submit Audit"}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full min-w-[900px]">
              <thead className="bg-white/5 sticky top-0">
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th
                    className="p-3 font-medium cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortConfig?.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        ))}
                    </div>
                  </th>
                  <th className="p-3 font-medium">Container</th>
                  <th className="p-3 font-medium">Current Sealed</th>
                  <th className="p-3 font-medium">Current Partial</th>
                  <th className="p-3 font-medium">Sealed</th>
                  <th className="p-3 font-medium">Partial</th>
                  <th className="p-3 font-medium">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedItems.map((item) => {
                  const { variance, variancePercent } = getVariance(item);
                  const isSignificant = Math.abs(variancePercent) > 5;
                  const baseUnitAmount = item.baseUnitAmount || 750;
                  const isPool =
                    item.trackingMode === "pool" ||
                    (item.trackingMode === "auto" &&
                      (item.type === "spirit" || item.type === "mixer"));

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium">{item.name}</div>
                        {item.nameEs && (
                          <div className="text-xs text-muted-foreground">
                            {item.nameEs}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {isPool
                          ? `${baseUnitAmount}ml`
                          : `${item.baseUnitAmount || 1} units`}
                      </td>
                      <td className="p-3 text-sm">{item.currentBulk || 0}</td>
                      <td className="p-3 text-sm">
                        {getCurrentPartialDisplay(item)}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={auditData[item.id]?.bulk ?? ""}
                          onChange={(e) =>
                            updateAuditData(
                              item.id,
                              "bulk",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-20 bg-secondary/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step={isPool ? "0.1" : "1"}
                          value={auditData[item.id]?.partial ?? ""}
                          onChange={(e) =>
                            updateAuditData(
                              item.id,
                              "partial",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24 bg-secondary/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 font-mono"
                          placeholder={isPool ? "ml or g" : "units"}
                        />
                      </td>
                      <td className="p-3">
                        {variance !== 0 ? (
                          <div
                            className={`flex items-center gap-1 text-sm font-mono ${
                              isSignificant
                                ? "text-yellow-400"
                                : variance > 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                            }`}
                          >
                            {isSignificant && <AlertTriangle size={14} />}
                            {variance > 0 ? "+" : ""}
                            {variance.toFixed(1)} ({variancePercent.toFixed(1)}
                            %)
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {sortedItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {search
                  ? "No items match your search"
                  : "No items in this audit"}
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="glass border-t border-white/5 p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {auditedCount} of {items.length} items entered
          </div>
          <div className="text-sm text-muted-foreground">
            Click &quot;Submit Audit&quot; when complete to save all counts and
            create audit records
          </div>
        </div>
      </div>
    </div>
  );
}
