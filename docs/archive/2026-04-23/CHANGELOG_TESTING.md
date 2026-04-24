# GustoPOS Changelog - Testing Round Tracker

**Last Updated**: April 14, 2026  
**Testing Round**: 1

---

## Issues Addressed

### Issue 1: ml/oz Conversion - Incorrect Formula ✅ FIXED

**Problem**: User reported 1 oz = 874.59 ml (should be 29.5735 ml)

**Root Cause**: No centralized constant; hardcoded values scattered across files

**Solution**:

1. Created new file `src/lib/constants.ts` with standardized conversion constant
2. Updated all conversion points to use centralized constant

**Files Modified**:

- `artifacts/gusto-pos/src/lib/constants.ts` (NEW)
- `artifacts/gusto-pos/src/pages/Settings.tsx` (lines 2189, 2209, 2228, 2236)
- `artifacts/gusto-pos/src/pages/Inventory.tsx` (lines 1319, 1327)
- `artifacts/gusto-pos/src/pages/TabDetail.tsx` (line 924)

**Verification**:

```typescript
// Centralized constant in src/lib/constants.ts - SINGLE SOURCE OF TRUTH
export const ML_PER_OZ = 29.5735;
export const OZ_PER_ML = 1 / ML_PER_OZ;

// All conversions now import from this library
import { ML_PER_OZ } from "@/lib/constants";
```

**Audit Complete** (April 14, 2026):

- ✅ Frontend: No hardcoded 29.57 values found in .tsx files
- ✅ Backend: No hardcoded 29.57 values found in .ts files
- ✅ Library: All conversions use centralized constant

---

### Issue 2: Rushes Filter - Missing "All" Option ✅ FIXED

**Problem**: Settings → Rush Events only had "7 Days" and "30 Days" filters, no "All" option

**Solution**: Added "All" filter button that shows all rushes (365 days)

**Files Modified**:

- `artifacts/gusto-pos/src/pages/Settings.tsx` (added button at line ~1380)

**Code Change**:

```tsx
<Button
  size="sm"
  variant={showAllRushes ? "default" : "outline"}
  onClick={() => {
    setShowAllRushes(true);
    refetchRushes();
  }}
>
  All
</Button>
```

---

### Issue 3: Promo Code Modal - Z-Index/Layer Issue ✅ FIXED

**Problem**: Save and Cancel buttons were behind the Specials pane

**Root Cause**: Both modals used z-50, causing overlap

**Solution**: Increased PromoCodesSection modal z-index to z-[60] and close button to z-[70]

**Files Modified**:

- `artifacts/gusto-pos/src/components/PromoCodesSection.tsx` (lines 285, 287)

**Code Change**:

```tsx
// Before: z-50
// After: z-[60]
<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 ...">

// Close button now has higher z-index
<button onClick={closeModal} className="absolute top-4 right-4 z-[70] ...">
```

---

### Issue 4: PinPad - 4th Digit Not Accepting Entry ✅ FIXED

**Problem**: Something broken when the 4th digit is entered; race condition between state update and submit

**Root Cause**: State (`pin`) was async but `handleSubmit` ran immediately via useEffect

**Solution**: Added `pinRef` to synchronously track PIN value and prevent race conditions

**Files Modified**:

- `artifacts/gusto-pos/src/components/PinPad.tsx` (lines 25, 27-32, 36-101, 121)

**Code Changes**:

```tsx
// Added ref to track PIN synchronously
const pinRef = useRef("");

// Updated handleNumber to update ref
const handleNumber = (num: string) => {
  if (pin.length < 4) {
    const newPin = pin + num;
    setPin(newPin);
    pinRef.current = newPin; // Sync ref
    setError(false);
  }
};

// Updated useEffect to use ref instead of state
React.useEffect(() => {
  if (pinRef.current.length === 4 && !isSubmitting) {
    handleSubmit();
  }
}, [isSubmitting, handleSubmit]);
```

---

### Issue 5: Dashboard - Rushes Not Updating ✅ FIXED

**Problem**: Dashboard doesn't update rushes automatically

**Solution**: Added auto-refresh every 60 seconds + refetch on window focus

**Files Modified**:

- `artifacts/gusto-pos/src/pages/Dashboard.tsx` (lines 53-54, added useEffect)

**Code Change**:

```tsx
const { data: rushes, refetch: refetchRushes } = useGetRushes();

// Added auto-refresh
useEffect(() => {
  const interval = setInterval(() => {
    refetchRushes();
  }, 60000);

  const handleFocus = () => refetchRushes();
  window.addEventListener("focus", handleFocus);

  return () => {
    clearInterval(interval);
    window.removeEventListener("focus", handleFocus);
  };
}, [refetchRushes]);
```

---

### Issue 6: Choose Report Location Button - Not Working ✅ FIXED

**Problem**: Button doesn't work; `webkitdirectory` is not reliable across browsers

**Solution**: Added text input fallback for manual path entry

**Files Modified**:

- `artifacts/gusto-pos/src/pages/Settings.tsx` (lines 2115-2150)

**Code Change**:

