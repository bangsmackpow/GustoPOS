# GustoPOS Feature Inventory

## Overview

This document catalogs all features in GustoPOS, organized by functional area. Each feature includes:

- **Description**: What the feature does
- **How it's used**: User interaction flow
- **Connections**: API endpoints, database tables, related components

---

## 1. Authentication & Authorization

### 1.1 PIN Login

- **Description**: Staff authenticate using 4-digit PIN
- **How it's used**: Bartenders enter PIN on PinPad screen to access the POS
- **Connections**:
  - API: `POST /api/pin-login` (routes/pin-login.ts)
  - Database: `users` table (pin column)
  - Frontend: Login.tsx, PinPad.tsx
- **Status**: ✅ Implemented

### 1.2 Admin Login

- **Description**: Manager/Admin access with username/password
- **How it's used**: Admin enters credentials for full system access
- **Connections**:
  - API: `POST /api/admin/login` (routes/admin-login.ts)
  - Database: `users` table (password column)
  - Frontend: Login.tsx
- **Status**: ✅ Implemented

### 1.3 Role-Based Access Control

- **Description**: Roles: admin, manager, head_bartender, bartender, server
- **How it's used**: System enforces permissions based on role
- **Connections**:
  - Middleware: `requireRole()` (middlewares/authMiddleware.ts)
  - Database: `users` table (role column)
- **Status**: ✅ Implemented

### 1.4 Language Selection (Bilingual)

- **Description**: Support for English (en) and Spanish (es)
- **How it's used**: Users can toggle language on login/pin screens
- **Connections**:
  - Database: `users` table (language column)
  - Frontend: i18n system, translations
- **Status**: ✅ Implemented

### 1.5 Session Management

- **Description**: JWT-based session with auto-lock
- **How it's used**: Auto-lock after inactivity (configurable timeout)
- **Connections**:
  - Middleware: authMiddleware.ts
  - Frontend: store.ts (persisted state)
- **Status**: ✅ Implemented

---

## 2. User/Staff Management

### 2.1 User CRUD

- **Description**: Create, read, update, delete staff accounts
- **How it's used**: Admins manage staff in Settings > Staff
- **Connections**:
  - API: `GET/POST /users`, `PATCH/DELETE /users/:id` (routes/users.ts)
  - Database: `users` table
  - Frontend: Settings.tsx (Staff tab)
- **Status**: ✅ Implemented

### 2.2 PIN Management

- **Description**: Set/reset staff PINs
- **How it's used**: Admins assign PINs to staff
- **Connections**:
  - API: `POST /users/:id/reset-password` (for PIN reset)
  - Database: `users` table (pin column)
- **Status**: ✅ Implemented

### 2.3 Staff Roles

- **Description**: Assign roles (admin, manager, head_bartender, bartender, server)
- **How it's used**: HR manages staff positions
- **Connections**: Database `users` table (role column)
- **Status**: ✅ Implemented

### 2.4 Staff Language Preference

- **Description**: Set preferred language per staff
- **How it's used**: Staff have their own language setting
- **Connections**: Database `users` table (language column)
- **Status**: ✅ Implemented

---

## 3. Inventory/Ingredients Management

### 3.1 Inventory CRUD

- **Description**: Create, read, update, delete inventory items
- **How it's used**: Admins manage inventory in Inventory page
- **Connections**:
  - API: `GET/POST /inventory/items`, `PATCH/DELETE /inventory/items/:id` (routes/inventory.ts)
  - API: `GET/POST /ingredients` (routes/ingredients.ts) - deprecated alias
  - Database: `inventory_items` table
  - Frontend: Inventory.tsx, Settings.tsx (Add Inventory tab)
- **Status**: ✅ Implemented

### 3.2 Inventory Types

- **Description**: Types: spirit, beer, mixer, unit (plus misc, merch subtypes)
- **How it's used**: Categorize inventory for tracking
- **Connections**: Database `inventory_items` table (type, subtype columns)
- **Status**: ✅ Implemented

### 3.3 Tracking Modes

