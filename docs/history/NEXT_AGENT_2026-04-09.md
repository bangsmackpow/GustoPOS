# GustoPOS Implementation Plan - Database Schema Correction + Data Flow Fixes

## Executive Summary

This document tracks the database schema correction and data flow fixes for GustoPOS. Fresh install only - existing databases unaffected.

**Status:** ALL TASKS COMPLETED ✅

---

## Local Storage & Backup System ✅ COMPLETED

### Features Implemented

1. **SQLite Performance Tuning** (lib/db/src/index.ts)
   - WAL mode enabled for better concurrency
   - Increased cache size (64MB)
   - Temp tables stored in memory
   - Foreign keys enabled

2. **Local Backup System** (artifacts/api-server/src/lib/backup.ts)
   - Auto-backup configurable interval (default: 15 minutes)
   - Max auto-backups configurable (default: 5)
   - Daily and weekly backups on shift close
   - Manual backup creation
   - Backup restore with confirmation
   - Backup deletion
   - Automatic cleanup of old backups

3. **Backup Settings** (lib/db/src/schema/gusto.ts)
   - `autoBackupEnabled` - Enable/disable auto backup
   - `autoBackupIntervalMin` - Time between backups (default: 15 min)
   - `maxAutoBackups` - Number of backups to keep (default: 5)
   - `lastAutoBackup`, `lastDailyBackup`, `lastWeeklyBackup` - timestamps

4. **Backup API Endpoints** (artifacts/api-server/src/routes/admin.ts)
   - `POST /api/admin/backup` - Create manual backup
   - `GET /api/admin/backups` - List all backups
   - `POST /api/admin/backups/:id/restore` - Restore from backup
   - `DELETE /api/admin/backups/:id` - Delete backup
   - `GET /api/admin/backup-settings` - Get backup settings
   - `POST /api/admin/backup/shift-close` - Backup on shift close

5. **Backup on Shift Close** (artifacts/api-server/src/routes/shifts.ts)
   - Automatic backup created when shift closes
   - Daily/weekly backups checked on shift close

6. **Startup Integrity Check** (lib/db/src/index.ts)
   - Database integrity check on startup
   - Warnings logged if corruption detected

7. **UI Controls** (artifacts/gusto-pos/src/pages/Settings.tsx)
   - Create backup button
   - Backup list display
   - Auto-backup settings (enabled, interval, max backups)
   - Backup refresh

### Configuration (in Settings)

| Setting               | Default | Description               |
| --------------------- | ------- | ------------------------- |
| autoBackupEnabled     | true    | Enable automatic backups  |
| autoBackupIntervalMin | 15      | Minutes between backups   |
| maxAutoBackups        | 5       | Number of backups to keep |

### Backup Storage Location

- Desktop: `~/Library/Application Support/GustoPOS/backups/`
- Server: `{database_directory}/backups/`

---

## Implementation Phases (Completed)

### Phase 1: Complete Migration Schema ✅

- [x] Create `0000_full_schema.sql` - all-in-one migration for fresh installs

### Phase 2: Schema Definition Corrections ✅

- [x] Fix `lib/db/src/schema/gusto.ts` - Add FK to recipeIngredientsTable + drinks.taxRate
- [x] Fix `db/seeds/insert-admin.sql` - Fix column names

### Phase 3: API Data Flow Corrections ✅

- [x] Fix `artifacts/api-server/src/routes/tabs.ts` - Populate tax fields on order
- [x] Fix `artifacts/api-server/src/routes/inventory.ts` - Add parentItemId, alcoholDensity

### Phase 4: Frontend Augmentation ✅

- [x] Verified weight fields in `artifacts/gusto-pos/src/pages/Inventory.tsx`

### Phase 5: Code Quality ✅

- [x] Run typecheck - PASSED
- [x] Run lint - PASSED (0 errors, 0 warnings)
- [x] Fix unused variable warnings

---

## Phase 6: Code Generation & Build ✅ COMPLETED

### Task 1: Code Generation ✅

- [x] Regenerate API types/zod schemas after schema changes

**Command:**

```bash
cd lib/api-spec && pnpm run codegen
```

**Files updated:**

- `lib/api-zod/src/generated/api.ts`
- `lib/api-client-react/src/generated/api.ts`
- `lib/api-client-react/src/generated/api.schemas.ts`

**Fixes applied:**

- Added missing OpenAPI endpoints (tax-rates, promo-codes, staff-shifts, staff-performance)
- Updated `promo-codes.ts` imports to use correct type names (GetPromoCodeByCodeParams, etc.)
- Updated `staff-shifts.ts` imports (ClockInStaffBody, ClockOutStaffBody, etc.)
- Added missing schemas to OpenAPI spec (TaxRate, PromoCode, StaffShift, StaffPerformance, etc.)
- Added `pinLockTimeoutMin` to AppSettings and UpdateSettingsBody
- Added `tipMxn` and `payments` to CloseTabBody

### Task 2: Build Verification ✅

- [x] App builds successfully
- [x] Typecheck passes
- [x] Lint passes (0 errors, 0 warnings)

**Commands:**

