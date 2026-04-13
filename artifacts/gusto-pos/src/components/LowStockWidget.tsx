import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { InventoryItem } from "@/types/inventory";

export function LowStockWidget() {
  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/low-stock");
      if (!response.ok) throw new Error("Failed to fetch low stock items");
      return response.json() as Promise<InventoryItem[]>;
    },
    // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Low Stock Alerts</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  const criticalItems = lowStockItems.filter((item) => {
    const current =
      item.currentBulk * (item.baseUnitAmount || 750) + item.currentPartial;
    // Critical if below 30% of threshold
    if (item.lowStockMethod?.includes("manual")) {
      return current < item.lowStockManualThreshold! * 0.3;
    }
    if (item.lowStockMethod?.includes("percentage")) {
      const pct = (current / item.lowStockPercentBase!) * 100;
      return pct < item.lowStockPercent! * 0.3;
    }
    return false;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          ⚠️ Low Stock Alerts
          {lowStockItems.length > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
              {lowStockItems.length}
            </span>
          )}
        </h3>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="text-sm text-green-600">
          ✓ All inventory levels are healthy
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {criticalItems.length > 0 && (
            <>
              <p className="text-xs font-semibold text-red-600 uppercase">
                🔴 Critical ({criticalItems.length})
              </p>
              {criticalItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-red-50 border border-red-200 rounded p-2 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-red-900">{item.name}</p>
                      <p className="text-xs text-red-700">
                        {item.currentBulk}
                        {item.baseUnit || "ml"} +{" "}
                        {item.currentPartial.toFixed(1)}
                        {item.partialUnit}
                      </p>
                    </div>
                    <Link href={`/inventory/${item.id}/audit`}>
                      <a className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                        Audit
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
              {criticalItems.length > 3 && (
                <p className="text-xs text-red-600 text-center">
                  +{criticalItems.length - 3} more critical
                </p>
              )}
            </>
          )}

          {/* Regular low stock */}
          {lowStockItems.filter((i) => !criticalItems.includes(i)).length >
            0 && (
            <>
              <p className="text-xs font-semibold text-yellow-600 uppercase mt-3">
                🟡 Low Stock (
                {lowStockItems.filter((i) => !criticalItems.includes(i)).length}
                )
              </p>
              {lowStockItems
                .filter((i) => !criticalItems.includes(i))
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-yellow-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-yellow-700">
                          {item.currentBulk}
                          {item.baseUnit || "ml"} +{" "}
                          {item.currentPartial.toFixed(1)}
                          {item.partialUnit}
                        </p>
                      </div>
                      <Link href={`/inventory/${item.id}/audit`}>
                        <a className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700">
                          Audit
                        </a>
                      </Link>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t">
        <Link href="/inventory">
          <a className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            View Full Inventory →
          </a>
        </Link>
      </div>
    </div>
  );
}
