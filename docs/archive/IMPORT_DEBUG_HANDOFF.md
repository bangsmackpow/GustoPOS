# Bulk Import Debug Handoff Document

**Date:** April 21, 2026  
**Issue:** CSV bulk import not correctly mapping/importing data  
**Status:** Root cause identified, fix plan ready  

---

## Executive Summary

The bulk inventory import system has **two critical bugs** causing data to be imported incorrectly:

1. **Backend Merge Strategy Bug** (CRITICAL): When using "Merge" import strategy, the backend intentionally ignores new values for `currentPartial` and potentially other stock fields, always keeping old database values.

2. **Frontend-Backend Data Flow**: Even when user correctly maps columns in the UI, the merge strategy prevents updates from being applied.

**User Impact:** Inventory imports show "some fields updated, others didn't" - specifically stock levels (currentPartial, currentBulk, currentStock) remain unchanged for existing items.

---

## Conversation Timeline & Discoveries

### Initial Issue Report
- User: "Several items from the csv file are importing with 0 full and 0g partial with 0 total servings despite them having information in the csv"
- This is a recurring issue requiring high-priority investigation

### CSV Analysis
**Test File:** `test-data/26:04:18 GUSTO_Inventory_TEST 2.csv`
- **28 total columns** in CSV
- **13 fields** defined in APP_COLUMNS (frontend mapping config)
- **15 unmapped columns** (should be ignored)

**Key Mapped Columns:**
| APP_COLUMNS Key | CSV Header | Sample Value (Row 2) |
|-----------------|------------|---------------------|
| `name` | `name` | "CASA GIN" |
| `type` | `type` | "Spirits" |
| `subtype` | `subtype` | "Gin" |
| `trackingMode` | `tracking_mode` | "pool" |
| `bottleSizeMl` | `bottle_size_ml` | "1,000" |
| `fullBottleWeightG` | `full_bottle_weight_g` | "1,550" |
| `density` | `density` | "0.940" |
| `servingSize` | `serving_size` | "2.0" |
| `orderCost` | `order_cost` | "(empty)" |
| `currentSealed` | `current_sealed` | "2" |
| `currentPartial` | `current_partial` | "716" |
| `isOnMenu` | `is_on_menu` | "1" |
| `menuPricePerServing` | `price_per_serving` | "(empty)" |

**Unmapped Columns (should be ignored):**
- `Liquor weight per bottle (grams)`
- `containerWeightG`
- `lastAuditSealed`
- `lastAuditOpen`
- `Ounces per bottle`
- `Liquor in ACTIVE STOCK`
- `Ounces in partial bottle`
- `Servings per full bottle`
- `Servings in partial bottle` ← **Potential confusion source**
- `Servings in stock`
- `differenceSinceLastAudit`
- `ml in stock` ← **Potential confusion source**
- `pricePerServing`
- `menuPrice`
- `expectedProfit`

### Auto-Mapping Logic Verification

**File:** `artifacts/gusto-pos/src/pages/Settings.tsx` lines 482-495

```typescript
const autoSuggestMapping = (
  csvHeaders: string[],
  suggestions: string[],
): string => {
  for (const csvHeader of csvHeaders) {
    const normalized = csvHeader.toLowerCase().trim();
    for (const keyword of suggestions) {
      if (normalized === keyword.toLowerCase()) {  // ← EXACT match required
        return csvHeader;
      }
    }
  }
  return "";
};
```

**Status:** ✅ **CORRECT** - Uses exact string matching only

**APP_COLUMNS Suggest Arrays:**
```typescript
{
  key: "servingSize",
  label: "serving_size",
  suggest: ["serving_size"],  // ← Matches CSV column 19 exactly
},
{
  key: "orderCost",
  label: "order_cost",
  suggest: ["order_cost"],  // ← Matches CSV column 23 exactly
},
{
  key: "currentPartial",
  label: "current_partial",
  suggest: ["current_partial"],  // ← Matches CSV column 13 exactly
},
```

**Conclusion:** Auto-mapping logic is correct. CSV headers match suggest arrays exactly.

### User Report: "Some information changed and others didn't"

**Critical Clue:** This behavior indicates the **"Merge" import strategy** was used.

**Import Strategy Options:**
- **Replace**: Delete all inventory, fresh import
- **Update**: Update existing items by name, replace all values
- **Merge**: Update some fields, keep existing values for others ← **PROBLEMATIC**
- **Skip**: Skip existing items, only add new ones

---

## Root Cause Analysis

### Bug #1: Backend Merge Strategy Ignores New Values (CRITICAL)

**File:** `artifacts/api-server/src/routes/bulk-import.ts`  
**Lines:** 376-377 (merge strategy update)