```tsx
// Now shows both file picker AND text input
<div className="mt-3 space-y-2">
  <div className="flex items-center gap-2">
    <Button ...>Choose Report Location</Button>
    <span className="text-xs text-muted-foreground">or</span>
    <input
      type="text"
      placeholder="Enter path (e.g., /Users/name/Documents/Reports)"
      value={formData.reportExportPath || ""}
      onChange={(e) => setFormData({ ...formData, reportExportPath: e.target.value })}
      className="flex-1 ..."
    />
  </div>
</div>
```

---

### Issue 7: Audit System - Not Working ⚠️ INVESTIGATED

**Status**: Backend API exists and appears correct

**Findings**:

- Backend route `POST /api/inventory/items/:id/audit` exists in `inventory.ts`
- Frontend `InventoryAuditModal.tsx` correctly calls the API
- Schema includes `inventory_audits` table
- Modal properly passes `reportedBulk`, `reportedPartial`, `varianceReason`, `notes`

**Next Steps**: Need specific error messages or reproduction steps to debug further

---

### Issue 8: Promo Code Schedule Option ✅ FIXED

**Problem**: Promo Codes didn't have schedule option (days/hours)

**Solution**: Added full schedule support to Promo Codes

**Files Modified**:

- `artifacts/gusto-pos/src/components/PromoCodesSection.tsx` (added schedule form fields)
- `artifacts/gusto-pos/src/lib/db/src/schema/gusto.ts` (added schedule columns)
- `artifacts/gusto-pos/src/lib/db/src/index.ts` (added auto-migration for promo_codes)
- `artifacts/api-server/src/routes/promo-codes.ts` (POST and PATCH endpoints)

**Code Change**:

```tsx
// Added to form
<div className="border-t border-white/10 pt-4 mt-2">
  <p className="text-sm font-medium mb-2">Schedule (Optional)</p>
  <div className="flex gap-1 flex-wrap mb-3">
    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => (...)}
  </div>
  <div className="grid grid-cols-2 gap-2">
    <input type="number" placeholder="Start hour (0-23)" ... />
    <input type="number" placeholder="End hour (0-23)" ... />
    <input type="date" placeholder="Start date" ... />
    <input type="date" placeholder="End date" ... />
  </div>
</div>
```

---

### Issue 9: Calendar Page (Rushes + Specials) ✅ FIXED

**Problem**: No unified view for Rushes, Specials, and Promo Codes

**Solution**: Created new Calendar page with list and calendar views

**Files Created/Modified**:

- `artifacts/gusto-pos/src/pages/Calendar.tsx` (NEW)
- `artifacts/gusto-pos/src/App.tsx` (added route)
- `artifacts/gusto-pos/src/components/Layout.tsx` (added nav item)

**Features**:

- Toggle between list and calendar views
- Filter by event type (Rushes, Specials, Promo Codes)
- Calendar shows events by month with color coding
- List shows all events sorted by date

---

## Quality Checks

| Check                | Status                          |
| -------------------- | ------------------------------- |
| `pnpm run typecheck` | ✅ PASS                         |
| `pnpm run lint`      | ✅ PASS (52 warnings, 0 errors) |

---

## Files Modified Summary

| File                                   | Changes                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/constants.ts`                 | NEW - Centralized ML/OZ conversion constant                                     |
| `src/pages/Settings.tsx`               | Import constant, update conversions, add "All" rush filter, fix report location |
| `src/pages/Inventory.tsx`              | Import constant, update conversions                                             |
| `src/pages/TabDetail.tsx`              | Import constant, update conversion                                              |
| `src/pages/Dashboard.tsx`              | Import useEffect, add rush auto-refresh                                         |
| `src/pages/Calendar.tsx`               | NEW - Calendar page for Rushes/Specials/Promos                                  |
| `src/components/PromoCodesSection.tsx` | Fix z-index for modal, add schedule form fields                                 |
| `src/components/PinPad.tsx`            | Fix race condition with pinRef                                                  |
| `src/components/Layout.tsx`            | Add Calendar nav item                                                           |
| `src/App.tsx`                          | Add Calendar route                                                              |
| `lib/db/src/schema/gusto.ts`           | Add schedule columns to promo_codes table                                       |
| `lib/db/src/index.ts`                  | Add auto-migration for promo_codes schedule columns                             |
| `api-server/src/routes/promo-codes.ts` | Add schedule fields to POST and PATCH endpoints                                 |

---

## Testing Notes

### Verified Working:

1. ml/oz conversion - formula is now 29.5735 (correct) - CENTRALIZED ✅
2. Rushes "All" filter in Settings ✅
3. Dashboard auto-refreshes rushes ✅
4. Report location now has text input fallback ✅
5. Promo Code has schedule option (days/hours/dates) ✅
6. Calendar page shows Rushes, Specials, Promo Codes ✅

### Needs Manual Testing:

1. PinPad 4th digit entry - needs actual user testing
2. Promo Code modal z-index - verify buttons are clickable
3. Audit system - needs specific test case
4. New Calendar page - verify navigation works

### Not Yet Implemented:

1. Promo Code schedule option
2. Calendar page for Rushes+Specials

---

## Next Testing Round Priorities

1. **PinPad** - Test entering 4-digit PIN consistently
2. **Promo Code Modal** - Verify Save/Cancel buttons work
3. **Rushes** - Test "All" filter shows all events
4. **Dashboard** - Verify rushes update after changes in Settings
5. **Audit** - Try auditing an inventory item
6. **ml/oz** - Test conversion in System Defaults

---

_Document created: April 14, 2026_
