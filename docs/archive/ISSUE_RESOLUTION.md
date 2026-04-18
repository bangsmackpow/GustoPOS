# GustoPOS Issue Resolution Tracker

## All Issues - COMPLETE (April 13, 2026)

### ✅ Issue 1: Rush Events Time Window

- **Files:** rushes.ts, api.ts, Settings.tsx
- **Fix:** Added 7/30 day filter buttons
- **Status:** COMPLETE

### ✅ Issue 2: System Settings Save Failure

- **File:** Settings.tsx
- **Fix:** Proper payload wrapper
- **Status:** COMPLETE

### ✅ Issue 3: Batch Audit Session Creation

- **Status:** Route works correctly at `/api/inventory/audit-sessions`
- **Status:** COMPLETE (already functional)

### ✅ Issue 10: System Defaults Save (Fixed Route Path)

- **File:** `artifacts/api-server/src/routes/settings.ts`
- **Fix:** Changed `/settings/defaults` to `/defaults` to avoid double `/settings/settings/defaults`
- **Status:** COMPLETE

### ✅ Issue 4: Staff Delete (Soft Delete)

- **File:** users.ts
- **Fix:** Soft delete (isActive=0)
- **Status:** COMPLETE

### ✅ Issue 5: CSV Import Field Mapping

- **File:** bulk-import.ts
- **Fix:** Corrected container weight calculation (bottleSizeMl × density)
- **Status:** COMPLETE

### ✅ Issue 6: Collection Fields Not Disabled

- **File:** Inventory.tsx
- **Fix:** Disabled density/bottle weight for collection items
- **Status:** COMPLETE

### ✅ Issue 7: Auto-Create Recipe

- **File:** bulk-import.ts
- **Fix:** Auto-adds 1 serving as recipe ingredient
- **Status:** COMPLETE

### ✅ Issue 8: Tabs "Please enter PIN" Error

- **File:** Layout.tsx
- **Fix:** Sync auth user to activeStaff on login
- **Status:** COMPLETE

### ✅ Issues 9-11: PIN Pad Keyboard Support

- **File:** PinPad.tsx
- **Fix:** Added keyboard event listener
- **Status:** COMPLETE

---

## Verification Checklist

- [x] PIN pad keyboard input works
- [x] Settings save persists to database
- [x] Rush events filter (7-day vs 30-day) works
- [x] Soft-deleted staff hidden from active list
- [x] Tabs creation works without PIN error
- [x] Batch audit creates session
- [x] CSV import maps fields correctly
- [x] Collection items hide density field
- [x] Menu items auto-create recipe

---

## Files Modified

| File                                             | Changes                                |
| ------------------------------------------------ | -------------------------------------- |
| `artifacts/gusto-pos/src/pages/Settings.tsx`     | Settings save fix, rush events buttons |
| `artifacts/gusto-pos/src/components/PinPad.tsx`  | Keyboard support                       |
| `artifacts/gusto-pos/src/components/Layout.tsx`  | Sync auth user to store                |
| `artifacts/gusto-pos/src/pages/Inventory.tsx`    | Collection field disabling             |
| `artifacts/api-server/src/routes/rushes.ts`      | Days query param                       |
| `artifacts/api-server/src/routes/users.ts`       | Soft delete                            |
| `artifacts/api-server/src/routes/bulk-import.ts` | Container weight, auto-recipe          |
| `lib/api-client-react/src/generated/api.ts`      | Rushes with params                     |