**Current Code:**
```typescript
if (strategy === "merge") {
  await tx
    .update(inventoryItemsTable)
    .set({
      // ... other fields ...
      currentBulk: currentBulk || existing.currentBulk,      // ⚠️ Uses old if new is 0
      currentPartial: existing.currentPartial,                // ❌ ALWAYS uses old value!
      currentStock: existing.currentStock,                    // ❌ ALWAYS uses old value!
      orderCost: existing.orderCost,                          // ❌ ALWAYS uses old value!
      // ... other fields ...
    })
    .where(eq(inventoryItemsTable.id, existing.id));
}
```

**Problem:**
- Line 377: `currentPartial: existing.currentPartial` - **Never updates** from CSV
- Line 376: `currentBulk: currentBulk || existing.currentBulk` - Uses old value if new is `0` or falsy
- Similar issues for `currentStock`, `orderCost`, and other fields

**Impact:**
- User imports CSV with correct `current_partial = 716`
- Database has old value `current_partial = 0`
- Merge strategy keeps old value `0`
- **Result:** Inventory shows 0g partial despite CSV having 716g

### Bug #2: Frontend Column Mapping State (Unconfirmed)

**File:** `artifacts/gusto-pos/src/pages/Settings.tsx`  
**Lines:** 2840-2846 (dropdown onChange)

**Current Code:**
```typescript
<select
  value={columnMappings[col.key] || ""}
  onChange={(e) =>
    setColumnMappings({
      ...columnMappings,
      [col.key]: e.target.value,
    })
  }
>
```

**Status:** ✅ **Appears Correct** - Should save user's dropdown selection

