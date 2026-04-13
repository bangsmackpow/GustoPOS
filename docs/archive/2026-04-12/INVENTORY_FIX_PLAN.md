# Inventory System Fix Plan

## Document Status: IN PROGRESS

---

## Executive Summary

This document tracks fixes for multiple inventory system issues discovered in the GustoPOS system:

1. Add Inventory modal functionality broken (cost calculations, UI labels, API save missing)
2. Stock display columns not showing data
3. Delete feedback unclear
4. Audit system exists but has no UX trigger

---

## Issue #1-4: Add Inventory Modal

### Location

`artifacts/gusto-pos/src/pages/Inventory.tsx` (lines 1414-1567)

### Issues & Fixes

| #   | Issue                                                      | Current Behavior                          | Expected Behavior                 | Fix |
| --- | ---------------------------------------------------------- | ----------------------------------------- | --------------------------------- | --- |
| 1   | "Total cost" shows per-unit cost ($15.00)                  | Actual total cost for all bottles added   | Multiply `addInvCost` by quantity |
| 2   | Label says "Partial (servings)"                            | Should say "Partial (grams)"              | Change label text                 |
| 3   | Shows: Bottles added, Servings added, Total cost           | Add: Cost per serving, Impact on avg cost | Add two new fields                |
| 4   | Clicking "+ Add Inventory" closes modal but data not saved | Should save to API                        | Call `saveIngredient.mutate()`    |

### Code Changes

**1. Total Cost Fix (lines 1507-1514):**

```typescript
// Current:
<div className="flex justify-between text-sm pt-2 border-t border-white/10">
  <span className="text-muted-foreground">Total cost:</span>
  <span className="font-mono text-emerald-400">
    ${addInvCost.toFixed(2)}
  </span>
</div>

// Fixed: Calculate total based on full bottles entered
const totalCost = (addInvCost * addInvFull);
```

**2. Label Fix (line 1445-1446):**

```typescript
// Current:
<label>Partial (servings)</label>

// Fixed:
<label>Partial (grams)</label>
```

**3. New Display Fields (after line 1506):**

- Add "Cost per serving" = totalCost / servingsAdded
- Add "Impact on weighted avg" = comparison showing how it affects cost per serving

**4. API Save Fix (lines 1549-1559):**

```typescript
// Current: setEditingItem({...}) - only sets local state
setEditingItem({
  ...showAddInventory,
  currentStock: (showAddInventory.currentStock || 0) + newStock,
  orderCost: avgCost,
});

// Fixed: Call the API to save
saveIngredient.mutate(
  {
    id: showAddInventory.id,
    data: {
      currentStock: (showAddInventory.currentStock || 0) + newStock,
      currentBulk: (showAddInventory.currentBulk || 0) + addInvFull,
      currentPartial: (showAddInventory.currentPartial || 0) + addInvPartial,
      orderCost: avgCost,
    },
  },
  {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
    },
  },
);
```

---

## Issue #5: Stock/Servings Display

### Location

`artifacts/gusto-pos/src/pages/Inventory.tsx` (lines 552, 158-167, 675)

### Issue

Stock and Servings columns show empty or incorrect data because:

- Uses `item.currentStock` directly instead of calculated value
- Should calculate from `currentBulk * baseUnitAmount + currentPartial`

### Fix

Update `getPooledStock` function to use correct fields:

```typescript
const getPooledStock = (item: any) => {
  if (item.type !== "spirit" && item.type !== "mixer") {
    return Number(item.currentStock);
  }
  // Calculate from bulk and partial
  const baseUnits = (item.currentBulk || 0) * (item.baseUnitAmount || 750);
  const partial = item.currentPartial || 0;
  return baseUnits + partial;
};
```

---

## Issue #6: Audit System UI

### Location

`artifacts/gusto-pos/src/pages/Inventory.tsx`

### Issue

Full audit system exists in database and API but has no UX trigger in the UI.

### Backend Already Exists:

- Database: `inventoryAuditsTable`, `auditSessionsTable` - FULLY IMPLEMENTED
- API: `/api/inventory-audits`, `/api/inventory/items/:id/audit` - IMPLEMENTED
- Component: `InventoryAuditModal.tsx` - EXISTS but not imported

### Fix

1. Import `InventoryAuditModal` in Inventory.tsx
2. Add audit state: `const [showAuditItem, setShowAuditItem] = useState(null)`
3. Add "Audit" button in item row (with clipboard icon or scale icon)
4. Render audit modal when `showAuditItem` is set

---

## Execution Order

```
[COMPLETE]    Document comprehensive plan
[COMPLETE]    Fix Add Inventory Modal - Total Cost calculation
[COMPLETE]    Fix Add Inventory Modal - Partial label to grams
[COMPLETE]    Fix Add Inventory Modal - Add cost per serving and impact fields
[COMPLETE]    Fix Add Inventory Modal - Connect to API save
[COMPLETE]    Fix Stock/Servings display columns
[COMPLETE]    Add Audit System UI trigger to Inventory page
[COMPLETE]    Test and verify all fixes
```

---

## Files Modified

- `artifacts/gusto-pos/src/pages/Inventory.tsx` - Main fixes

## Dependencies

- `artifacts/gusto-pos/src/components/InventoryAuditModal.tsx` - Already exists
- API routes already implemented

---

## Testing Checklist

- [ ] Add inventory - verify total cost calculates correctly
- [ ] Add inventory - verify grams label is correct
- [ ] Add inventory - verify new display fields show
- [ ] Add inventory - verify data saves and table updates
- [ ] Stock column - verify shows calculated value
- [ ] Audit button - verify modal opens
- [ ] Delete item - verify table updates after delete

---

**Document Created:** April 10, 2026
**Status:** Planning complete, execution started