- **Description**: Pool (weight/ml), Collection (units), Auto
- **How it's used**: Determines how stock is calculated and displayed
- **Connections**:
  - Database: `inventory_items` table (tracking_mode column)
  - Frontend: Inventory.tsx, InventoryAuditModal.tsx
- **Status**: ✅ Implemented

### 3.4 Stock Management

- **Description**: currentStock, currentBulk, currentPartial, reservedStock
- **How it's used**: Track full bottles, open bottles, reserved for open tabs
- **Connections**:
  - API: Stock logic in tabs.ts (order creation/close)
  - Database: `inventory_items` table
- **Status**: ✅ Implemented (fixed double-deduction issue)

### 3.5 Container Weight Tracking

- **Description**: Track bottle weight for partial calculation
- **How it's used**: Calculate remaining ml from bottle weight
- **Connections**:
  - Database: `inventory_items` table (container_weight_g, full_bottle_weight_g, density)
  - Frontend: InventoryAuditModal.tsx
- **Status**: ✅ Implemented

### 3.6 Inventory Auditing

- **Description**: Record physical inventory counts
- **How it's used**: Click "Audit" on inventory item to record count
- **Connections**:
  - API: `POST /inventory/items/:id/audit` (routes/inventory.ts)
  - API: `GET /inventory-audits/history` (routes/inventory-audits.ts)
  - Database: `inventory_audits` table
  - Frontend: InventoryAudit.tsx, InventoryAuditModal.tsx
- **Status**: ✅ Implemented

### 3.7 Variance Analysis

- **Description**: Track and display inventory variance over time
- **How it's used**: Analyze audit history for patterns
- **Connections**:
  - API: `GET /inventory-audits/variance-summary` (routes/inventory-audits.ts)
  - Database: `inventory_audits` table
  - Frontend: InventoryVariance.tsx
- **Status**: ✅ Implemented

### 3.8 Low Stock Alerts

- **Description**: Alert when inventory below threshold
- **How it's used**: Dashboard shows low stock items
- **Connections**:
  - API: `GET /inventory/low-stock` (routes/inventory.ts)
  - Database: `inventory_items` table (low_stock_threshold)
  - Frontend: Dashboard.tsx, LowStockWidget.tsx
- **Status**: ✅ Implemented

### 3.9 Bulk Import

- **Description**: Import inventory from CSV
- **How it's used**: Settings > Bulk Import > Import Ingredients
- **Connections**:
  - API: `POST /admin/bulk-ingredients` (routes/bulk-import.ts)
  - Database: `inventory_items` table
  - Frontend: Settings.tsx (Bulk Import tab)
- **Status**: ✅ Implemented (fixed CSV parsing, density, type normalization)

### 3.10 Audit Age Statistics

- **Description**: Track when items were last audited
- **How it's used**: Dashboard alerts for items needing audit
- **Connections**:
  - API: `GET /inventory/items/audit-age-stats` (routes/inventory.ts)
  - Database: `inventory_audits` table
  - Frontend: Dashboard.tsx
- **Status**: ✅ Implemented

---

## 4. Menu/Drinks Management

### 4.1 Drinks CRUD

- **Description**: Create, read, update, delete drinks
- **How it's used**: Manage drink menu in Drinks page
- **Connections**:
  - API: `GET/POST /drinks`, `PATCH/DELETE /drinks/:id` (routes/drinks.ts)
  - Database: `drinks` table
  - Frontend: Drinks.tsx
- **Status**: ✅ Implemented

### 4.2 Recipe Management

- **Description**: Define ingredients and amounts per drink
- **How it's used**: Create/edit drink includes recipe builder
- **Connections**:
  - Database: `drinks` table (recipe JSON), `drink_recipe` table
  - Frontend: Drinks.tsx (recipe editor)
- **Status**: ✅ Implemented

### 4.3 Drink Categories

- **Description**: Organize drinks (Cocktails, Beer, Wine, etc.)
- **How it's used**: Filter drinks in Drinks page
- **Connections**: Database `drinks` table (category column)
- **Status**: ✅ Implemented

### 4.4 Pricing

- **Description**: Cost, suggested price, actual price, markup factor
- **How it's used**: Set and adjust drink pricing
- **Connections**:
  - Database: `drinks` table (cost_per_drink, suggested_price, actual_price, markup_factor)
  - Frontend: Drinks.tsx
