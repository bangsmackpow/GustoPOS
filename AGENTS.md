# GustoPOS AI Agent Guide

Welcome, Agent. This document outlines the architecture and standards for GustoPOS.

## 🏗️ Architecture at a Glance

GustoPOS is a **pnpm monorepo** using a "Thin Client, Smart API" model.

- **Frontend**: React (Vite) + TanStack Query + Tailwind CSS.
- **API Server**: Express.js + Drizzle ORM + Pino Logger.
- **Database**: SQLite (LibSQL) for high performance and local-first reliability.
- **Deployment**:
  - **VirtualBox**: Debian-based appliance for airgapped bars.
  - **Desktop**: Electron wrapper for Mac/Windows.
  - **Docker**: Standard containers for cloud/VPS.

## 📦 Package Structure

### Library Packages (`lib/`)

| Package                       | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `@workspace/db`               | Database layer with Drizzle ORM, SQLite schema, migrations |
| `@workspace/api-zod`          | Zod schemas for API validation (generated)                 |
| `@workspace/api-client-react` | TanStack Query hooks (generated)                           |
| `@workspace/api-spec`         | OpenAPI spec for code generation                           |

### Application Packages (`artifacts/`)

| Package                     | Purpose                               |
| --------------------------- | ------------------------------------- |
| `@workspace/gusto-pos`      | Main React frontend (Vite + Tailwind) |
| `@workspace/api-server`     | Express.js API server                 |
| `@workspace/desktop-app`    | Electron wrapper                      |
| `@workspace/mockup-sandbox` | Design sandbox                        |

## 📡 Inventory System

**Active Table**: `inventoryItemsTable` in `lib/db/src/schema/inventory.ts`

- Used by `/api/ingredients` and `/api/inventory/items`
- Simplified Pool (weight-based) vs Collection (unit-based) tracking
- Pool: bottleSizeMl + weight fields for ml tracking
- Collection: unitsPerCase for unit tracking
- Auto-migrations add missing columns on startup

**Deprecated**: `_ingredientsTable` in `lib/db/src/schema/gusto.ts`

- No longer used by any routes
- Kept for backward compatibility only

## 🔐 Authentication

- **Pin Login**: `/api/pin-login` - Staff PIN-based authentication
- **Admin Login**: `/api/admin-login` - Manager/Admin access
- Session: JWT stored in httpOnly cookie

## 🚫 Routes Not for Production

- `dev-login.ts` has been removed - do not add debug routes

## 🛠 Quality Standards

- **Linting**: Run `pnpm run lint` before committing.
- **Types**: Ensure `pnpm run typecheck` passes.
- **Schema**: Database changes require a fresh migration in `lib/db/migrations/`.

## 🍹 Final Objective

GustoPOS is built for stability in "Real World" (low-connectivity) environments. Keep it simple, fast, and local-first.

---

## 📚 User Documentation

| Document                                      | Description                                         |
| --------------------------------------------- | --------------------------------------------------- |
| [README.md](../README.md)                     | Project overview, quick start, key features         |
| [ARCHITECTURE.md](../ARCHITECTURE.md)         | Technical architecture, database schema, API design |
| [USER_GUIDE.md](../USER_GUIDE.md)             | End-user operational guide for staff                |
| [ADMIN_GUIDE.md](../ADMIN_GUIDE.md)           | Administrator guide for system configuration        |
| [OPERATIONS_GUIDE.md](../OPERATIONS_GUIDE.md) | Deployment, configuration, maintenance              |
| [TESTING_GUIDE.md](../TESTING_GUIDE.md)       | Testing procedures and checklists                   |

Legacy documentation archived in: `docs/archive/`

---

## ⚠️ Known Issues

### Schema Auto-Fix (Implemented)

The database initialization (`lib/db/src/index.ts`) now automatically adds missing columns on startup:

- `sell_single_serving`, `single_serving_price`
- `alcohol_density`, `pour_size`, `audit_method`
- `variance_warning_threshold`
- `current_bulk`, `current_partial`, `current_stock` (stock tracking)
- `tracking_mode` (tracking mode: auto/pool/collection)

### Inventory Model

