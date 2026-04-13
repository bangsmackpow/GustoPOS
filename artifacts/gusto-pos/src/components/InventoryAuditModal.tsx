import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { X } from "lucide-react";
import { type InventoryItem } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

interface InventoryAuditModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryAuditModal({
  item,
  isOpen,
  onClose,
}: InventoryAuditModalProps) {
  const [entryMethod, setEntryMethod] = useState<"bulk_partial" | "loose_only">(
    "bulk_partial",
  );
  const [bulkCount, setBulkCount] = useState(item.currentBulk);
  const [partialCount, setPartialCount] = useState(item.currentPartial);
  const [varianceReason, setVarianceReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { data: authUser } = useGetCurrentAuthUser();
  const { toast } = useToast();

  // Determine if this is a pool or collection item
  const isPool =
    item.trackingMode === "pool" ||
    (item.trackingMode === "auto" &&
      (item.type === "spirit" || item.type === "mixer"));

  const getBulkLabel = () => {
    if (isPool) return "Full Bottles";
    return "Full Cases";
  };

  const getPartialLabel = () => {
    if (isPool) return "Partial (g)";
    return "Partial Units";
  };

  const getPartialUnit = () => {
    if (isPool) return "ml";
    return "units";
  };

  const getDisplayUnit = () => {
    if (isPool) return "ml";
    return "units";
  };

  const calculateTotal = () => {
    const unitSize = item.baseUnitAmount || 750;
    if (entryMethod === "bulk_partial") {
      return bulkCount * unitSize + partialCount;
    }
    return partialCount;
  };

  const unitSize = item.baseUnitAmount || 750;
  const expectedTotal = item.currentBulk * unitSize + item.currentPartial;
  const reportedTotal = calculateTotal();
  const variance = reportedTotal - expectedTotal;
  const variancePercent =
    expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;
  const isSignificantVariance = Math.abs(variancePercent) > 5;

  const density = item.density || 0.94;
  const containerWeight = item.containerWeightG || 0;
  const fullWeight = item.fullBottleWeightG || 0;
  const hasWeights = containerWeight > 0 && fullWeight > 0;

  // For pool items, currentPartial is stored in grams (from weighing)
  // Convert to ml using density for display
  const expectedPartialMl = hasWeights
    ? Math.round(item.currentPartial * density)
    : Math.round(item.currentPartial);

  const { mutate: saveAudit } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/inventory/items/${item.id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditEntryMethod: entryMethod,
          reportedBulk: entryMethod === "bulk_partial" ? bulkCount : undefined,
          reportedPartial: partialCount,
          reportedTotal,
          previousTotal: expectedTotal,
          expectedTotal,
          variance,
          variancePercent,
          varianceReason: varianceReason || "unspecified",
          notes,
          auditedByUserId: authUser?.user?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save audit");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      toast({
        title: "Audit Recorded",
        description: "Inventory audit saved successfully",
      });
      onClose();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass p-6 rounded-3xl w-full max-w-md relative border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">Audit: {item.name}</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-muted-foreground mb-1">Current State</p>
            <p className="font-medium">
              {item.currentBulk} {isPool ? "full bottles" : "full cases"}
            </p>
            {isPool && (
              <p className="text-sm text-muted-foreground">
                Expected Partial:{" "}
                {hasWeights
                  ? `${expectedPartialMl}ml`
                  : `~${expectedPartialMl}ml`}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Total: {expectedTotal.toFixed(1)} {getDisplayUnit()}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Entry Method
            </label>
            <div className="flex bg-secondary/50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setEntryMethod("bulk_partial")}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  entryMethod === "bulk_partial"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Bulk + Partial
              </button>
              <button
                type="button"
                onClick={() => setEntryMethod("loose_only")}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  entryMethod === "loose_only"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Total Only
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium mb-3">Current Count</p>
            {entryMethod === "bulk_partial" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    {getBulkLabel()}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 text-foreground outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    {getPartialLabel()}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={partialCount}
                    onChange={(e) =>
                      setPartialCount(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 text-foreground outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-muted-foreground">
                  Total {isPool ? "ml" : "units"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={partialCount}
                  onChange={(e) =>
                    setPartialCount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 text-foreground outline-none focus:border-primary/50 transition-colors font-mono"
                />
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isSignificantVariance
                ? "bg-yellow-500/10 border-yellow-500/20"
                : "bg-emerald-500/10 border-emerald-500/20"
            }`}
          >
            <p className="text-sm font-medium mb-2">Variance</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Expected:</span>
                <p className="font-mono">{expectedTotal.toFixed(1)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Actual:</span>
                <p className="font-mono">{reportedTotal.toFixed(1)}</p>
              </div>
            </div>
            <p
              className={`text-lg font-bold mt-2 font-mono ${
                variance > 0
                  ? "text-emerald-400"
                  : variance < 0
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {variance > 0 ? "+" : ""}
              {variance.toFixed(1)} {getDisplayUnit()} (
              {variancePercent.toFixed(1)}%)
            </p>
            {isSignificantVariance && (
              <p className="text-xs text-yellow-400 mt-2">
                ⚠️ Significant variance - please specify reason below
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Reason for Variance
            </label>
            <select
              value={varianceReason}
              onChange={(e) => setVarianceReason(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground mt-1"
            >
              <option value="">Select reason...</option>
              <option value="spillage">Spillage / Wastage</option>
              <option value="error">Counting Error</option>
              <option value="demo">Demo / Free Pour</option>
              <option value="receipt">In Transit / Receipt</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground mt-1 text-sm"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsSubmitting(true);
                saveAudit(undefined, {
                  onSettled: () => setIsSubmitting(false),
                });
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? "Saving..." : "Save Audit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
