# ROADMAP.md - GustoPOS Feature Roadmap

> **Last Updated**: April 10, 2026  
> **Version**: 1.0

---

## Table of Contents

1. [Vision](#vision)
2. [Completed Features](#completed-features)
3. [Current Priorities](#current-priorities)
4. [Phase 1: Operational Essentials](#phase-1-operational-essentials)
5. [Phase 2: Kitchen Display System (KDS)](#phase-2-kitchen-display-system-kds)
6. [Phase 3: Advanced Reporting](#phase-3-advanced-reporting)
7. [Phase 4: Future Enhancements](#phase-4-future-enhancements)
8. [KDS Preparation Notes](#kds-preparation-notes)

---

## Vision

GustoPOS is designed for **non-standard bar operations** where flexibility is critical:

- Unknown/irregular costs (promotional items, house-made products)
- Offline-first operation
- Single-machine (desktop) primary deployment
- Maximum flexibility for unique business models

---

## Completed Features

### ✅ Core Systems (Production Ready)

| Feature                           | Status | Notes                                |
| --------------------------------- | ------ | ------------------------------------ |
| Inventory tracking (ml-precision) | ✅     | Tare/Weight/Count modes              |
| Parent/Variation system           | ✅     | Pooled inventory                     |
| Weighted average cost             | ✅     | Automatic calculation                |
| Add Inventory modal               | ✅     | Full bottles + partial + cost        |
| Drinks/Menu management            | ✅     | Recipes, categories, pricing         |
| Tabs/Orders                       | ✅     | Order placement, inventory deduction |
| Split payments                    | ✅     | Multiple payment methods             |
| PIN authentication                | ✅     | 4-digit PIN login                    |
| Role-based access                 | ✅     | Admin/manager/bartender/server       |
| Bilingual (EN/ES)                 | ✅     | Full translation                     |
| Backup system                     | ✅     | Manual + auto backup                 |
| Bulk import                       | ✅     | CSV import for inventory/drinks      |

---

## April 2026 Updates

### ✅ Critical Fixes Applied (April 11, 2026)

| Issue                      | Description                                                    | Status   |
| -------------------------- | -------------------------------------------------------------- | -------- |
| **PIN Lock Screen Stuck**  | Lock state persisted across app restarts, preventing PIN entry | ✅ Fixed |
| **PIN Pad Race Condition** | Double-submit when entering 4th digit caused failure           | ✅ Fixed |
| **Inventory Flow Broken**  | Inventory deducted immediately on order instead of tab close   | ✅ Fixed |
| **Order Quantity Bug**     | Quantity changes affected wrong stock field                    | ✅ Fixed |
| **Tab Delete Stock**       | Deleting tab didn't return reserved stock to inventory         | ✅ Fixed |

### ✅ Inventory Enhancements (April 11, 2026)

| Feature                       | Description                                          | Status  |
| ----------------------------- | ---------------------------------------------------- | ------- |
| **Container Weight Rename**   | `glassWeightG` → `containerWeightG`                  | ✅ Done |
| **Estimated Partial**         | Shows `~Xml` when weights unavailable                | ✅ Done |
| **Stock Display**             | Shows "3 full + ~375ml" format                       | ✅ Done |
| **Audit Modal Current State** | Shows full bottles + expected partial in audit modal | ✅ Done |
| **Column Sorting**            | All columns sortable (asc/desc/clear)                | ✅ Done |
| **Name Column Width**         | Reduced from 128px to 96px                           | ✅ Done |

#### Technical Changes:

1. **PIN Login Fix**
   - `store.ts`: Removed `isLocked` from persisted state
   - `App.tsx`: Reset lock state to false on every app startup
   - `PinPad.tsx`: Added `submittedRef` to prevent double-submit

2. **Inventory Flow Fix**
   - `tabs.ts`: Order now adds to `reservedStock` (× quantity)
   - `tabs.ts`: Quantity update adjusts `reservedStock` only
   - `tabs.ts`: Delete order removes from `reservedStock`
   - `tabs.ts`: Delete tab returns stock to `currentStock`
   - `tabs.ts`: Close tab finalizes: `currentStock -= reservedStock`, `reservedStock = 0`

3. **Type Fixes**
   - Fixed timestamp types in `tabs.ts` (remove `.toISOString()`)
   - Fixed `new Date()` to unix timestamp

### ✅ New Features Implemented (April 2026)

#### Void Reason Tracking

- Added `voided`, `voidReason`, `voidedByUserId`, `voidedAt` columns to `orders` table
- Delete order now marks as voided instead of removing
- Reason selection modal: "Customer changed mind", "Wrong order", "Spilled", "Comp", "Other"
- Voided orders display as crossed-out in tab with reason
- Voided orders excluded from tab total calculation

#### Language Toggles

- Added globe icon toggle to Login screen
- Added globe icon toggle to PinPad screen
- Users can switch EN/ES before entering PIN

#### System Defaults (Backend)

- Added configurable default columns to settings table:
  - `defaultAlcoholDensity` (default: 0.94)
  - `defaultServingSizeMl` (default: 44.36)
  - `defaultBottleSizeMl` (default: 750)
  - `defaultUnitsPerCase` (default: 1)
  - `defaultLowStockThreshold` (default: 0)
  - `defaultTrackingMode` (default: "auto")
  - `defaultAuditMethod` (default: "auto")
  - `varianceWarningThreshold` (default: 5.0)
- New API endpoints: `GET /api/settings/defaults`, `PATCH /api/settings/defaults`

#### Audit Age Stats (Backend)

- New endpoint: `GET /api/inventory/items/audit-age-stats`
- Returns: items never audited, items overdue (>4 days), shouldAlert flag
- Used by Dashboard for audit reminder alerts

---

## Current Priorities

### For Desktop App Version 1.x

1. **Shift-End Reports** - Cash reconciliation ✅ (Implemented)
2. ~~**Void Reason Tracking**~~ - ✅ Implemented (April 2026)
3. ~~**Language Toggles**~~ - ✅ Implemented on Login & PinPad (April 2026)
4. ~~**System Defaults (API)**~~ - ✅ Implemented (April 2026)
5. **Offline Indicator** - User awareness of connection status
6. **Tab Detail Improvements** - Better order management
7. ~~**PIN Lock Screen Fix**~~ - ✅ Completed
8. ~~**Inventory Flow Fix**~~ - ✅ Completed
9. ~~**Bilingual Support**~~ - ✅ Testing phase (see below)
10. ~~**Batch Inventory Audits**~~ - ✅ Design phase (see below)
11. ~~**Configurable System Defaults**~~ - ✅ Design phase (see below)

### New Features in Development/Testing

#### Bilingual Support (Testing)

- Add language toggle to login and PIN screens
- Staff default language preference
- Full EN/ES translation coverage
- Reference: `docs/TEST_PROTOCOL.md` Part 16

#### Batch Inventory Audits (Design)

- Multi-item audit sessions from Settings → Audit Logs
- Variance highlighting with color coding
- Reference: `docs/INVENTORY_AUDIT_SYSTEM.md`

#### Configurable System Defaults (Design)

- Admin-only Settings section for hardcoded values
- Default density, serving size, markup, etc.
- Audit trail for all changes
- Reference: `docs/SYSTEM_DEFAULTS.md`

---

## Phase 1: Operational Essentials

_Priority: HIGH - Expected in next releases_

### 1.1 Shift-End Reports

**Description**: End-of-shift cash reconciliation

**Features**:

- System total vs. cash counted input
- Variance calculation
- Shift summary (drinks sold, revenue)
- Staff member attribution
- Archive/shift history

**Status**: Not started

---

### 1.2 Void Reason Tracking

**Description**: Required reason when deleting orders

**Features**:

- Pre-defined reasons:
  - Customer changed mind
  - Wrong order
  - Bar/spilled
  - Comp
  - Other
- Audit log inclusion
- Reporting by reason

**Status**: Not started

---

### 1.3 Offline Indicator

**Description**: Visual indicator for offline status

**Features**:

- Status bar indicator
- Color changes (green=online, yellow=offline)
- Clear messaging

**Status**: Not started

---

### 1.4 Tab Detail Improvements

**Description**: Enhanced tab management

**Features**:

- Order filtering (drinks only, food only)
- Order modification notes display
- Void order history per tab

**Status**: Not started

---

## Phase 2: Kitchen Display System (KDS)

_Priority: HIGH - For future iteration_

### 2.1 KDS Screen Display

**Description**: Visual display for bar staff showing incoming orders

**Features**:

- Order queue display
- New order notifications
- Timer for order age
- Mark orders as complete
- Category filtering

**Technical Prep Notes** (see below)

**Status**: Planned

---

### 2.2 PWA Support

**Description**: Progressive Web App for tablet displays

**Features**:

- Install as app on iPad/tablet
- Touch-friendly interface
- Works as KDS display

**Status**: Planned

---

## Phase 3: Advanced Reporting

_Priority: MEDIUM_

### 3.1 Daily Sales Summary

**Description**: End-of-day revenue report

**Features**:

- Total revenue
- Drinks sold count
- Top-selling items
- Payment method breakdown
- Hourly breakdown

**Status**: Not started

---

### 3.2 Staff Performance Reports

**Description**: Employee performance metrics

**Features**:

- Sales per shift
- Drinks served per hour
- Tab averages
- Comparison to previous periods

**Status**: Not started

---

### 3.3 Inventory Usage Report

**Description**: What was used vs. what was sold

**Features**:

- Pour cost tracking
- Waste detection
- Variance analysis
- Recommendation engine

**Status**: Not started

---

### 3.4 Cost Analysis Reports

**Description**: Profitability insights

**Features**:

- Cost per drink over time
- Margin tracking
- Price optimization suggestions

**Status**: Not started

---

## Phase 4: Future Enhancements

_Priority: LOW_

### 4.1 Drink Variants

**Description**: Same drink, different sizes/prices

**Example**:

- Tequila Shot (1oz): $8
- Tequila Double (2oz): $14
- Tequila Top-shelf (2oz): $18

**Status**: Not started

---

### 4.2 Order Modifications

**Description**: Drink modifications as first-class options

**Example**:

- Extra ice
- No ice
- Extra lime
- Splash of soda

**Status**: Not started

---

### 4.3 Customer CRM

**Description**: Track regular customers

**Features**:

- Customer profiles
- Order history
- Preferences
- Loyalty tracking

**Status**: Not started

---

### 4.4 Multi-Location Support

**Description**: Multiple bars, shared data

**Features**:

- Location management
- Transfer inventory between locations
- Consolidated reporting

**Status**: Not started (future consideration)

---

### 4.5 Printer Integration

**Description**: Receipt/label printing

**Features**:

- ESC/POS thermal printer support
- Receipt printing
- Kitchen ticket printing

**Status**: Not started

---

## KDS Preparation Notes

### Technical Approach

**Option Selected**: Simple screen display (not full printer integration)

### Architecture for KDS

```
┌─────────────────────────────────────────────────────────┐
│                    DESKTOP APP                          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ POS UI   │    │  KDS UI  │    │  PWA UI  │         │
│  │ (Local)  │    │ (Local)  │    │ (Tablet) │         │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘         │
│       │               │               │                 │
│       └───────────────┼───────────────┘                 │
│                       ▼                                 │
│              ┌────────────────┐                         │
│              │  API Server   │                         │
│              └───────┬────────┘                         │
│                      ▼                                 │
│              ┌────────────────┐                         │
│              │    SQLite      │                         │
│              └────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation Notes

1. **Local KDS**: Single-page view showing active orders
2. **PWA KDS**: Could be accessed via local network IP
3. **Order Events**: Use existing tab/order events
4. **Real-time**: Polling or WebSocket for updates
5. **No Internet**: Works completely offline

### Database Tables Needed

- `kds_sessions` - Track active KDS displays
- `kds_queue` - Orders pending on KDS

### API Endpoints Needed

- `GET /api/kds/queue` - Get active order queue
- `POST /api/kds/orders/:id/complete` - Mark complete
- `POST /api/kds/bump` - Send to KDS

---

## Version History

| Version | Date       | Milestone                                          |
| ------- | ---------- | -------------------------------------------------- |
| 0.1.0   | April 2026 | Initial production release - Core systems complete |
| 1.0.0   | Future     | Operational essentials (Phase 1)                   |
| 2.0.0   | Future     | KDS (Phase 2)                                      |
| 3.0.0   | Future     | Advanced reporting (Phase 3)                       |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [USER_GUIDE.md](./USER_GUIDE.md) - Staff operations
- [OFFLINE_DESKTOP_GUIDE.md](./OFFLINE_DESKTOP_GUIDE.md) - App guide
- [docs/INVENTORY_MANUAL.md](./docs/INVENTORY_MANUAL.md) - Inventory details