The system uses simplified **Pool** (weight-based) vs **Collection** (unit-based) tracking:

- **Pool**: `spirit`, `mixer`, `ingredient` (liquid) - tracks ml via bottle weight
- **Collection**: `beer`, `merch`, `misc` - tracks units per case
- **Tracking Mode**: New `trackingMode` field allows override: `"auto" | "pool" | "collection"`

### Inventory Tracking Mode

The inventory system now supports explicit tracking mode selection:

- **`trackingMode` column**: New field in `inventory_items` table (default: `"auto"`)
- **`"auto"`**: Automatically determines pool vs collection based on item type
- **`"pool"`**: Force weight-based tracking (ml) - for spirits, mixers, liquid ingredients
- **`"collection"`**: Force unit-based tracking - for beer, merch, misc, weighted ingredients

**Failsafe Logic** (for bulk import):

- Container size ≥ 100 → treated as ml (pool)
- Container size < 100 → treated as units (collection)
- Type override applied: spirit/mixer → pool, beer/merch/misc → collection

**Display Logic**:

- Pool items: Shows "Xml" (e.g., "750ml")
- Collection items: Shows "X units"
- Partial bottles without weights: Shows "<Xml" (honest about uncertainty)

### API Startup Requirements

The API server requires these environment variables:

```bash
ADMIN_PASSWORD=your-password PORT=3000 node ./dist/index.cjs
```

Default admin credentials are set at startup from `ADMIN_PASSWORD` env var.

---

## 🧪 Testing Notes

### Test Workflow

1. Admin Login → `POST /api/admin/login` with `{"username":"GUSTO","password":"<admin-password>"}`
2. Create Employee → `POST /api/users`
3. Start Shift → `POST /api/shifts`
4. Add Inventory → Direct SQL (API workaround) or via UI
5. Create Drinks → Direct SQL (API workaround) or via UI
6. Create/Open Tab → `POST /api/tabs`
7. Add Orders → `POST /api/tabs/:id/orders`
8. Close Tab → `PATCH /api/tabs/:id/close`
9. End Shift → `PATCH /api/shifts/:id/close`
10. Generate Report → `GET /api/shifts/:id/report`

### Key Endpoints Added (2026)

- `GET /api/shifts/:id/report` - Shift sales report (new)

### Key Endpoints Added (April 12, 2026)

**Period & Accounting:**

- `GET /api/periods` - List all periods
- `GET /api/periods/open` - Get current open period
- `POST /api/periods` - Create new period
- `POST /api/periods/:id/close` - Close period and calculate totals
- `GET /api/periods/:id/cogs` - Get COGS entries for period

**CSV Export (Admin Only):**

- `GET /api/export/sales` - Export sales data as CSV
- `GET /api/export/inventory` - Export inventory as CSV
- `GET /api/export/cogs` - Export COGS as CSV
- `GET /api/export/audit-logs` - Export audit logs as CSV
- `GET /api/export/periods` - Export period summaries as CSV

**Manager Authorization:**

- `DELETE /api/tabs/orders/:id` - Now requires `managerUserId` and `managerPin` in request body

---

## ✨ New Features (2026)

### Inventory Auditing System

Complete inventory audit tracking system has been implemented:

**Frontend:**

- New page: `src/pages/InventoryAudit.tsx` - accessible via `/inventory/:id/audit`
- New component: `src/components/InventoryAuditModal.tsx` - themed modal for recording audits
- Route added in `App.tsx`: `<Route path="/inventory/:id/audit" component={InventoryAudit} />`

**Backend:**

- `POST /api/inventory/items/:id/audit` - Record an audit for a specific item
- Updates `currentBulk`, `currentPartial`, `currentStock` from audit
- Sets `lastAuditedAt`, `lastAuditedByUserId`
- `GET /api/inventory-audits/history` - now includes `itemId` filter and additional fields

**Usage:**

- Navigate to Inventory page, click an item, then click "Audit" button
- Or use the LowStockWidget to audit low-stock items
- Record physical count, variance is calculated automatically
- Audit history is displayed on the audit page

### PIN Validation

- PINs now allow repeated digits (e.g., 1111, 2222)
- Previously rejected all-same-digit PINs for security, now allowed per user request
- Updated error messages in `users.ts`

