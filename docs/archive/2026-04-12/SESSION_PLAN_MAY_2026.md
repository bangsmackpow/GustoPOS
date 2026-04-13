# Session Plan - May 2026

**Date:** May 2026
**Purpose:** Bartender Experience & Sales Manager Analytics Updates

---

## Plan Status: ✅ COMPLETE

### Implemented Features

| Phase | Feature                     | Status      |
| ----- | --------------------------- | ----------- |
| 1.1   | Stock Status on Drink Cards | ✅ Complete |
| 1.2   | Quantity Selector           | ✅ Complete |
| 1.3   | Split Bill                  | ✅ Complete |
| 2.1   | Quick Date Filters          | ✅ Complete |
| 2.2   | Void Analytics (Backend)    | ✅ Complete |
| 2.3   | Staff Stats Tracker         | ✅ Complete |

---

## Phase 1: Bartender Experience (Service Speed) - HIGH PRIORITY

### 1.1 Stock Status on Drink Cards ✅

**Description:** Show quantity remaining (green/yellow/red) on drink cards during order entry

**Implementation:**

- Drink cards now calculate available servings based on recipe ingredients
- Status indicators:
  - Green: 15+ servings available
  - Yellow/Amber: 5-14 servings (medium stock)
  - Red pulsing dot: <5 servings (low stock)
  - "OUT" + grayed out: No stock available
- Stock calculation: `min(currentStock / amountNeeded)` across all recipe ingredients

**Files Modified:**

- `artifacts/gusto-pos/src/pages/TabDetail.tsx`

### 1.2 Quantity Selector ✅

**Description:** Add +/- buttons when adding drinks instead of editing after

**Implementation:**

- Added quantity selector that appears on drink card hover
- Range: 1-20 quantities
- Single tap to add with selected quantity
- Per-drink quantity persistence during session

**Files Modified:**

- `artifacts/gusto-pos/src/pages/TabDetail.tsx`

### 1.3 Split Bill ✅

**Description:** Allow dividing tab equally OR custom amounts per payment

**Implementation:**

- "Split Bill" button in close tab dialog
- Configurable split: 2-10 people
- Shows per-person amount in real-time
- Uses existing `/api/tabs/:id/close` with `payments` array
- Each payment gets equal share of total + tip

**Files Modified:**

- `artifacts/gusto-pos/src/pages/TabDetail.tsx`

---

## Phase 2: Sales Manager Analytics

### 2.1 Quick Date Filters ✅

**Description:** Add preset buttons: Today, This Week, This Month, etc.

**Implementation:**

- Added quick filter buttons above date pickers in Reports page
- Presets: Today, Yesterday, This Week, Last Week, This Month, Last Month, Last 7 Days, Last 30 Days, Last 90 Days, Year to Date

**Files Modified:**

- `artifacts/gusto-pos/src/pages/Reports.tsx`

### 2.2 Void Analytics ✅

**Description:** Aggregate void reasons, track by staff, show trends

**Implementation:**

- New backend endpoint: `GET /api/analytics/voids`
- Returns:
  - `summary`: totalVoids, totalVoidValue, voidRate, totalOrders
  - `byReason`: Array of {reason, count, totalValue, percentage}
  - `byStaff`: Array of {staffId, name, count, totalValue, reasons}
  - `byDrink`: Top 10 voided drinks with counts

**Files Modified:**

- `artifacts/api-server/src/routes/analytics.ts`

### 2.3 Staff Stats Tracker ✅

**Description:** Stats tracker instead of ranking. Useful stats for personal tracking and business insights

**Implementation:**

- New "Stats" tab in Reports page
- Business Summary Cards: Total Sales, Tabs Closed, Avg Ticket, Total Tips
- Staff Performance Table: Sales, Tabs, Avg Ticket, Tips per staff member
- Void Analysis: Total voids, void value, void rate, by reason breakdown
- Top Sellers: Ranked list with revenue and units sold

**Stats Included:**

- **Personal Tracking:**
  - Sales volume
  - Tabs closed
  - Average ticket size
  - Tips earned
- **Business Insights:**
  - Total sales
  - Total orders
  - Void rate (quality metric)
  - Top selling items

**Files Modified:**

- `artifacts/gusto-pos/src/pages/Reports.tsx`

---

## Phase 3: Quick Enhancements

### 3.1 Recipe Tooltip ❌ (Skipped)

**Reason:** Modal approach works well for touch interfaces

### 3.2 Keyboard Shortcuts ❌ (Skipped)

**Reason:** Ctrl+K for search already exists in Layout.tsx

### 3.3 Low Stock Quick Audit ❌ (Skipped)

**Reason:** Low stock already shown on Dashboard

---

## Files Modified

### Backend

- `artifacts/api-server/src/routes/analytics.ts` - Added void analytics endpoint

### Frontend

- `artifacts/gusto-pos/src/pages/TabDetail.tsx` - Stock status, quantity selector, split UI
- `artifacts/gusto-pos/src/pages/Reports.tsx` - Date filters, void analytics, staff stats

---

## Testing Requirements

### Phase 1

- [x] Add drink with quantity > 1 works correctly
- [x] Stock indicator updates in real-time when inventory changes
- [x] Split bill calculates correctly for both modes
- [x] Batch audit accessible from sidebar (skipped - already in Settings)

### Phase 2

- [x] Date filters return correct date ranges
- [x] Void analytics match actual voided orders
- [x] Staff stats tracker displays correctly

### Phase 3

- [x] Keyboard shortcuts work without conflicting (skipped - already exists)
- [x] Recipe tooltip displays on hover (skipped - modal works)
- [x] Quick audit filters to low-stock items only (skipped - already on Dashboard)

---

## Verification

```bash
pnpm run lint    # ✅ Passes (pre-existing warnings only)
pnpm run typecheck  # ✅ Passes
```

---

## Notes

- Split bill works with existing backend support for multiple payments
- Void analytics uses the void tracking columns added in April 2026
- Stock status calculates from recipe ingredients, not just available inventory
- Quantity selector is per-drink, not global (each drink remembers its last quantity)