```bash
pnpm run typecheck  # PASSED
pnpm run lint       # PASSED (0 errors, 0 warnings)
pnpm run build:desktop  # PASSED - Builds DMG
```

**Build Output:**

- DMG: `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`
- App: `artifacts/desktop-app/dist/build/mac/GustoPOS.app`

**Manual verification checklist:**

- [x] App launches without errors
- [x] Binary exists at expected location

---

## File Changes Summary

| File                                           | Action | Status |
| ---------------------------------------------- | ------ | ------ |
| `lib/db/migrations/0000_full_schema.sql`       | CREATE | ✅     |
| `lib/db/src/schema/gusto.ts`                   | EDIT   | ✅     |
| `db/seeds/insert-admin.sql`                    | EDIT   | ✅     |
| `artifacts/api-server/src/routes/tabs.ts`      | EDIT   | ✅     |
| `artifacts/api-server/src/routes/inventory.ts` | EDIT   | ✅     |
| `artifacts/api-server/src/lib/sentry.ts`       | EDIT   | ✅     |
| `artifacts/gusto-pos/src/pages/Inventory.tsx`  | EDIT   | ✅     |
| `artifacts/gusto-pos/src/pages/Settings.tsx`   | EDIT   | ✅     |
| `artifacts/gusto-pos/src/pages/TabDetail.tsx`  | EDIT   | ✅     |
| `tests/smoke.spec.ts`                          | EDIT   | ✅     |

### Additional Files Modified (Phase 6)

| File                                                   | Action | Status |
| ------------------------------------------------------ | ------ | ------ |
| `lib/api-spec/openapi.yaml`                            | EDIT   | ✅     |
| `artifacts/api-server/src/routes/promo-codes.ts`       | EDIT   | ✅     |
| `artifacts/api-server/src/routes/tax-rates.ts`         | EDIT   | ✅     |
| `artifacts/api-server/src/routes/staff-shifts.ts`      | EDIT   | ✅     |
| `artifacts/api-server/src/routes/staff-performance.ts` | EDIT   | ✅     |
| `artifacts/gusto-pos/src/hooks/use-pos-mutations.ts`   | EDIT   | ✅     |
| `artifacts/gusto-pos/src/pages/Dashboard.tsx`          | EDIT   | ✅     |

---

## Completed Changes

1. **Migration 0000_full_schema.sql** - Complete all-in-one migration with all 15 tables, FK constraints, tax fields, indices, default tax rates

2. **Schema gusto.ts** - Added `taxRate` to drinksTable, FK from recipeIngredientsTable → inventoryItemsTable

3. **Seed insert-admin.sql** - Fixed column names, added language/pin

4. **API tabs.ts** - Populates taxCategory/taxRate on order creation

5. **API inventory.ts** - Supports parentItemId, alcoholDensity

6. **OpenAPI spec** - Added missing endpoints:
   - `/tax-rates`, `/tax-rates/config`, `/tax-rates/{category}`
   - `/promo-codes/{code}`
   - `/tabs/{id}/apply-code`
   - `/staff-shifts/{shiftId}`, `/staff-shifts/clock-in`, `/staff-shifts/clock-out`
   - `/staff-performance/{shiftId}`

7. **API route fixes** - Updated imports to match generated type names

8. **Lint fixes** - Prefixed unused variables with underscore

### Verification

```
✓ typecheck: PASSED
✓ lint: PASSED (0 errors, 0 warnings)
✓ build:desktop: PASSED (DMG built)
```

---

## Data Flow After Fixes

```
FRONTEND          →  API           →  DB            →  REPORT
─────────────────────────────────────────────────────────
Inventory Item   → POST /items    → inventory_items → Forecast
(with weight fields: parentItemId, alcoholDensity, tareWeightG)
                        ↓
                   recipe_ingredients
                   (FK → items)   → Consumption
                        ↓
Order Created    → POST /orders  → orders        → Sales
(includes tax)  → taxCategory, taxRate
                        ↓
                   tabs          → End-of-Night
                        ↓
Physical Audit → POST /audits  → inventory_audits → Variance
```

---

## Fresh Install Instructions

```bash
pnpm db:migrate  # Uses 0000_full_schema.sql
```

Existing databases continue on migrations 0000-0005.

---

## Task 3: Existing DB Migrations ⚠️ OPTIONAL

Additive migrations for existing databases (not needed for fresh installs)

| Migration                        | Changes                              |
| -------------------------------- | ------------------------------------ |
| `0006_add_drinks_tax_rate.sql`   | Add tax_rate column to drinks        |
| `0007_add_orders_tax_fields.sql` | Add tax_category, tax_rate to orders |
| `0008_create_tax_rates.sql`      | Create tax_rates table               |
| `0009_index_improvements.sql`    | Add performance indices              |

---

## Notes for Next Agent

- All critical data flow issues addressed
- System properly: links recipes to inventory, captures tax, supports weight fields
- Code passes typecheck + lint with 0 errors, 0 warnings
- Weight fields were already in frontend - no UI changes needed
- Desktop app builds successfully - DMG ready for distribution
- OpenAPI spec now includes all endpoints used by the API server
- Task 3 (Existing DB Migrations) is optional - only needed if supporting upgrades from old databases
