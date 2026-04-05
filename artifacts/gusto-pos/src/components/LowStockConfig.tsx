import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventoryItem } from '@/lib/api-client-react';

interface LowStockConfigProps {
  item: InventoryItem;
  onClose?: () => void;
}

export function LowStockConfig({ item, onClose }: LowStockConfigProps) {
  const [lowStockMethod, setLowStockMethod] = useState(
    item.lowStockMethod || 'manual'
  );
  const [manualThreshold, setManualThreshold] = useState(
    item.lowStockManualThreshold || 5
  );
  const [percentThreshold, setPercentThreshold] = useState(
    item.lowStockPercent || 20
  );
  const [percentBase, setPercentBase] = useState(
    item.lowStockPercentBase || 100
  );
  const [usageDays, setUsageDays] = useState(
    item.lowStockUsageDays || 2
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { mutate: updateConfig } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/inventory/items/${item.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockMethod,
          lowStockManualThreshold: lowStockMethod.includes('manual')
            ? manualThreshold
            : undefined,
          lowStockPercent: lowStockMethod.includes('percentage')
            ? percentThreshold
            : undefined,
          lowStockPercentBase: lowStockMethod.includes('percentage')
            ? percentBase
            : undefined,
          lowStockUsageDays: lowStockMethod.includes('usage')
            ? usageDays
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
      onClose?.();
    },
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-xl font-bold mb-4">Low Stock Alert Config</h2>
      <p className="text-gray-600 text-sm mb-4">{item.name}</p>

      {/* Alert Method Selection */}
      <div className="mb-6 border-b pb-4">
        <p className="font-semibold mb-3">Alert Methods (Select one or more):</p>

        <div className="space-y-3">
          {/* Manual Threshold */}
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={lowStockMethod.includes('manual')}
              onChange={(e) => {
                if (e.target.checked) {
                  setLowStockMethod((prev) =>
                    prev.includes('manual') ? prev : prev + ' manual'
                  );
                } else {
                  setLowStockMethod((prev) =>
                    prev.replace(' manual', '').replace('manual', '').trim()
                  );
                }
              }}
              className="mt-1 mr-3"
            />
            <div>
              <p className="font-medium text-sm">Manual Threshold</p>
              <p className="text-xs text-gray-500 mb-2">
                Alert when stock falls below a specific number
              </p>
              {lowStockMethod.includes('manual') && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-600">Alert when &lt;</span>
                  <input
                    type="number"
                    min="1"
                    value={manualThreshold}
                    onChange={(e) => setManualThreshold(parseFloat(e.target.value) || 1)}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-600">
                    {item.partialUnit}
                  </span>
                </div>
              )}
            </div>
          </label>

          {/* Percentage-Based */}
          <label className="flex items-start mt-4">
            <input
              type="checkbox"
              checked={lowStockMethod.includes('percentage')}
              onChange={(e) => {
                if (e.target.checked) {
                  setLowStockMethod((prev) =>
                    prev.includes('percentage')
                      ? prev
                      : prev + ' percentage'
                  );
                } else {
                  setLowStockMethod((prev) =>
                    prev
                      .replace(' percentage', '')
                      .replace('percentage', '')
                      .trim()
                  );
                }
              }}
              className="mt-1 mr-3"
            />
            <div>
              <p className="font-medium text-sm">Percentage-Based</p>
              <p className="text-xs text-gray-500 mb-2">
                Alert when stock drops below a percentage of maximum
              </p>
              {lowStockMethod.includes('percentage') && (
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Alert when &lt;</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={percentThreshold}
                      onChange={(e) => setPercentThreshold(parseFloat(e.target.value) || 20)}
                      className="w-16 border rounded px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Max stock:</span>
                    <input
                      type="number"
                      min="1"
                      value={percentBase}
                      onChange={(e) => setPercentBase(parseFloat(e.target.value) || 100)}
                      className="w-20 border rounded px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-600">
                      {item.partialUnit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </label>

          {/* Usage-Based */}
          <label className="flex items-start mt-4">
            <input
              type="checkbox"
              checked={lowStockMethod.includes('usage')}
              onChange={(e) => {
                if (e.target.checked) {
                  setLowStockMethod((prev) =>
                    prev.includes('usage') ? prev : prev + ' usage'
                  );
                } else {
                  setLowStockMethod((prev) =>
                    prev.replace(' usage', '').replace('usage', '').trim()
                  );
                }
              }}
              className="mt-1 mr-3"
            />
            <div>
              <p className="font-medium text-sm">Usage-Based</p>
              <p className="text-xs text-gray-500 mb-2">
                Alert when stock equals less than X days of average usage
              </p>
              {lowStockMethod.includes('usage') && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-600">Alert when &lt;</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={usageDays}
                    onChange={(e) => setUsageDays(parseFloat(e.target.value) || 2)}
                    className="w-16 border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-600">days supply</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Example Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
        <p className="font-semibold text-yellow-900 mb-1">Example:</p>
        <p className="text-yellow-800 text-xs">
          {lowStockMethod.includes('manual') &&
            `Manual: Alert when &lt; ${manualThreshold}`}
          {lowStockMethod.includes('percentage') &&
            ` | Percentage: Alert when &lt; ${percentThreshold}% (of ${percentBase})`}
          {lowStockMethod.includes('usage') &&
            ` | Usage: Alert when &lt; ${usageDays} days`}
          {!lowStockMethod &&
            'Select at least one alert method'}
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setIsSubmitting(true);
            updateConfig(undefined, {
              onSettled: () => setIsSubmitting(false),
            });
          }}
          disabled={isSubmitting || !lowStockMethod}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Config'}
        </button>
      </div>
    </div>
  );
}
