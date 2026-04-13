# GustoPOS Implementation Plan - Session April 11, 2026

## Executive Summary

This document tracks the implementation of inventory tracking improvements including reservedStock for soft-delete, closeType for sold/comp tracking, specials system, and recipe validation.

**Status:** IN PROGRESS

---

## Completed Work

### Phase 1: Schema Changes ✅

#### 1.1 New Database Columns

| Table             | Column           | Type | Default | Description                                     |
| ----------------- | ---------------- | ---- | ------- | ----------------------------------------------- |
| `inventory_items` | `reserved_stock` | real | 0       | Tracks soft-reserved inventory (pending orders) |
| `tabs`            | `close_type`     | text | 'sale'  | 区分 sold/comp/staff                            |
| `tabs`            | `comp_reason`    | text | NULL    | Reason when close_type = comp                   |

#### 1.2 New Table: specials

```sql
CREATE TABLE specials (
  id TEXT PRIMARY KEY,
  drink_id TEXT REFERENCES drinks(id),
  special_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'scheduled' | 'event'
  discount_type TEXT NOT NULL, -- 'percentage' | 'fixed_amount'
  discount_value REAL NOT NULL,
  days_of_week TEXT, -- JSON: "1,2,3,4,5" for Mon-Fri
  start_hour INTEGER, -- 17 = 5:00 PM
  end_hour INTEGER, -- 20 = 8:00 PM
  start_date INTEGER, -- Unix timestamp for events
  end_date INTEGER, -- Unix timestamp for events
  is_active INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  created_by_user_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
```

#### 1.3 Files Modified

| File                                            | Change                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `lib/db/src/schema/inventory.ts`                | Added `reservedStock` field                                         |
| `lib/db/src/schema/gusto.ts`                    | Added `closeType`, `compReason` to tabsTable; added `specialsTable` |
| `lib/db/src/index.ts`                           | Added auto-migration for new columns and specials table             |
| `lib/db/migrations/0010_inventory_tracking.sql` | Migration file                                                      |
| `artifacts/gusto-pos/src/types/inventory.ts`    | Added `reservedStock` type                                          |

---

### Phase 2: Recipe Validation & inventory_single Fix ✅

#### 2.1 Frontend Validation (Drinks.tsx)

- **handleSave()**: Added validation to require recipe for non-inventory_single drinks
- **handleMenuToggle()**: Added check to prevent enabling isOnMenu without recipe

#### 2.2 Backend Validation (drinks.ts)

- **POST /drinks**: Added validation to reject drinks without recipe (unless inventory_single)
- **PATCH /drinks/:id**: Added validation to block isOnMenu=true when recipe is empty

#### 2.3 Auto-Recipe for inventory_single (inventory.ts)

When creating inventory item with `isOnMenu = true`:

- Drink created with `sourceType = "inventory_single"`
- **NEW**: Recipe ingredient automatically created linking to the inventory item itself
- Uses `servingSize` as the amount (default 44.36ml = 1.5oz)

Same for `sellSingleServing` - creates drink + recipe automatically.

#### 2.4 Files Modified

| File                                           | Change                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `artifacts/gusto-pos/src/pages/Drinks.tsx`     | Added recipe validation in handleSave and handleMenuToggle |
| `artifacts/api-server/src/routes/drinks.ts`    | Added backend validation, imports recipeIngredientsTable   |
| `artifacts/api-server/src/routes/inventory.ts` | Auto-create recipe for inventory_single drinks             |

---

### Phase 3: ReservedStock Implementation (tabs.ts) 🟡

#### 3.1 Order Added to Tab

**Changed from:**

```typescript
// OLD: Direct deduction from currentStock
currentStock: sql`currentStock - amount`;
```

**To:**

```typescript
// NEW: Soft reserve (adds to reservedStock)
reservedStock: sql`reservedStock + amount`;
```

#### 3.2 Order Deleted from Tab

**Changed from:**

```typescript
// OLD: Add back to currentStock
currentStock: newStock + addBack;
```

**To:**

```typescript
// NEW: Return from reservedStock
reservedStock: Math.max(0, reservedStock - addBack);
```

#### 3.3 Tab Closed - Implementation Started

