import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { InventoryItem } from '@/lib/db';
import { InventoryAuditModal } from './InventoryAuditModal';
import { Search, Filter } from 'lucide-react';

export function InventoryList() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/inventory/items'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json() as Promise<InventoryItem[]>;
    },
  });

  // Get unique types
  const types = Array.from(new Set(items.map((i) => i.type)));

  // Get unique subtypes for selected type
  const subtypes = selectedType
    ? Array.from(
        new Set(
          items
            .filter((i) => i.type === selectedType)
            .map((i) => i.subtype)
            .filter(Boolean)
        )
      )
    : [];

  // Apply filters
  const filtered = items.filter((item) => {
    if (selectedType && item.type !== selectedType) return false;
    if (selectedSubtype && item.subtype !== selectedSubtype) return false;
    if (
      searchTerm &&
      !item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    if (showLowStockOnly) {
      const current = item.currentBulk * item.bulkSize + item.currentPartial;

      if (item.lowStockMethod?.includes('manual')) {
        if (current < item.lowStockManualThreshold!) return true;
      }

      if (item.lowStockMethod?.includes('percentage')) {
        const pct = (current / item.lowStockPercentBase!) * 100;
        if (pct < item.lowStockPercent!) return true;
      }

      return false;
    }

    return true;
  });

  if (isLoading) {
    return <div className="p-4 text-center">Loading inventory...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h1 className="text-2xl font-bold mb-2">Inventory Management</h1>
        <p className="text-blue-100">
          {filtered.length} of {items.length} items
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 border-b space-y-3">
        {/* Search */}
        <div className="flex gap-2 items-center bg-white rounded-lg border">
          <Search className="w-4 h-4 text-gray-400 ml-3" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 outline-none"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedSubtype('');
            }}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">All Types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Subtype Filter */}
          {selectedType && (
            <select
              value={selectedSubtype}
              onChange={(e) => setSelectedSubtype(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All {selectedType}</option>
              {subtypes.map((subtype) => (
                <option key={subtype} value={subtype}>
                  {subtype}
                </option>
              ))}
            </select>
          )}

          {/* Low Stock Filter */}
          <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No items match your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr className="text-left text-sm font-semibold text-gray-700">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Audit</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const current =
                  item.currentBulk * item.bulkSize + item.currentPartial;
                const isLowStock =
                  (item.lowStockMethod?.includes('manual') &&
                    current < item.lowStockManualThreshold!) ||
                  (item.lowStockMethod?.includes('percentage') &&
                    (current / item.lowStockPercentBase!) * 100 <
                      item.lowStockPercent!);

                const lastAuditDate = item.lastAuditedAt
                  ? new Date(item.lastAuditedAt * 1000).toLocaleDateString()
                  : 'Never';

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.type} {item.subtype && `/ ${item.subtype}`}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {item.currentBulk}
                      {item.bulkUnit} + {item.currentPartial.toFixed(1)}
                      {item.partialUnit}
                    </td>
                    <td className="px-4 py-3">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          ⚠️ Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          ✓ OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lastAuditDate}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAuditModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Audit Modal */}
      {showAuditModal && selectedItem && (
        <InventoryAuditModal
          item={selectedItem}
          onClose={() => {
            setShowAuditModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
