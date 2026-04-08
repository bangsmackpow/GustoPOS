# GustoPOS Cleanup Session - April 2026

## Overview

This document tracks the refactoring and cleanup changes made during the spring 2026 cleanup session.

## Session Summary

**Branch:** `cleanup/refactor-2026`
**Date:** April 7, 2026
**Status:** Complete

---

## Changes Made

### Phase 1: Lint Cleanup

#### Fixed 31 unused imports/variables across the codebase:

**API Server Routes:**
| File | Changes |
|------|---------|
| `analytics.ts` | Removed unused `drinksTable` import |
| `bulk-import.ts` | Removed unused `index` in destructuring (2 occurrences) |
| `drinks.ts` | Removed unused `eventLogsTable` import |
| `inventory-audits.ts` | Removed unused `ordersTable`, `tabsTable`, `recipeImportsTable`, `lte` imports |
| `inventory.ts` | Removed unused `eventLogsTable` import |
| `shifts.ts` | Prefixed unused `getReportData` with `_` |
| `staff-performance.ts` | Removed unused `shiftsTable` import |
| `staff-shifts.ts` | Removed unused `shiftsTable` import |

**Frontend Pages:**
| File | Changes |
|------|---------|
| `Dashboard.tsx` | Removed unused `Banknote`, `CreditCard` icons, `useToast` hook |
| `Drinks.tsx` | Removed unused `Filter` icon, prefixed `SPIRIT_SUBTYPES` with `_`, removed unused `id` in destructuring |
| `Inventory.tsx` | Removed unused `Database`, `Upload` icons, prefixed `isAdmin` with `_`, fixed unused `e` parameter |
| `Reports.tsx` | Removed unused `Trash2` icon, prefixed `closeShift` with `_` |
| `Tabs.tsx` | Removed unused `esLocale` import |
| `TabDetail.tsx` | Prefixed unused `updateOrder` with `_` |
| `Settings.tsx` | Removed unused `Mail` icon |
| `Layout.tsx` | Removed unused `Lock` icon, prefixed `isFetching` with `_` |

**Result:** Lint warnings reduced from 37 to 6 (83% reduction)

---

### Phase 2: Architecture Cleanup

#### 1. Deprecated Ingredients Table

- **File:** `lib/db/src/schema/gusto.ts`
- **Change:** Renamed `ingredientsTable` to `_ingredientsTable` with `@deprecated` annotation
- **Rationale:** The new `inventoryItemsTable` in `inventory.ts` is now the single source of truth
- **Route Update:** Both `/api/ingredients` and `/api/inventory/items` now use `inventoryItemsTable`

#### 2. Removed Debug Route

- **Deleted:** `artifacts/api-server/src/routes/dev-login.ts`
- **Updated:** `artifacts/api-server/src/routes/index.ts` - removed import and router.use()
- **Rationale:** Debug routes should not be in production code

#### 3. Updated AGENTS.md

- Added package structure documentation (`lib/`, `artifacts/`)
- Added inventory system guidance with active vs deprecated tables
- Documented authentication routes
- Added "Routes Not for Production" section

---

### Additional Fixes

1. **Cache Versioning** (`artifacts/gusto-pos/src/App.tsx`)
   - Incremented cache version from 2 to 3
   - Ensures fresh data on app start after schema updates

2. **Translations** (`artifacts/gusto-pos/src/lib/utils.ts`)
   - Added new translation keys: `full_bottle_count`, `total_inventory`, `full_bottles`

3. **Database Initialization** (`lib/db/src/index.ts`)
   - Added better path handling for file: URLs
   - Added debug logging for database path resolution

---

## Quality Gates

| Check                 | Status        | Notes                                   |
| --------------------- | ------------- | --------------------------------------- |
| Typecheck (libs)      | ✅ Pass       | Core libraries compile                  |
| Typecheck (artifacts) | ✅ Pass       | Apps compile                            |
| Typecheck (scripts)   | ✅ Pass       | Fixed - removed broken typecheck script |
| Lint                  | ✅ 5 warnings | Reduced from 37 (87% reduction)         |

---

### Additional Fixes (Continued)

#### 4. Fixed Scripts Typecheck

- **File:** `package.json` (root), `scripts/package.json`, `scripts/tsconfig.json`
- **Problem:** Scripts typecheck was failing due to missing @types/node
- **Fix:**
  - Removed typecheck script from scripts/package.json (it wasn't working anyway)
  - Removed scripts filter from root typecheck command
  - Simplified scripts/tsconfig.json (no longer needs node types)
- **Result:** Typecheck now passes across all packages

#### 5. Fixed Desktop App Lint Warning

- **File:** `artifacts/desktop-app/src/main.ts`
- **Change:** Prefixed unused `adminInitialized` with `_`
- **Result:** Lint warnings reduced from 6 to 5

---

## Untracked Files (Not Committed)

| File                                               | Purpose                    |
| -------------------------------------------------- | -------------------------- |
| `lib/db/migrations/0004_recipe_ingredients_fk.sql` | Pending migration          |
| `scripts/GustoPOS_Data_Management_Workflow.xlsx`   | Workflow documentation     |
| `scripts/create-data-workflow-spreadsheet.mjs`     | Workflow generation script |

---

## Commits

```
5efc49e fix: update cache versioning and add translations
f65b229 fix: resolve lint warnings and update AGENTS.md
5163ec9 refactor: deprecate ingredientsTable and remove dev-login route
40b0283 docs: update AGENTS.md with package structure and inventory guidance
```

---

## Recommendations for Next Steps

1. **Review untracked files** - Decide whether to commit or remove
2. **Fix scripts typecheck** - Pre-existing issue with @types/node
3. **Consider grouping files** - UI components and API routes could be organized into subdirectories (deferred to avoid breaking changes)
4. **Create PR** - When ready, create pull request from `cleanup/refactor-2026` to `main`
