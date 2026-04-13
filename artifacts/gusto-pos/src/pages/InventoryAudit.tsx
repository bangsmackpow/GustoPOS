import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import type { InventoryItem } from "@/types/inventory";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InventoryAuditModal } from "@/components/InventoryAuditModal";

interface InventoryAudit {
  id: string;
  itemId: string;
  itemName: string;
  auditEntryMethod: string;
  reportedBulk?: number;
  reportedPartial?: number;
  reportedTotal: number;
  previousTotal: number;
  expectedTotal: number;
  variance: number;
  variancePercent?: number;
  auditReason?: string;
  notes?: string;
  auditedByUserId: string;
  auditedAt: number;
}

export default function InventoryAudit() {
  const [, params] = useRoute("/inventory/:id/audit");
  const itemId = params?.id;
  const { language } = usePosStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: item,
    isLoading: itemLoading,
    error: itemError,
  } = useQuery<InventoryItem>({
    queryKey: [`/api/inventory/items/${itemId}`],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/items/${itemId}`);
      if (!response.ok) throw new Error("Failed to fetch item");
      return response.json();
    },
    enabled: !!itemId,
  });

  const { data: auditHistory, isLoading: historyLoading } = useQuery<
    InventoryAudit[]
  >({
    queryKey: [`/api/inventory-audits/history?itemId=${itemId}`],
    queryFn: async () => {
      const response = await fetch(
        `/api/inventory-audits/history?itemId=${itemId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch audit history");
      const data = await response.json();
      return data.audits || [];
    },
    enabled: !!itemId,
  });

  if (itemLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">Failed to load item</p>
          <Link href="/inventory">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStock =
    item.currentBulk * (item.baseUnitAmount || 750) +
    (item.currentPartial || 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getTranslation("back", language) || "Back"}
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          {getTranslation("record_audit", language) || "Record Audit"}:{" "}
          {item.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {getTranslation("current_stock", language) || "Current Stock"}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bulk:</span>
              <span className="font-mono">
                {item.currentBulk} {item.baseUnit || "ml"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Partial:</span>
              <span className="font-mono">
                {item.currentPartial?.toFixed(1)} {item.partialUnit}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-white/10">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-mono font-bold">
                {currentStock.toFixed(1)} {item.partialUnit}
              </span>
            </div>
            {item.lastAuditedAt && (
              <div className="text-xs text-muted-foreground pt-2">
                {getTranslation("last_audited", language) || "Last audited"}:{" "}
                {new Date(
                  Number(item.lastAuditedAt) * 1000,
                ).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {getTranslation("item_details", language) || "Item Details"}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{item.type}</span>
            </div>
            {item.subtype && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtype:</span>
                <span>{item.subtype}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>
                {item.baseUnitAmount || 750} {item.baseUnit || "ml"}
              </span>
            </div>
            {item.bulkCost && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span>${item.bulkCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Button onClick={() => setIsModalOpen(true)}>
          <ClipboardList className="mr-2 h-4 w-4" />
          {getTranslation("record_audit", language) || "Record Audit"}
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          {getTranslation("audit_history", language) || "Audit History"}
        </h2>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : auditHistory && auditHistory.length > 0 ? (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-sm">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Previous</th>
                    <th className="text-right p-3 font-medium">Current</th>
                    <th className="text-right p-3 font-medium">Variance</th>
                    <th className="text-left p-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditHistory.slice(0, 10).map((audit) => (
                    <tr
                      key={audit.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 text-sm">
                        {new Date(audit.auditedAt * 1000).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm text-right font-mono">
                        {audit.previousTotal?.toFixed(1)}
                      </td>
                      <td className="p-3 text-sm text-right font-mono">
                        {audit.reportedTotal?.toFixed(1)}
                      </td>
                      <td
                        className={`p-3 text-sm text-right font-mono ${
                          audit.variance > 0
                            ? "text-emerald-400"
                            : audit.variance < 0
                              ? "text-red-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {audit.variance > 0 ? "+" : ""}
                        {audit.variance?.toFixed(1)}
                        <span className="text-xs ml-1 opacity-70">
                          ({audit.variancePercent?.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {audit.auditReason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditHistory.length > 10 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t border-white/5">
                +{auditHistory.length - 10} more audits
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground rounded-2xl bg-white/5 border border-white/10">
            No audit history for this item
          </div>
        )}
      </div>

      {item && isModalOpen && (
        <InventoryAuditModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