- Added `deductInventoryOnTabClose()` helper function
- Parses `closeType` and `compReason` from request
- Determines closeType: explicit request OR derived from discountMxn > 0

**PENDING**:

- Add closeType/compReason to tab update set
- Call deductInventoryOnTabClose() in both close branches

#### 3.4 Files Modified

| File                                      | Change                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `artifacts/api-server/src/routes/tabs.ts` | Changed order add to use reservedStock, order delete to return reservedStock, added helper function |

---

## Remaining Work

### Phase 4: Comp Button + Tip Input (TabDetail.tsx) ⏳

- Add "Comp This Tab" button below Cash/Card buttons
- Comp confirmation dialog with reason selector (spill, staff, VIP, damaged, promotion, other)
- Ensure tip input is visible and functional
- Add tip pool tracking to shift reports

### Phase 5: Specials System ⏳

- Create `routes/specials.ts` - CRUD endpoints
- Integrate with price calculation in tabs.ts
- Add Settings UI for specials management

### Phase 6: Audit Adjustment ⏳

- Update InventoryAuditModal.tsx expected formula to include reservedStock
- Expected = currentStock + reservedStock

---

## Inventory Lifecycle After Implementation

```
[1. INVENTORY ADDED]
        │
        ▼
currentBulk + currentPartial ──► currentStock (physical)

[2. DRINK ADDED TO TAB] ── Soft Reserve
        │
        ▼
reservedStock += amountInBaseUnit
Available = currentStock - reservedStock

[3A. TAB CLOSES - SALE]     │  [3B. TAB CLOSES - COMP]
        │                    │         │
        ▼                    ▼         ▼
reservedStock -= amount     │  reservedStock -= amount
currentStock -= amount      │  currentStock -= amount
(track as SOLD)             │  (track as COMPED)

[4A. ORDER DELETED]    [4B. TAB DELETED]
        │                    │
        ▼                    ▼
reservedStock -= amount  reservedStock -= all
(returns to available)  (returns to available)
```

---

## Technical Notes

### Auto-Migration

The system includes auto-migration in `lib/db/src/index.ts` that automatically adds:

- `reserved_stock` column to inventory_items (if missing)
- `close_type` column to tabs (if missing)
- `comp_reason` column to tabs (if missing)
- `specials` table (if missing)

This ensures existing databases get the new fields without manual migration.

### Validation Summary

| Action           | Validation                                                |
| ---------------- | --------------------------------------------------------- |
| Create drink     | Recipe required (unless inventory_single)                 |
| Enable isOnMenu  | Recipe required (unless inventory_single)                 |
| Add order to tab | Adds to reservedStock (soft reserve)                      |
| Delete order     | Returns from reservedStock                                |
| Close tab (sale) | Deduct from reservedStock AND currentStock                |
| Close tab (comp) | Deduct from reservedStock AND currentStock, track as comp |

---

## Testing Plan

1. **Recipe Validation**
   - [x] Create drink without recipe → Blocked
   - [x] Enable isOnMenu without recipe → Blocked
   - [x] inventory_single drinks → Auto-have recipe

2. **ReservedStock**
   - [ ] Add drink to tab → reservedStock increases
   - [ ] Delete order → reservedStock decreases
   - [ ] Multiple tabs using same ingredient → Correct totals

3. **Close Type**
   - [ ] Close tab (no discount) → closeType = "sale"
   - [ ] Close tab (with discount) → closeType = "comp"
   - [ ] Use Comp button → closeType = "comp"

4. **Specials** (pending implementation)
   - [ ] Manual special toggles on/off
   - [ ] Scheduled special applies within time window
   - [ ] Event special applies within date range

---

## Files Changed Summary

| Component  | Files | Status |
| ---------- | ----- | ------ |
| Schema     | 2     | ✅     |
| Migrations | 1     | ✅     |
| API Routes | 3     | 🟡     |
| Frontend   | 1     | ✅     |
| Types      | 1     | ✅     |
| **Total**  | **8** |        |

---

## Next Steps

1. Complete Phase 3: Add closeType/compReason to tab updates, call deductInventoryOnTabClose()
2. Implement Phase 4: Comp button in TabDetail.tsx
3. Implement Phase 5: Specials system
4. Implement Phase 6: Audit adjustment

---

_Generated: April 11, 2026_