### CSV Bulk Import

- Import no longer fails entirely on validation errors
- Invalid rows are skipped and reported in the response
- Added `.transform()` to handle NaN and negative values gracefully
- Response includes: `importedCount`, `failedRows[]`, and error details

### Staff Creation Fix

- Added `queryClient.invalidateQueries({ queryKey: ["/api/users"] })` after successful create
- New staff now appears in the list immediately after creation
- Added debug logging in backend to troubleshoot issues

---

## 📝 Key Files Modified

| File                                                         | Changes                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `artifacts/gusto-pos/src/pages/InventoryAudit.tsx`           | NEW - Audit page component                               |
| `artifacts/gusto-pos/src/components/InventoryAuditModal.tsx` | NEW & REWRITE - Themed modal                             |
| `artifacts/gusto-pos/src/App.tsx`                            | Added audit route                                        |
| `artifacts/gusto-pos/src/types/inventory.ts`                 | Added `currentStock` field                               |
| `artifacts/api-server/src/routes/inventory.ts`               | Added `POST /items/:id/audit` endpoint                   |
| `artifacts/api-server/src/routes/inventory-audits.ts`        | Enhanced history response                                |
| `artifacts/api-server/src/routes/users.ts`                   | Fixed PIN validation                                     |
| `artifacts/api-server/src/routes/bulk-import.ts`             | Skip invalid rows, added trackingMode, fixed currentBulk |
| `artifacts/gusto-pos/src/pages/Settings.tsx`                 | Added query invalidation, trackingMode, column mapping   |
| `artifacts/gusto-pos/src/pages/Inventory.tsx`                | Fixed cost/serving, partial display, trackingMode        |
| `lib/db/src/index.ts`                                        | Added stock column auto-migration                        |
| `lib/db/src/schema/inventory.ts`                             | Added trackingMode column                                |
| `lib/api-zod/src/generated/api.ts`                           | Added trackingMode to Zod schemas                        |
| `docs/CALCULATIONS.md`                                       | NEW - Complete calculation reference                     |

---

## 🏃 Running the App

```bash
# Development
pnpm run dev

# Build desktop app
pnpm run build:desktop

# Build everything
pnpm run build
```

The DMG is output to: `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`

---

## 📝 Session Updates (April 2026)

### Tracking Mode System

**Database:**

- Added `trackingMode` column to `inventory_items` table with default `"auto"`
- Auto-migration adds column if missing

**Frontend:**

- Added `trackingMode` dropdown in inventory edit modal
- Updated display to show "ml" for pool, "units" for collection
- Added `<Xml` display for partial bottles without weight data
- "Serving Size" now dynamically shows "oz" for pool, "units" for collection
- Updated bulk importer: removed "Units Per Case" column, single "Container Size" with failsafe logic

**Backend:**

- Added `trackingMode` to bulk-import.ts with auto-detection
- Added `trackingMode` to inventory.ts and ingredients.ts routes
- Fixed glass weight calculation: now uses `bottleSizeMl × density` instead of `baseUnitAmount × density`
- Fixed cost per serving calculation: now correctly calculates `(orderCost ÷ bottleSizeMl) × servingSize`
- Fixed simple cost (non-weighted): stores cost of new inventory only, not lifetime average
- Fixed `currentBulk` import: now properly saved during bulk import

### Collapsible Sidebars

**Main App Sidebar (Layout.tsx):**

- Added collapsible state with chevron toggle button in sidebar header
- Width transitions: `w-16` collapsed ↔ `w-24 lg:w-64` expanded
- Labels hidden when collapsed
- Starts expanded on load (default: `false`)

**Inventory Page Filter Sidebar (Inventory.tsx):**

- Added collapsible filter sidebar with toggle button
- Width transitions: `w-16` collapsed ↔ `w-[280px]` expanded
- Search, type filters, subtype filters, and quick filters hidden when collapsed

**Drinks Page Filter Sidebar (Drinks.tsx):**

- Added collapsible filter sidebar with toggle button
- Width transitions: `w-16` collapsed ↔ `w-70` expanded
- Search, category filters, and quick filters hidden when collapsed

