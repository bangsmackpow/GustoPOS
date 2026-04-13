# Configurable System Defaults - Design Document

**Last Updated**: April 11, 2026  
**Version**: 1.1

---

## Implementation Status

### ✅ Backend Complete (April 2026)

The backend API for system defaults is now implemented:

| Endpoint                 | Method | Status                      |
| ------------------------ | ------ | --------------------------- |
| `/api/settings/defaults` | GET    | ✅ Implemented              |
| `/api/settings/defaults` | PATCH  | ✅ Implemented (admin only) |

### ❌ Frontend UI Pending

The Settings page UI section for System Defaults has not yet been implemented. The backend is complete and ready for frontend integration.

---

## Overview

This document outlines the design for a "System Defaults" section in Settings that allows administrators to change hardcoded values throughout the application. These are arbitrary defaults that were previously hardcoded and are now made configurable.

---

## Current State

### Hardcoded Values in Code

| Value                          | Location                        | Current Default |
| ------------------------------ | ------------------------------- | --------------- |
| Default alcohol density        | `inventory.ts`, `Inventory.tsx` | 0.94            |
| Default serving size (spirits) | Multiple places                 | 44.36ml (1.5oz) |
| Default serving size (mixers)  | Multiple places                 | 44.36ml         |
| Default bottle size            | Various                         | 750ml           |
| Default base unit              | Schema                          | "ml"            |
| Default markup factor          | Schema                          | 3.0             |
| Default units per case (beer)  | Schema                          | 24              |
| Default units per case (merch) | Schema                          | 1               |
| Default low stock threshold    | Schema                          | 1               |
| Default tracking mode          | Schema                          | "auto"          |
| Low stock alert method         | Schema                          | "manual"        |

### Issues

- Different defaults in different places
- No single place to change all defaults
- Hard to maintain consistency
- Users cannot customize to their preferences

---

## Proposed Solution

### New Settings Section

Located at bottom of Settings page:

```
System Defaults (Admin Only)
├── Alcohol & Spirits
│   ├── Default Density: [0.94]
│   ├── Default Serving Size: [44.36] ml
│   └── Default Bottle Size: [750] ml
├── Beer & Packaging
│   ├── Default Units Per Case: [24]
│   └── Default Container Size: [355] ml
├── Merchandise
│   └── Default Units Per Case: [1]
├── Pricing
│   ├── Default Markup Factor: [3.0]
│   └── Default Tax Rate: [16]%
├── Inventory Alerts
│   ├── Default Low Stock Threshold: [1]
│   ├── Alert Method: [Manual ▼]
│   └── Variance Warning Threshold: [5]%
├── Tracking
│   ├── Default Tracking Mode: [Auto ▼]
│   └── Default Base Unit: [ml ▼]
└── [Save Changes] [Reset to Defaults]
```

---

## Database Schema

### New Settings Table Entries

```sql
-- Add to settings table or create new system_defaults table
system_defaults (
  -- Alcohol defaults
  default_alcohol_density REAL DEFAULT 0.94,
  default_serving_size_ml REAL DEFAULT 44.36,
  default_bottle_size_ml REAL DEFAULT 750,

  -- Beer defaults
  default_beer_units_per_case INTEGER DEFAULT 24,
  default_beer_container_size_ml REAL DEFAULT 355,

  -- Merchandise defaults
  default_merch_units_per_case INTEGER DEFAULT 1,

  -- Pricing defaults
  default_markup_factor REAL DEFAULT 3.0,
  default_tax_rate REAL DEFAULT 16.0,

  -- Inventory defaults
  default_low_stock_threshold INTEGER DEFAULT 1,
  default_low_stock_method TEXT DEFAULT 'manual',
  variance_warning_threshold REAL DEFAULT 5.0,

  -- Tracking defaults
  default_tracking_mode TEXT DEFAULT 'auto',
  default_base_unit TEXT DEFAULT 'ml',

  -- Timestamps
  updated_at INTEGER,
  updated_by_user_id TEXT
);
```

---

## Implementation Strategy

### 1. Settings Storage

Option A: Add columns to existing `settings` table

- Pros: Single table, existing infrastructure
- Cons: Bloats settings table

Option B: New `system_defaults` table

- Pros: Clean separation, easier to manage
- Cons: New table, additional query

**Recommendation**: Option A - extend existing settings table for simplicity

### 2. API Endpoints

- `GET /api/settings/defaults` - Get all system defaults
- `PATCH /api/settings/defaults` - Update defaults (admin only)

### 3. Frontend Implementation

- New "System Defaults" section at bottom of Settings
- Admin-only access (check user role)
- Form with labeled inputs for each default
- "Reset to Defaults" button restores original values
- Confirmation dialog before saving

### 4. Usage in Code

Replace hardcoded values with settings lookups:

```typescript
// Before
const density = item.density || 0.94;
const servingSize = item.servingSize || 44.36;

// After
const density = item.density || settings.defaultAlcoholDensity;
const servingSize = item.servingSize || settings.defaultServingSizeMl;
```

---

## Suggested Additional Configurable Values

### Potential Future Defaults

| Category             | Default             | Rationale                         |
| -------------------- | ------------------- | --------------------------------- |
| Currency             | MXN                 | Default currency for new installs |
| Language             | en                  | Default UI language               |
| Timezone             | America/Mexico_City | Default timezone                  |
| Date Format          | DD/MM/YYYY          | Regional preference               |
| Receipt Printer      | None                | Printer name                      |
| Receipt Footer       | "Thank you!"        | Custom message                    |
| Minimum order amount | 0                   | Minimum tab total                 |
| Tip suggestions      | [10, 15, 20, 25]    | Tip percentage options            |

---

## Access Control

- **Admin Only**: All system defaults require admin role
- **Audit Trail**: Log all default changes with user, timestamp, old/new values
- **Confirmation**: Require password confirmation to change sensitive defaults

---

## Testing Protocol

### Test Cases

| ID   | Test           | Steps                      | Expected Result                 |
| ---- | -------------- | -------------------------- | ------------------------------- |
| SD-1 | View defaults  | Open Settings as admin     | System Defaults section visible |
| SD-2 | View defaults  | Open Settings as staff     | System Defaults section hidden  |
| SD-3 | Change default | Enter new default, Save    | Value updated, success message  |
| SD-4 | Reset defaults | Click Reset                | All values restored to original |
| SD-5 | New inventory  | Create item with defaults  | Uses new default values         |
| SD-6 | Audit log      | Change default, check logs | Change recorded in event_logs   |

### Edge Cases

| Scenario              | Expected Behavior                  |
| --------------------- | ---------------------------------- |
| Invalid value entered | Validation error, prevent save     |
| Network error on save | Show error, retain unsaved changes |
| Concurrent edit       | Last write wins, show warning      |

---

## Related Documentation

- `docs/TEST_PROTOCOL.md` - Updated with defaults test cases
- `docs/CALCULATIONS.md` - How defaults affect calculations
- `ARCHITECTURE.md` - Settings architecture
