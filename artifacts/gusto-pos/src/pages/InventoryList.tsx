import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InventoryAuditModal } from '@/components/InventoryAuditModal';
import type { InventoryItem } from '@/types/inventory';

export function InventoryList() {
  const [filterType, setFilterType] = useState('');
  const [filterSubtype, setFilterSubtype] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // Fetch inventory
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['/api/inventory/items'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/items');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

  // Get unique types and subtypes
  const types = useMemo(() => [...new Set(items.map((i: InventoryItem) => i.type))].filter(Boolean) as string[], [items]);
  const subtypes = useMemo(() => {
    if (!filterType) return [];
    return [...new Set(items.filter((i: InventoryItem) => i.type === filterType).map((i: InventoryItem) => i.subtype))].filter(Boolean) as string[];
  }, [items, filterType]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter((item: InventoryItem) => {
      if (filterType && item.type !== filterType) return false;
      if (filterSubtype && item.subtype !== filterSubtype) return false;
      if (showLowStockOnly && !isLowStock(item)) return false;
      return true;
    });
  }, [items, filterType, filterSubtype, showLowStockOnly]);

  // Check if item is low stock
  const isLowStock = (item: InventoryItem) => {
    const current = item.currentBulk * item.bulkSize + item.currentPartial;

    if (item.lowStockMethod?.includes('manual')) {
      if (current < item.lowStockManualThreshold!) return true;
    }

    if (item.lowStockMethod?.includes('percentage')) {
      const pct = (current / item.lowStockPercentBase!) * 100;
      if (pct < item.lowStockPercent!) return true;
    }

    // Usage-based would require historical data
    return false;
  };

  // Format date
  const formatDate = (timestamp?: number | Date) => {
    if (!timestamp) return 'Never';
    const ms = typeof timestamp === 'number' ? timestamp * 1000 : timestamp.getTime();
    return new Date(ms).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">⏳ Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded text-red-800">
        Error loading inventory: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📦 Inventory Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterSubtype(''); // Reset subtype when type changes
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Subtype Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Subtype</label>
            <select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              disabled={!filterType}
              className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">All Subtypes</option>
              {subtypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Filter */}
          <div className="flex items-end">
            <label className="flex items-center text-sm font-medium">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="mr-2"
              />
              Low Stock Only
            </label>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterType('');
                setFilterSubtype('');
                setShowLowStockOnly(false);
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filtered.length} of {items.length} items
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Subtype</th>
              <th className="px-4 py-3 text-center font-semibold">Stock</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Last Audit</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
            ) : (
              filtered.map((item: InventoryItem) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.type}</td>
                  <td className="px-4 py-3 text-gray-600">{item.subtype || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                      {item.currentBulk}
                      {item.bulkUnit ? ` ${item.bulkUnit}` : ''} +{' '}
                      {item.currentPartial.toFixed(1)}
                      {item.partialUnit ? ` ${item.partialUnit}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isLowStock(item) ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        ⚠️ Low Stock
                      </span>
                    ) : (
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        ✓ OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {formatDate(item.lastAuditedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setAuditModalOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Modal */}
      {selectedItem && (
        <InventoryAuditModal
          item={selectedItem}
          isOpen={auditModalOpen}
          onClose={() => {
            setAuditModalOpen(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