### Horizontal Scroll for Inventory Table

- Added explicit `overflow-x-auto` for horizontal scrolling
- Made first two columns (Menu, Name) sticky with `sticky left-0` and `sticky left-10` positioning
- Table maintains `min-w-[800px]` for proper scroll behavior

### baseUnitAmount Consolidation

**Removed `bulkSize`** - Now using `baseUnitAmount` exclusively:

- Audit modal calculations use `baseUnitAmount` with fallback to 750
- All stock calculations use `baseUnitAmount`
- Removed from database schema (column remains for backward compatibility)
- Removed from frontend types and components
- Backend routes updated to use only `baseUnitAmount`

### Variance Analysis Page

**New page at `/inventory/variance`:**

- Summary cards: Total audits, items audited, items with variance
- Recommendations section with severity levels (critical, high, medium, low)
- Issue detection: Consistent underage, consistent overage, high volatility, recent significant variance
- Table showing all items with variance history
- Trend indicators (trending up/down)
- Filter by time period: 7, 30, or 90 days
- Bilingual support (English/Spanish)

**Access:** Link added in Inventory page sidebar under Quick Filters

### Key Files Modified This Session

| File                                                         | Changes                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `lib/db/src/schema/inventory.ts`                             | Added `trackingMode` column                                        |
| `lib/db/src/index.ts`                                        | Added `tracking_mode` auto-migration                               |
| `artifacts/gusto-pos/src/types/inventory.ts`                 | Added `trackingMode` type, removed `bulkSize`, `bulkUnit`          |
| `artifacts/gusto-pos/src/pages/Settings.tsx`                 | Removed UPC column, added trackingMode, fixed comma parsing        |
| `artifacts/gusto-pos/src/pages/Inventory.tsx`                | Added trackingMode display, collapsible sidebar, horizontal scroll |
| `artifacts/gusto-pos/src/pages/Drinks.tsx`                   | Added collapsible filter sidebar                                   |
| `artifacts/gusto-pos/src/pages/InventoryAudit.tsx`           | Uses baseUnitAmount for calculations                               |
| `artifacts/gusto-pos/src/pages/InventoryVariance.tsx`        | NEW - Variance analysis page                                       |
| `artifacts/gusto-pos/src/components/InventoryAuditModal.tsx` | Uses baseUnitAmount, dynamic labels for pool/collection            |
| `artifacts/gusto-pos/src/components/InventoryList.tsx`       | Uses baseUnitAmount, collapsible sidebar                           |
| `artifacts/gusto-pos/src/components/LowStockWidget.tsx`      | Uses baseUnitAmount                                                |
| `artifacts/gusto-pos/src/components/Layout.tsx`              | Added collapsible main sidebar                                     |
| `artifacts/gusto-pos/src/App.tsx`                            | Added variance analysis route                                      |
| `artifacts/api-server/src/routes/bulk-import.ts`             | Added trackingMode, fixed currentBulk, fixed glass weight          |
| `artifacts/api-server/src/routes/inventory.ts`               | Removed bulkSize, uses baseUnitAmount only                         |
| `artifacts/api-server/src/routes/ingredients.ts`             | Added trackingMode                                                 |
| `lib/api-zod/src/generated/api.ts`                           | Added trackingMode to Zod schemas                                  |

### April 12, 2026 - Accounting Features

**Period Closing System:**

- `lib/db/src/schema/periods.ts` - NEW - periods and cogs_entries tables
- `lib/db/src/schema/index.ts` - Export periods schema
- `artifacts/api-server/src/routes/periods.ts` - NEW - Period CRUD and close endpoints

**Manager Authorization:**

- `artifacts/api-server/src/routes/tabs.ts` - Void orders now require manager PIN

**CSV Export:**

- `artifacts/api-server/src/routes/export.ts` - NEW - Sales, inventory, COGS, audit logs export
- `artifacts/api-server/src/routes/index.ts` - Added periods and export routes

**Documentation:**

- `docs/ACCOUNTING_FEATURES.md` - NEW - Complete accounting features guide
- `docs/TEST_PROTOCOL.md` - Added Parts 16-19 for accounting tests