- **Status**: ✅ Implemented

### 4.5 Availability Toggle

- **Description**: Mark drinks as available/unavailable
- **How it's used**: Toggle drink availability without deleting
- **Connections**: Database `drinks` table (is_available column)
- **Status**: ✅ Implemented

### 4.6 Stock Status on Drink Cards

- **Description**: Show real-time stock availability on drink cards
- **How it's used**: Drink cards show green/yellow/red dot based on recipe stock
- **Connections**:
  - Frontend: TabDetail.tsx (stock calculation from recipe ingredients)
  - API: Uses inventory stock data
- **Status**: ✅ Implemented

### 4.7 Bulk Import Drinks

- **Description**: Import drinks from CSV
- **How it's used**: Settings > Bulk Import > Import Drinks
- **Connections**:
  - API: `POST /admin/bulk-drinks` (routes/bulk-import.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

---

## 5. Tab/Order Management

### 5.1 Tab CRUD

- **Description**: Create, read, update, delete tabs
- **How it's used**: Open and manage customer tabs in Tabs page
- **Connections**:
  - API: `GET/POST /tabs`, `PATCH/DELETE /tabs/:id` (routes/tabs.ts)
  - Database: `tabs` table
  - Frontend: Tabs.tsx, TabDetail.tsx
- **Status**: ✅ Implemented

### 5.2 Order Management

- **Description**: Add, update, remove orders from tabs
- **How it's used**: Add drinks to tab, modify quantities, remove items
- **Connections**:
  - API: `POST /tabs/:id/orders`, `PATCH /orders/:id`, `DELETE /orders/:id` (routes/tabs.ts)
  - Database: `orders` table
  - Frontend: TabDetail.tsx
- **Status**: ✅ Implemented

### 5.3 Tab Closing & Payment

- **Description**: Close tab, record payment method, add tip
- **How it's used**: Complete sale, choose cash/card, add tip
- **Connections**:
  - API: `POST /tabs/:id/close` (routes/tabs.ts)
  - Database: `tabs` table (status, payment_method, tip)
  - Frontend: TabDetail.tsx (close dialog)
- **Status**: ✅ Implemented

### 5.4 Split Bill

- **Description**: Divide tab among multiple people
- **How it's used**: Close dialog has "Split Bill" option
- **Connections**:
  - API: `POST /tabs/:id/close` (with payments array)
  - Frontend: TabDetail.tsx
- **Status**: ✅ Implemented

### 5.5 Order Voiding

- **Description**: Void orders with reason tracking
- **How it's used**: Manager authorization required to void orders
- **Connections**:
  - API: `DELETE /orders/:id` requires managerPin (routes/tabs.ts)
  - Database: `orders` table (voided, void_reason, voided_by_user_id, voided_at)
  - Frontend: TabDetail.tsx
- **Status**: ✅ Implemented

### 5.6 Quantity Selector

- **Description**: +/- buttons to select quantity per drink
- **How it's used**: Hover on drink card shows quantity controls
- **Connections**: Frontend: TabDetail.tsx
- **Status**: ✅ Implemented

### 5.7 Multi-Currency Support

- **Description**: Accept MXN, USD, CAD
- **How it's used**: Tab currency selection at open
- **Connections**:
  - API: Exchange rates in settings
  - Database: `tabs` table (currency column)
  - Frontend: Tabs.tsx, Settings.tsx
- **Status**: ✅ Implemented

### 5.8 Promo Codes

- **Description**: Apply discount codes to tabs
- **How it's used**: Enter promo code at close
- **Connections**:
  - API: `GET /promo-codes/:code`, `PATCH /tabs/:id/apply-code` (routes/promo-codes.ts)
  - Database: `promo_codes` table
  - Frontend: TabDetail.tsx
- **Status**: ✅ Implemented

---

## 6. Shift Management

### 6.1 Shift CRUD

- **Description**: Create, read, update, delete shifts
- **How it's used**: Start/end work shifts
- **Connections**:
  - API: `GET/POST /shifts`, `POST /shifts/:id/close` (routes/shifts.ts)
  - Database: `shifts` table
  - Frontend: Dashboard.tsx, Reports.tsx
- **Status**: ✅ Implemented

### 6.2 Active Shift

- **Description**: Get currently active shift
- **How it's used**: System knows which shift is running
- **Connections**:
  - API: `GET /shifts/active` (routes/shifts.ts)
  - Frontend: Dashboard.tsx
- **Status**: ✅ Implemented

### 6.3 Shift Reports

- **Description**: End-of-night sales report
- **How it's used**: Close shift generates report
- **Connections**:
  - API: `GET /reports/end-of-night/:shiftId` (routes/shifts.ts)
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 6.4 Cash Variance Tracking

- **Description**: Compare expected vs actual cash
- **How it's used**: Close shift shows variance
- **Connections**:
  - Database: `shifts` table (expected_cash_mxn, actual_cash_mxn, cash_variance_mxn)
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 6.5 Staff Clock In/Out

- **Description**: Track staff work hours per shift
- **How it's used**: Staff clock in when starting, out when ending
- **Connections**:
  - API: `GET /staff-shifts/:shiftId`, `POST /staff-shifts/clock-in`, `POST /staff-shifts/clock-out` (routes/staff-shifts.ts)
  - Database: `staff_shifts` table
  - Frontend: Dashboard.tsx
- **Status**: ✅ Implemented

---

## 7. Period/Accounting

### 7.1 Period Management

- **Description**: Create and close accounting periods
- **How it's used**: Group shifts into periods for accounting
- **Connections**:
  - API: `GET/POST /periods`, `POST /periods/:id/close` (routes/periods.ts)
  - Database: `periods` table
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 7.2 COGS Tracking

- **Description**: Cost of Goods Sold per period
- **How it's used**: Calculate profitability
- **Connections**:
  - API: `GET /periods/:id/cogs` (routes/periods.ts)
  - Database: `cogs_entries` table
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 7.3 Period Summaries

- **Description**: Financial summary per period
- **How it's used**: Review period performance
- **Connections**: Database `periods` table
- **Status**: ✅ Implemented

---

## 8. Reporting & Analytics

### 8.1 Sales Analytics

- **Description**: Sales over time with date filtering
- **How it's used**: Reports page shows sales trends
- **Connections**:
  - API: `GET /analytics/sales` (routes/analytics.ts)
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 8.2 Quick Date Filters

- **Description**: Preset date ranges (Today, Yesterday, This Week, etc.)
- **How it's used**: Filter analytics by preset periods
- **Connections**: Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 8.3 Void Analytics

- **Description**: Track voided orders by reason, staff, drink
- **How it's used**: Reports > Stats tab shows void analysis
- **Connections**:
  - API: `GET /analytics/voids` (routes/analytics.ts)
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 8.4 Staff Performance

- **Description**: Metrics per staff member
- **How it's used**: Track bartender performance
- **Connections**:
  - API: `GET /staff-performance/:shiftId` (routes/staff-performance.ts)
  - Database: `staff_performance` table
  - Frontend: Reports.tsx (Stats tab)
- **Status**: ✅ Implemented

### 8.5 Top Sellers

- **Description**: Ranked list of best-selling drinks
- **How it's used**: End-of-night report shows top sellers
- **Connections**:
  - API: Part of shift report (routes/shifts.ts)
  - Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 8.6 Sales by Category

- **Description**: Sales breakdown by drink category
- **How it's used**: Analyze category performance
- **Connections**: Part of shift report
- **Status**: ✅ Implemented

### 8.7 Inventory Used Report

- **Description**: Track inventory consumed per shift
- **How it's used**: End-of-night shows inventory usage
- **Connections**: Part of shift report
- **Status**: ✅ Implemented

---

## 9. Settings & Administration

### 9.1 App Settings

- **Description**: Currency rates, markup defaults, bar name
- **How it's used**: Configure system in Settings
- **Connections**:
  - API: `GET/PATCH /settings` (routes/settings.ts)
  - Database: `settings` table
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 9.2 System Defaults

- **Description**: Default values for new inventory items
- **How it's used**: Set defaults in Settings > System Defaults
- **Connections**:
  - API: `GET/PATCH /settings/defaults` (routes/settings.ts)
  - Database: `settings` table (default\_\* columns)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 9.3 Tax Rates

- **Description**: Configure tax rates by category
- **How it's used**: Set beer, spirit, food tax rates
- **Connections**:
  - API: `GET /tax-rates`, `POST/PATCH /tax-rates/:category` (routes/tax-rates.ts)
  - Database: `tax_rates` table
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 9.4 Rush Events

- **Description**: Local events that drive traffic
- **How it's used**: Create/manage rush events
- **Connections**:
  - API: `GET/POST /rushes`, `DELETE /rushes/:id` (routes/rushes.ts)
  - Database: `rushes` table
  - Frontend: Dashboard.tsx
- **Status**: ✅ Implemented

### 9.5 Backup Management

- **Description**: Manual and automatic backups
- **How it's used**: Settings > Backup controls
- **Connections**:
  - API: `POST /admin/backup`, `GET /admin/backups`, `POST /admin/backups/:id/restore` (routes/admin.ts)
  - Database: backup files on filesystem
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 9.6 Database Reset

- **Description**: Reset to fresh state
- **How it's used**: Admin option to reset database
- **Connections**:
  - API: `POST /admin/reset-database` (routes/admin.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 9.7 Audit Logs

- **Description**: Track all system actions
- **How it's used**: Review history in Settings > Audit Logs
- **Connections**:
  - API: `GET /audit-logs` (routes/audit-logs.ts)
  - Database: `audit_logs` table
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

---

## 10. Export

### 10.1 Sales CSV Export

- **Description**: Export sales data to CSV
- **How it's used**: Settings > Export > Sales
- **Connections**:
  - API: `GET /export/sales` (routes/export.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 10.2 Inventory CSV Export

- **Description**: Export inventory to CSV
- **How it's used**: Settings > Export > Inventory
- **Connections**:
  - API: `GET /export/inventory` (routes/export.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 10.3 COGS CSV Export

- **Description**: Export COGS data to CSV
- **How it's used**: Settings > Export > COGS
- **Connections**:
  - API: `GET /export/cogs` (routes/export.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 10.4 Audit Logs Export

- **Description**: Export audit logs to CSV
- **How it's used**: Settings > Export > Audit Logs
- **Connections**:
  - API: `GET /export/audit-logs` (routes/export.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 10.5 Periods Export

- **Description**: Export period summaries to CSV
- **How it's used**: Settings > Export > Periods
- **Connections**:
  - API: `GET /export/periods` (routes/export.ts)
  - Frontend: Settings.tsx
- **Status**: ✅ Implemented

---

## 11. Frontend UI Features

### 11.1 Dashboard

- **Description**: Main landing page with quick stats
- **How it's used**: Shows active shift, low stock, rush events
- **Connections**: Frontend: Dashboard.tsx
- **Status**: ✅ Implemented

### 11.2 Tabs View

- **Description**: Grid of open tabs
- **How it's used**: View all open tabs, create new
- **Connections**: Frontend: Tabs.tsx
- **Status**: ✅ Implemented

### 11.3 Tab Detail

- **Description**: Individual tab with orders
- **How it's used**: Add drinks, modify, close
- **Connections**: Frontend: TabDetail.tsx
- **Status**: ✅ Implemented

### 11.4 Inventory View

- **Description**: List and manage inventory
- **How it's used**: View, edit, audit inventory
- **Connections**: Frontend: Inventory.tsx
- **Status**: ✅ Implemented

### 11.5 Drinks View

- **Description**: Menu management
- **How it's used**: Create, edit drinks
- **Connections**: Frontend: Drinks.tsx
- **Status**: ✅ Implemented

### 11.6 Reports View

- **Description**: Analytics and reporting
- **How it's used**: View sales, staff performance, voids
- **Connections**: Frontend: Reports.tsx
- **Status**: ✅ Implemented

### 11.7 Settings View

- **Description**: System configuration
- **How it's used**: All admin settings
- **Connections**: Frontend: Settings.tsx
- **Status**: ✅ Implemented

### 11.8 Collapsible Sidebar

- **Description**: Main navigation collapses to icons
- **How it's used**: Toggle sidebar with chevron button
- **Connections**: Frontend: Layout.tsx
- **Status**: ✅ Implemented

### 11.9 Inventory Filter Sidebar

- **Description**: Collapsible filter panel
- **How it's used**: Filter inventory by type, subtype, search
- **Connections**: Frontend: Inventory.tsx
- **Status**: ✅ Implemented

### 11.10 Horizontal Scroll Table

- **Description**: Scrollable inventory table
- **How it's used**: View wide tables on small screens
- **Connections**: Frontend: Inventory.tsx
- **Status**: ✅ Implemented

### 11.11 Table Column Sorting

- **Description**: Click headers to sort
- **How it's used**: Sort any column ascending/descending
- **Connections**: Frontend: Inventory.tsx
- **Status**: ✅ Implemented

---

## 12. Not Implemented / Missing Features

### 12.1 Email Notifications

- **Description**: Send reports via email
- **How it's used**: Not implemented
- **Connections**: SMTP settings exist but not wired
- **Status**: ❌ Not implemented

### 12.2 Inventory Alert Emails

- **Description**: Email low stock alerts
- **How it's used**: Configured but not triggered
- **Status**: ❌ Not implemented

### 12.3 USB Backup

- **Description**: Backup to USB drive
- **How it's used**: Setting exists but not wired
- **Status**: ❌ Not implemented

### 12.4 Recurring Rush Events

- **Description**: Weekly/monthly repeat for rushes
- **How it's used**: Fields exist (repeat_event) but recurrence logic not implemented
- **Status**: ⚠️ Partial (fields exist, logic missing)

### 12.5 Staff Break Tracking

- **Description**: Track staff breaks during shift
- **How it's used**: Database fields exist but not fully wired in UI
- **Status**: ⚠️ Partial

### 12.6 Batch/Multi-Item Auditing

- **Description**: Audit multiple items at once
- **How it's used**: Not fully implemented
- **Status**: ❌ Not implemented

### 12.7 Audit Sessions

- **Description**: Group audits into sessions
- **How it's used**: API exists but limited frontend
- **Status**: ⚠️ Partial

### 12.8 Recipe Tooltips

- **Description**: Hover to see recipe on drink card
- **How it's used**: Modal approach instead
- **Status**: ❌ Not implemented (alternative exists)

### 12.9 Keyboard Shortcuts

- **Description**: Ctrl+K for search, etc.
- **How it's used**: Ctrl+K exists, others not
- **Status**: ⚠️ Partial

---

## Summary

| Category          | Implemented | Partial | Not Implemented |
| ----------------- | ----------- | ------- | --------------- |
| Authentication    | 5           | 0       | 0               |
| User Management   | 4           | 0       | 0               |
| Inventory         | 10          | 0       | 0               |
| Drinks/Menu       | 7           | 0       | 0               |
| Tab/Order         | 7           | 0       | 0               |
| Shift             | 5           | 0       | 0               |
| Period/Accounting | 3           | 0       | 0               |
| Reporting         | 7           | 0       | 0               |
| Settings/Admin    | 7           | 0       | 0               |
| Export            | 5           | 0       | 0               |
| Frontend UI       | 11          | 0       | 0               |
| **Total**         | **71**      | **2**   | **4**           |

---

## Test Execution Notes

To test these features:

1. **Start API server**: `ADMIN_PASSWORD=your-password PORT=3000 node ./dist/index.cjs`
2. **Start frontend**: `pnpm run dev`
3. **Admin login**: Username "GUSTO", password from ADMIN_PASSWORD
4. **Create staff**: Settings > Staff > Add Staff
5. **Start shift**: Dashboard > Start Shift
6. **Add inventory**: Settings > Add Inventory
7. **Create drinks**: Drinks > Add Drink
8. **Open tab**: Tabs > New Tab
9. **Add orders**: Click drinks to add
10. **Close tab**: Tab > Close (cash/card, tip, split)
11. **Close shift**: Dashboard > End Shift
12. **View reports**: Reports page