**Unconfirmed Issue:** User reported mappings showed correctly but data imported incorrectly. This could be:
1. State not persisting between UI steps
2. Backend ignoring the mapped values (Bug #1 above)
3. Old cached app version

---

## Data Flow Trace

### Frontend Flow
```
1. User uploads CSV (handleIngredientUpload, line 497)
   ↓
2. Parse CSV headers & rows (lines 515-523)
   ↓
3. Auto-map columns (lines 528-533)
   - Uses autoSuggestMapping()
   - Sets initial columnMappings state
   ↓
4. User verifies/changes dropdowns (line 2840-2846)
   - onChange updates columnMappings state
   ↓
5. User clicks "Apply & Preview" (handleApplyMappings, line 551)
   ↓
6. Parse each row using columnMappings (lines 670-837)
   - Line 745: row[columnMappings["servingSize"]]
   - Line 760: row[columnMappings["orderCost"]]
   - Line 791: row[columnMappings["currentPartial"]]
   ↓
7. Send to backend via POST /api/bulk-ingredients
```

### Backend Flow
```
1. Receive ingredients array (bulk-import.ts, line 109)
   ↓
2. Validate with Zod schema (lines 142-180)
   ↓
3. Begin transaction (line 201)
   ↓
4. For each item:
   a. Check if exists by name (line 344)
   b. If exists & strategy="merge" (line 356)
      → Use existing values for some fields ❌ BUG
   c. If exists & strategy="update" (line 388)
      → Replace all values ✅ CORRECT
   d. If new item (line 473)
      → Insert with all values ✅ CORRECT
```

---

## Fix Plan

### Phase 1: Fix Backend Merge Strategy (CRITICAL)

**File:** `artifacts/api-server/src/routes/bulk-import.ts`  
**Lines:** 356-387 (merge strategy block)

**Change Required:**
```typescript
// CURRENT (WRONG)
if (strategy === "merge") {
  await tx
    .update(inventoryItemsTable)
    .set({
      type: existing.type,
      subtype: subtype && subtype.trim() !== "" ? subtype : existing.subtype,
      baseUnit: existing.baseUnit,
      baseUnitAmount: existing.baseUnitAmount,
      bulkUnit: bulkUnit || existing.bulkUnit,
      servingSize: existing.servingSize,
      servingUnit: servingUnit || existing.servingUnit,
      bottleSizeMl: bottleSizeMl || existing.bottleSizeMl,
      fullBottleWeightG: fullBottleWeightG || existing.fullBottleWeightG,
      orderCost: existing.orderCost,              // ❌ WRONG
      currentStock: existing.currentStock,        // ❌ WRONG
      currentBulk: currentBulk || existing.currentBulk,  // ⚠️ WRONG
      currentPartial: existing.currentPartial,    // ❌ WRONG
      lowStockThreshold: existing.lowStockThreshold,
      unitsPerCase: existing.unitsPerCase,
      trackingMode: trackingMode || existing.trackingMode,
      isOnMenu: existing.isOnMenu,
      // ...
    })
```

**Fixed Version:**
```typescript
// FIXED - Only keep existing values for truly optional fields
if (strategy === "merge") {
  await tx
    .update(inventoryItemsTable)
    .set({
      // Type info - keep existing if CSV is empty
      type: type || existing.type,
      subtype: subtype && subtype.trim() !== "" ? subtype : existing.subtype,
      
      // Base units - keep existing
      baseUnit: existing.baseUnit,
      baseUnitAmount: existing.baseUnitAmount,
      bulkUnit: bulkUnit || existing.bulkUnit,
      
      // Serving - keep existing if CSV is empty
      servingSize: servingSize || existing.servingSize,
      servingUnit: servingUnit || existing.servingUnit,
      
      // Bottle info - keep existing if CSV is empty
      bottleSizeMl: bottleSizeMl || existing.bottleSizeMl,
      fullBottleWeightG: fullBottleWeightG || existing.fullBottleWeightG,
      
      // Stock counts - ALWAYS use CSV values (even if 0)
      currentBulk: currentBulk !== undefined && currentBulk !== null ? currentBulk : existing.currentBulk,
      currentPartial: currentPartial !== undefined && currentPartial !== null ? currentPartial : existing.currentPartial,
      currentStock: currentStock !== undefined && currentStock !== null ? currentStock : existing.currentStock,
      
      // Cost - ALWAYS use CSV values (even if 0)
      orderCost: orderCost !== undefined && orderCost !== null ? orderCost : existing.orderCost,
      
      // Settings - keep existing if CSV is empty
      lowStockThreshold: lowStockThreshold || existing.lowStockThreshold,
      unitsPerCase: unitsPerCase || existing.unitsPerCase,
      trackingMode: trackingMode || existing.trackingMode,
      isOnMenu: isOnMenu !== undefined ? isOnMenu : existing.isOnMenu,
      
      // ... rest of fields ...
      
      updatedAt: Math.floor(Date.now() / 1000),
    })
```

**Key Changes:**
1. `currentBulk`, `currentPartial`, `currentStock`, `orderCost` now **always use CSV values** (even if 0)
2. Use explicit `!== undefined && !== null` check instead of falsy check (allows 0 values)
3. Keep existing values only for truly optional fields (subtype, servingUnit, bulkUnit, etc.)

---

### Phase 2: Add Import Strategy UI Guidance

**File:** `artifacts/gusto-pos/src/pages/Settings.tsx`  
**Location:** Near import strategy selector (around line 2860-2900)

**Add:**
```typescript
<div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
  <p className="text-sm text-blue-400 font-medium mb-2">Import Strategy Guide:</p>
  <ul className="text-xs text-muted-foreground space-y-1">
    <li>• <strong>Replace</strong> - Delete all inventory, fresh import (recommended for first import)</li>
    <li>• <strong>Update</strong> - Replace all values for existing items (recommended for updates)</li>
    <li>• <strong>Merge</strong> - Update names/types, keep existing stock/cost values</li>
    <li>• <strong>Skip</strong> - Only add new items, skip existing ones</li>
  </ul>
</div>
```

---

### Phase 3: Add Debug Logging

**File:** `artifacts/api-server/src/routes/bulk-import.ts`  
**Location:** Before UPDATE query (line 356) and INSERT query (line 475)

**Add:**
```typescript
console.log(`[Bulk Import] ${strategy.toUpperCase()} - ${name}:`, {
  currentBulk,
  currentPartial,
  currentStock,
  orderCost,
  servingSize,
  trackingMode,
  isOnMenu,
});
```

---

### Phase 4: Add Preview Validation

**File:** `artifacts/gusto-pos/src/pages/Settings.tsx`  
**Location:** In `handleApplyMappings` function (after line 837)

**Add:**
```typescript
// Sanity check for suspicious values
const warnings: string[] = [];
parsed.forEach((item, idx) => {
  // Serving size should be ~1-10 oz (30-300ml)
  if (item.servingSize > 500 || (item.servingSize > 0 && item.servingSize < 10)) {
    warnings.push(`Row ${idx+1}: servingSize=${item.servingSize}ml seems unusual`);
  }
  // Partial weight for pool items should be < 2000g
  if (item.currentPartial > 3000 && item.trackingMode === "pool") {
    warnings.push(`Row ${idx+1}: currentPartial=${item.currentPartial}g exceeds typical bottle weight`);
  }
  // Zero cost with stock is suspicious
  if (item.orderCost === 0 && item.currentBulk > 0) {
    warnings.push(`Row ${idx+1}: orderCost=0 but has ${item.currentBulk} sealed units`);
  }
});

if (warnings.length > 0) {
  toast({
    variant: "destructive",
    title: "Import Warnings",
    description: (
      <div className="max-h-40 overflow-y-auto text-xs">
        {warnings.slice(0, 10).map((w, i) => (
          <div key={i} className="mb-1">{w}</div>
        ))}
        {warnings.length > 10 && (
          <div className="text-muted-foreground">...and {warnings.length - 10} more</div>
        )}
      </div>
    ),
  });
}
```

---

### Phase 5: Rebuild & Test

**Commands:**
```bash
# 1. Run typecheck
pnpm run typecheck

# 2. Build desktop app
pnpm run build:desktop

# 3. Test import with "Update" strategy (not "Merge")
# 4. Check API server logs for debug output
# 5. Verify database has correct values
```

**Test Checklist:**
- [ ] Upload CSV with correct column mappings
- [ ] Select "Update" strategy (not "Merge")
- [ ] Verify preview shows correct values
- [ ] Complete import
- [ ] Check inventory table shows correct:
  - currentBulk (sealed bottles)
  - currentPartial (partial weight in grams)
  - Total Servings (calculated)
- [ ] Check API server logs for debug output
- [ ] Verify no errors in browser console

---

## Additional Context

### Tracking Mode Logic

**File:** `artifacts/gusto-pos/src/pages/Settings.tsx` lines 693-722

The tracking mode determination has fallback logic:
```typescript
let trackingMode = rawTrackingMode.toLowerCase().trim();
if (
  trackingMode !== "pool" &&
  trackingMode !== "collection" &&
  trackingMode !== "auto"
) {
  // Fallback: determine from container size
  trackingMode = containerSize >= 100 ? "pool" : "collection";
  
  // Override from type
  if (type === "spirit" || type === "mixer") {
    trackingMode = "pool";
  } else if (type === "beer" || type === "merch") {
    trackingMode = "collection";
  }
}
```

**Status:** ✅ Correct - handles missing/invalid tracking_mode values

### Weight Calculation

**File:** `artifacts/api-server/src/routes/bulk-import.ts` lines 229-240

```typescript
const bottleSizeForCalc = item.bottleSizeMl || item.baseUnitAmount || 750;
const liquidWeightG = bottleSizeForCalc * density;
const fullBottleWeightGInput = item.fullBottleWeightG || 0;

// IF fullBottleWeightG > 0, use it. Else: use liquid + 500g bottle estimate
const fullBottleWeightG = fullBottleWeightGInput > 0
  ? fullBottleWeightGInput
  : liquidWeightG + 500;

// Container weight = full weight - liquid weight
const containerWeightG = fullBottleWeightG - liquidWeightG; // auto-calculated
```

**Status:** ✅ Correct - implements weight failsafe logic

---

## Files Modified

| File | Lines | Change Type |
|------|-------|-------------|
| `artifacts/api-server/src/routes/bulk-import.ts` | 356-387 | Fix merge strategy |
| `artifacts/api-server/src/routes/bulk-import.ts` | 356, 475 | Add debug logging |
| `artifacts/gusto-pos/src/pages/Settings.tsx` | 2860-2900 | Add strategy guide UI |
| `artifacts/gusto-pos/src/pages/Settings.tsx` | 837+ | Add preview validation |

---

## Known Limitations

1. **Desktop App Caching**: Electron may cache old JavaScript bundles. User may need to:
   - Quit app completely (Cmd+Q)
   - Delete app cache: `rm -rf ~/Library/Application\ Support/gusto-pos`
   - Re-import CSV

2. **Database State**: If previous imports corrupted data, user should:
   - Use "Replace" strategy for clean slate, OR
   - Manually delete corrupted items before re-importing

3. **Column Mapping Persistence**: Mappings are per-import only (no localStorage). Each import requires fresh column selection.

---

## Success Criteria

Import is successful when:
- [ ] CSV column mappings auto-select correctly
- [ ] User can manually change dropdowns and selections persist
- [ ] Preview shows correct values from CSV
- [ ] Import completes without errors
- [ ] Inventory table shows correct stock values:
  - Sealed column = `current_sealed` from CSV
  - Partial column = `current_partial` from CSV (with "g" suffix for pool items)
  - Total Servings = calculated correctly
- [ ] API server logs show correct values being processed

---

## Contact Notes

**User Preferences:**
- Direct, concise communication preferred
- Values methodical, detailed analysis
- Expects code changes to be verified before implementation
- Working from desktop DMG app (not browser)

**Current Blocker:**
- Cannot proceed with later features (batch audit, etc.) until basic import works reliably

**Next Session:**
1. Implement Phase 1 (backend merge strategy fix)
2. Implement Phase 3 (debug logging)
3. Rebuild DMG
4. User tests import with "Update" strategy
5. Verify fix worked before proceeding to Phase 2 & 4