### Documentation Created

- `docs/CALCULATIONS.md` - Complete inventory calculation reference
- `docs/TEST_PROTOCOL.md` - Comprehensive test protocol with failure diagnostics

### April 11, 2026 - Critical Fixes

**PIN Login Fix:**

- `artifacts/gusto-pos/src/store.ts`: Removed `isLocked` from persisted state (line 36-41) - prevents lock state from persisting across app restarts
- `artifacts/gusto-pos/src/App.tsx`: Added reset of lock state on every app startup (line 46-52)
- `artifacts/gusto-pos/src/components/PinPad.tsx`: Fixed race condition with `submittedRef` and `useCallback` - prevents double-submit when entering 4th digit

**Inventory Flow Fix:**

- `artifacts/api-server/src/routes/tabs.ts:517-524`: Order creation now multiplies reserve amount by quantity
- `artifacts/api-server/src/routes/tabs.ts:580-605`: Stock check uses `currentStock + reservedStock` for availability
- `artifacts/api-server/src/routes/tabs.ts:607-640`: Order quantity update modifies `reservedStock` only (not `currentStock`)
- `artifacts/api-server/src/routes/tabs.ts:684-692`: Order deletion removes from `reservedStock`
- `artifacts/api-server/src/routes/tabs.ts:704-728`: Tab deletion returns stock to `currentStock`, clears `reservedStock`
- Added inventory finalization on tab close: `currentStock -= reservedStock`, `reservedStock = 0`

**Type Fixes:**

- `artifacts/api-server/src/routes/tabs.ts`: Fixed timestamp types - removed `.toISOString()` calls
- `artifacts/api-server/src/routes/tabs.ts`: Fixed `new Date()` to `Math.floor(Date.now() / 1000)`

**New Inventory Flow:**
| Action | Behavior |
|--------|----------|
| Add Order | `reservedStock += amount × quantity` |
| Update Quantity | Adjusts `reservedStock` only |
| Delete Order | `reservedStock -= amount × quantity` |
| Delete Tab | Returns `reservedStock` to `currentStock`, clears |
| Close Tab | `currentStock -= reservedStock`, `reservedStock = 0` |

**Files Modified:**

- `artifacts/gusto-pos/src/store.ts`
- `artifacts/gusto-pos/src/App.tsx`
- `artifacts/gusto-pos/src/components/PinPad.tsx`
- `artifacts/api-server/src/routes/tabs.ts`

---

## 📝 Inventory Enhancements (April 11, 2026)

### Container Weight Renaming

**Changed `glassWeightG` to `containerWeightG`:**

- Database: Renamed column `glass_weight_g` → `container_weight_g` via auto-migration
- All API routes updated (inventory.ts, bulk-import.ts, ingredients.ts)
- Frontend types, settings, and utils updated

### Estimated Partial Display

When weights aren't available:

- Shows `~Xml` (e.g., `~375ml`) to indicate estimate
- Calculation: `partialWeight × density = estimated ml`

When valid weights exist:

- Shows exact liquid weight in grams (e.g., `350g`)

### Stock Column Enhancement

Now displays full bottles + expected partial:

- Format: `3 full + 375ml` (exact) or `3 full + ~375ml` (estimated)
- Compact format as requested

### Audit Modal Enhancement

Added "Current State" section showing:

- Full bottles count
- Expected partial (exact or estimated)
- Total expected

### Column Sorting

All table columns are now sortable:

- Click header to sort ascending
- Click again for descending
- Click again to clear
- Session-only (resets on page reload)

### Name Column Width

- Reduced from `w-32 min-w-[128px]` to `w-24 min-w-[96px]`

---

## 📝 Planned Features (Future Sessions)

### Bilingual Support Testing

- Add language toggle to login and PIN screens
- Verify all UI text available in English and Spanish
- Test staff default language preference works
- Documented in: `docs/TEST_PROTOCOL.md` Part 16

### Inventory Audit System

- Batch/multi-item auditing from Settings → Audit Logs
- Audit sessions to group related audits
- Variance highlighting with color coding
- See: `docs/INVENTORY_AUDIT_SYSTEM.md`

### Configurable System Defaults

