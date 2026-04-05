import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type InventoryItem } from '@/lib/db';

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
  const [entryMethod, setEntryMethod] = useState<'bulk_partial' | 'loose_only'>('bulk_partial');
  const [bulkCount, setBulkCount] = useState(item.currentBulk);
  const [partialCount, setPartialCount] = useState(item.currentPartial);
  const [varianceReason, setVarianceReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Calculate total based on entry method
  const calculateTotal = () => {
    if (entryMethod === 'bulk_partial') {
      return bulkCount * item.bulkSize + partialCount;
    }
    return partialCount;
  };

  // Calculate expected total (previous inventory)
  const expectedTotal = item.currentBulk * item.bulkSize + item.currentPartial;

  // Calculate variance
  const reportedTotal = calculateTotal();
  const variance = reportedTotal - expectedTotal;
  const variancePercent = expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;

  // Alert if variance is significant (> 5%)
  const isSignificantVariance = Math.abs(variancePercent) > 5;

  const { mutate: saveAudit } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/inventory/items/${item.id}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditEntryMethod: entryMethod,
          reportedBulk: entryMethod === 'bulk_partial' ? bulkCount : undefined,
          reportedPartial: partialCount,
          reportedTotal,
          previousTotal: expectedTotal,
          expectedTotal,
          variance,
          variancePercent,
          varianceReason: varianceReason || 'unspecified',
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save audit');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Audit: {item.name}</h2>

        {/* Previous State Info */}
        <div className="bg-gray-100 p-3 rounded mb-4 text-sm">
          <p className="font-semibold">Previous Count:</p>
          <p>
            {item.currentBulk} {item.bulkUnit} + {item.currentPartial} {item.partialUnit}
          </p>
          <p className="text-gray-600 mt-1">
            Total: {expectedTotal} {item.partialUnit}
          </p>
        </div>

        {/* Entry Method Selector */}
        <div className="mb-4 border-b pb-4">
          <p className="font-semibold mb-2">Entry Method:</p>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="entryMethod"
                value="bulk_partial"
                checked={entryMethod === 'bulk_partial'}
                onChange={(e) => setEntryMethod(e.target.value as 'bulk_partial')}
                className="mr-2"
              />
              <span>Bulk + Partial (Recommended)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="entryMethod"
                value="loose_only"
                checked={entryMethod === 'loose_only'}
                onChange={(e) => setEntryMethod(e.target.value as 'loose_only')}
                className="mr-2"
              />
              <span>Total Only</span>
            </label>
          </div>
        </div>

        {/* Dynamic Entry Form */}
        <div className="mb-4 bg-blue-50 p-3 rounded">
          <p className="font-semibold mb-2">Current Count:</p>

          {entryMethod === 'bulk_partial' ? (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">
                  Full {item.bulkUnit}s: 
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded px-2 py-1 mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Partial {item.partialUnit}s:
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={partialCount}
                  onChange={(e) => setPartialCount(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded px-2 py-1 mt-1"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">
                Total {item.partialUnit}s:
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={partialCount}
                onChange={(e) => setPartialCount(parseFloat(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
          )}
        </div>

        {/* Variance Display */}
        <div
          className={`p-3 rounded mb-4 ${
            isSignificantVariance
              ? 'bg-yellow-100 border border-yellow-300'
              : 'bg-green-100 border border-green-300'
          }`}
        >
          <p className="font-semibold mb-1">Variance:</p>
          <div className="grid grid-cols-2 text-sm">
            <div>
              <span className="text-gray-600">Expected:</span>
              <p>{expectedTotal} {item.partialUnit}</p>
            </div>
            <div>
              <span className="text-gray-600">Actual:</span>
              <p>{reportedTotal} {item.partialUnit}</p>
            </div>
          </div>
          <p className="text-lg font-bold mt-2">
            <span className={variance > 0 ? 'text-green-700' : 'text-red-700'}>
              {variance > 0 ? '+' : ''}{variance.toFixed(2)} {item.partialUnit}{' '}
              ({variancePercent.toFixed(1)}%)
            </span>
          </p>
          {isSignificantVariance && (
            <p className="text-xs text-yellow-800 mt-1">
              ⚠️ Significant variance detected. Please specify reason.
            </p>
          )}
        </div>

        {/* Variance Reason */}
        <div className="mb-4">
          <label className="text-sm font-medium">Reason for Variance:</label>
          <select
            value={varianceReason}
            onChange={(e) => setVarianceReason(e.target.value)}
            className="w-full border rounded px-2 py-1 mt-1"
          >
            <option value="">Select reason...</option>
            <option value="spillage">Spillage / Wastage</option>
            <option value="error">Counting Error</option>
            <option value="demo">Demo / Free Pour</option>
            <option value="receipt">In Transit / Receipt</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Additional Notes */}
        <div className="mb-4">
          <label className="text-sm font-medium">Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-2 py-1 mt-1 text-sm"
            rows={2}
            placeholder="Additional notes about this audit..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
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
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Audit'}
          </button>
        </div>
      </div>
    </div>
  );
}