- Admin-only section in Settings to change hardcoded values
- Values include: default density, serving size, markup, etc.
- Audit trail for all changes
- See: `docs/SYSTEM_DEFAULTS.md`

---

## April 2026 Implementation Updates

### New API Endpoints

| Endpoint                               | Method | Description                                   |
| -------------------------------------- | ------ | --------------------------------------------- |
| `/api/settings/defaults`               | GET    | Get system default values                     |
| `/api/settings/defaults`               | PATCH  | Update system defaults (admin only)           |
| `/api/inventory/items/audit-age-stats` | GET    | Get audit age statistics for dashboard alerts |

### Database Schema Changes

**orders table (gusto.ts):**

- `voided` (integer, default 0) - Boolean flag for voided orders
- `voidReason` (text) - Reason for void: customer_changed_mind, wrong_order, spilled, comp, other
- `voidedByUserId` (text) - User who voided the order
- `voidedAt` (integer) - Timestamp when voided

**settings table (gusto.ts):**

- `defaultAlcoholDensity` (real, default 0.94)
- `defaultServingSizeMl` (real, default 44.36)
- `defaultBottleSizeMl` (real, default 750)
- `defaultUnitsPerCase` (integer, default 1)
- `defaultLowStockThreshold` (real, default 0)
- `defaultTrackingMode` (text, default "auto")
- `defaultAuditMethod` (text, default "auto")
- `varianceWarningThreshold` (real, default 5.0)

### Auto-Migrations Added

- `lib/db/src/index.ts`: Auto-adds void columns to orders table
- `lib/db/src/index.ts`: Auto-adds system defaults columns to settings table

### New Features

1. **Void Reason Tracking**: Orders are now marked as voided (not deleted) with reason tracking
2. **Language Toggles**: Globe icon on Login and PinPad screens for EN/ES switching
3. **Audit Age Stats**: Backend endpoint for Dashboard audit reminder alerts

### Key Files Modified

| File                                                 | Changes                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `lib/db/src/schema/gusto.ts`                         | Added void columns to ordersTable, system defaults to settingsTable |
| `lib/db/src/index.ts`                                | Added auto-migrations                                               |
| `artifacts/api-server/src/routes/tabs.ts`            | DELETE /orders/:id accepts reason, excludes voided from total       |
| `artifacts/api-server/src/routes/settings.ts`        | Added /settings/defaults endpoints                                  |
| `artifacts/api-server/src/routes/inventory.ts`       | Added /items/audit-age-stats endpoint                               |
| `artifacts/gusto-pos/src/pages/TabDetail.tsx`        | Void reason modal, crossed-out display                              |
| `artifacts/gusto-pos/src/pages/Login.tsx`            | Language toggle                                                     |
| `artifacts/gusto-pos/src/components/PinPad.tsx`      | Language toggle                                                     |
| `artifacts/gusto-pos/src/hooks/use-pos-mutations.ts` | Updated deleteOrder mutation                                        |
| `lib/api-client-react/src/generated/api.schemas.ts`  | Added void fields to Order type                                     |

---

## 📚 Documentation (April 2026)

### User Documentation

| Document                   | Location                | Purpose                        |
| -------------------------- | ----------------------- | ------------------------------ |
| **User Guide V2**          | `docs/USER_GUIDE_V2.md` | End-user operational guide     |
| **Admin Guide**            | `docs/ADMIN_GUIDE.md`   | System administration guide    |
| **Calculations Reference** | `docs/CALCULATIONS.md`  | Inventory calculation formulas |
| **Architecture**           | `ARCHITECTURE.md`       | Technical architecture         |

### Beta Testing

| Document                    | Location                        | Purpose                        |
| --------------------------- | ------------------------------- | ------------------------------ |
| **Beta Testing Protocol**   | `docs/BETA_TESTING_PROTOCOL.md` | Comprehensive test scenarios   |
| **Beta Deployment Roadmap** | `docs/BETA_ROADMAP.md`          | Deployment plan and milestones |

### Testing Protocol Summary

The test protocol covers:

- Authentication (PIN login, sessions, auto-lock)
- Shift management (start/close, reports)
- Tab/Order flow (create, add, void, close, split)
- Inventory (add, edit, delete, audit, variance)
- Menu/Drinks (create, edit, recipe management)
- Settings (staff, backups, system defaults)

### Pre-Beta Checklist

Before deploying to beta:

- [ ] Run `pnpm run lint` - no errors
- [ ] Run `pnpm run typecheck` - no errors
- [ ] Build passes: `pnpm run build`
- [ ] Database initializes correctly
- [ ] Admin account created
- [ ] Documentation accessible to users

---

## 🚀 Deployment Commands

### Development

```bash
pnpm run dev
```

### Production Build

```bash
pnpm run build
pnpm run build:desktop
```

### Run API Server

```bash
ADMIN_PASSWORD=your-password PORT=3000 node ./dist/index.cjs
```

### Generate API Types

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## 🍸 May 2026 - Bartender Experience & Analytics Updates

### Phase 1: Bartender Experience (Service Speed)

#### 1.1 Stock Status on Drink Cards

**File:** `artifacts/gusto-pos/src/pages/TabDetail.tsx`

- Drink cards now show real-time stock availability based on recipe ingredients
- Status indicators:
  - **Green**: Available (15+ servings)
  - **Yellow/Amber**: Medium stock (5-14 servings)
  - **Red pulsing dot**: Low stock (<5 servings)
  - **"OUT" + grayed out**: No stock available
- Stock calculation: `min(availableStock / amountNeeded)` across all recipe ingredients

#### 1.2 Quantity Selector

**File:** `artifacts/gusto-pos/src/pages/TabDetail.tsx`

- Added +/- buttons on drink card hover
- Shows current quantity selection (1-20 range)
- Single tap to add with selected quantity
- Per-drink quantity persistence during session

#### 1.3 Split Bill

**File:** `artifacts/gusto-pos/src/pages/TabDetail.tsx`

- "Split Bill" button in close tab dialog
- Configurable split: 2-10 people
- Shows per-person amount in real-time
- Uses existing `/api/tabs/:id/close` with `payments` array
- Each payment gets equal share of total + tip

### Phase 2: Sales Manager Analytics

#### 2.1 Quick Date Filters

**File:** `artifacts/gusto-pos/src/pages/Reports.tsx`

Added preset buttons in Analytics tab:

- Today, Yesterday
- This Week, Last Week
- This Month, Last Month
- Last 7 Days, Last 30 Days, Last 90 Days
- Year to Date (YTD)

#### 2.2 Void Analytics

**File:** `artifacts/api-server/src/routes/analytics.ts`

New endpoint: `GET /api/analytics/voids`

Returns:

- `summary`: totalVoids, totalVoidValue, voidRate, totalOrders
- `byReason`: Array of {reason, count, totalValue, percentage}
- `byStaff`: Array of {staffId, name, count, totalValue, reasons}
- `byDrink`: Top 10 voided drinks with counts

#### 2.3 Staff Stats Tracker

**File:** `artifacts/gusto-pos/src/pages/Reports.tsx`

New "Stats" tab with:

- **Business Summary Cards**: Total Sales, Tabs Closed, Avg Ticket, Total Tips
- **Staff Performance Table**: Sales, Tabs, Avg Ticket, Tips per staff member
- **Void Analysis**: Total voids, void value, void rate, by reason breakdown
- **Top Sellers**: Ranked list with revenue and units sold

### Key Files Modified This Session

| File                                           | Changes                                                    |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `artifacts/gusto-pos/src/pages/TabDetail.tsx`  | Stock status, quantity selector, split bill UI             |
| `artifacts/gusto-pos/src/pages/Reports.tsx`    | Quick date filters, Stats tab with business/staff insights |
| `artifacts/api-server/src/routes/analytics.ts` | Added `/analytics/voids` endpoint                          |

### API Endpoints Added

| Endpoint               | Method | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `/api/analytics/voids` | GET    | Void analytics by date range |

### Features Skipped (Per User Direction)

- **Recipe Tooltip**: Modal approach works well for touch interfaces
- **Additional Keyboard Shortcuts**: Ctrl+K for search already exists
- **Low Stock Quick Audit**: Already shown on Dashboard
