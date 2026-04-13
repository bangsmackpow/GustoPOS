# GustoPOS Inventory & Sales Tracking Test Protocol

**Last Updated**: April 12, 2026  
**Version**: 1.2

---

## Overview

This document provides a comprehensive testing protocol for the GustoPOS Inventory and Sales Tracking systems. Each field, workflow, and tracking mechanism is documented with test cases, expected results, verification steps, and failure diagnostics.

---

## Table of Contents

1. [Inventory Items Testing](#part-1-inventory-items-testing)
2. [Inventory Audits Testing](#part-2-inventory-audits-testing)
3. [Sales Tracking & Tab Lifecycle](#part-3-sales-tracking--tab-lifecycle-testing)
4. [Bulk Import Testing](#part-4-bulk-import-testing)
5. [Event Log / Audit Trail](#part-5-event-log--audit-trail-testing)
6. [Integration Tests](#part-6-integration-tests)
7. [Edge Cases & Error Handling](#part-7-edge-cases--error-handling)
8. [Data Validation Rules](#part-8-data-validation-rules)
9. [Performance & Load Testing](#part-9-performance--load-testing)
10. [Database State Verification](#part-10-database-state-verification)
11. [Regression Testing Checklist](#part-11-regression-testing-checklist)
12. [Test Execution Order](#part-12-test-execution-order)
13. [Test Environment Setup](#part-13-test-environment-setup)
14. [Reporting Verification](#part-14-reporting-verification)
15. [Test Failure Diagnostics](#part-15-test-failure-diagnostics)

---

## Part 1: Inventory Items Testing

### 1.1 Core Identification Fields

| Field     | Type   | Description                 | Test Case                                           |
| --------- | ------ | --------------------------- | --------------------------------------------------- |
| `id`      | UUID   | Primary key, auto-generated | Verify unique on creation                           |
| `name`    | String | Item name (required)        | Create with valid name, empty name fails            |
| `nameEs`  | String | Spanish name                | Verify Spanish translation displays correctly       |
| `type`    | String | Item category (required)    | Valid: spirit, mixer, beer, ingredient, merch, misc |
| `subtype` | String | Additional classification   | Optional, stores variety/style                      |

**Test Steps**:

1. Create inventory item with all identification fields
2. Verify fields persist in database
3. Verify fields display correctly in UI (English and Spanish)
4. Test update of each field individually

---

### 1.2 Measurement System Fields

| Field            | Type   | Default | Test Case                         |
| ---------------- | ------ | ------- | --------------------------------- |
| `baseUnit`       | String | "ml"    | Test "ml", "oz", "units"          |
| `baseUnitAmount` | Number | 750     | Test 0, positive, negative values |
| `bulkUnit`       | String | null    | Verify optional field             |
| `servingSize`    | Number | 44.36   | Test default pour size            |
| `servingUnit`    | String | null    | Verify optional                   |
| `bottleSizeMl`   | Number | null    | Test container size in ml         |

---

### 1.3 Weight & Density Fields

| Field               | Type   | Default | Test Case                 |
| ------------------- | ------ | ------- | ------------------------- |
| `glassWeightG`      | Number | null    | Empty bottle weight       |
| `fullBottleWeightG` | Number | null    | Full bottle weight        |
| `density`           | Number | 0.94    | Alcohol density           |
| `alcoholDensity`    | Number | 0.94    | Alternative density field |

**Test Steps**:

1. Enter glass weight: 350g
2. Enter full bottle weight: 1100g
3. Calculate: liquid weight = 1100 - 350 = 750g
4. Enter bottle size: 750ml
5. Calculate: density = 750g / 750ml = 1.0
6. Verify calculations match manual computation

---

### 1.4 Cost & Pricing Fields

| Field                | Type   | Default | Test Case                 |
| -------------------- | ------ | ------- | ------------------------- |
| `bulkCost`           | Number | null    | Legacy bulk cost          |
| `orderCost`          | Number | 0       | Purchase cost per order   |
| `markupFactor`       | Number | 3.0     | Price markup multiplier   |
| `singleServingPrice` | Number | null    | Shot/single serving price |

**Test Steps**:

1. Set order cost: $450 for 750ml bottle
2. Calculate: $450 / 750ml = $0.60/ml
3. Set serving size: 44.36ml (1.5oz)
4. Calculate: $0.60 × 44.36 = $26.62 cost per serving
5. Apply markup factor 3.0: $26.62 × 3 = $79.86 suggested price

---

### 1.5 Menu & Sales Fields

| Field                | Type    | Default | Test Case                |
| -------------------- | ------- | ------- | ------------------------ |
| `isOnMenu`           | Integer | 1       | Available for sale       |
| `sellSingleServing`  | Integer | 0       | Sell as single shot      |
| `singleServingPrice` | Number  | null    | Price for single serving |
| `isDeleted`          | Integer | 0       | Soft delete flag         |

---

### 1.6 Low Stock Alert Fields

| Field                     | Type   | Default  | Test Case           |
| ------------------------- | ------ | -------- | ------------------- |
| `lowStockMethod`          | String | "manual" | Alert method        |
| `lowStockManualThreshold` | Number | null     | Manual threshold    |
| `lowStockThreshold`       | Number | 0        | Minimum stock alert |

---

### 1.7 Stock Tracking Fields (CRITICAL)

| Field            | Type   | Default | Test Case             |
| ---------------- | ------ | ------- | --------------------- |
| `currentBulk`    | Number | 0       | Full bottles/cases    |
| `currentPartial` | Number | 0       | Open bottles/units    |
| `currentStock`   | Number | 0       | Total available       |
| `reservedStock`  | Number | 0       | Reserved by open tabs |

**Test Steps - Stock Initialization**:

1. Create item with baseUnitAmount = 750ml
2. Enter currentBulk = 5 (5 full bottles)
3. Enter currentPartial = 375 (half bottle)
4. Calculate: 5 × 750 + 375 = 4125ml
5. Verify currentStock = 4125

---

### 1.8 Beer/Collection Specific Fields

| Field          | Type    | Default | Test Case      |
| -------------- | ------- | ------- | -------------- |
| `unitsPerCase` | Integer | 1       | Units per case |

---

### 1.9 Audit Tracking Fields

| Field                 | Type           | Test Case               |
| --------------------- | -------------- | ----------------------- |
| `lastAuditedAt`       | Unix timestamp | Verify updates on audit |
| `lastAuditedByUserId` | User reference | Track who audited       |
| `auditMethod`         | String         | "auto" or "manual"      |

---

### 1.10 Tracking Mode Fields

| Field          | Type   | Default | Test Case            |
| -------------- | ------ | ------- | -------------------- |
| `trackingMode` | String | "auto"  | auto/pool/collection |

---

### 1.11 Timestamps

| Field       | Type           | Test Case          |
| ----------- | -------------- | ------------------ |
| `createdAt` | Unix timestamp | Verify on creation |
| `updatedAt` | Unix timestamp | Verify updates     |

---

## Part 2: Inventory Audits Testing

### 2.1 Audit Record Fields

| Field             | Type           | Description           | Test Case             |
| ----------------- | -------------- | --------------------- | --------------------- |
| `id`              | UUID           | Primary key           | Verify unique         |
| `itemId`          | UUID           | Reference to item     | Verify link           |
| `auditDate`       | Unix timestamp | When audited          | Verify timestamp      |
| `reportedBulk`    | Number         | Full bottles counted  | Input vs system       |
| `reportedPartial` | Number         | Partial counted       | Input vs system       |
| `reportedTotal`   | Number         | Total calculated      | Server calculates     |
| `expectedTotal`   | Number         | Previous system stock | Server calculates     |
| `systemStock`     | Number         | Current system stock  | From DB               |
| `physicalCount`   | Number         | What was counted      | Same as reportedTotal |
| `variance`        | Number         | Difference            | Server calculates     |
| `variancePercent` | Number         | % difference          | Server calculates     |

### 2.2 Audit API Flow (Server-Side Calculation)

**IMPORTANT**: As of April 12, 2026, the audit endpoint calculates variance server-side.

**Request Format** (Simplified):

```json
POST /api/inventory/items/{itemId}/audit
{
  "reportedBulk": 5,
  "reportedPartial": 400,
  "auditEntryMethod": "bulk_partial",
  "varianceReason": "routine",
  "auditedByUserId": "user-123"
}
```

**Server-Side Calculations**:

```
expectedTotal = currentStock (from DB)
reportedTotal = (reportedBulk × baseUnitAmount) + reportedPartial
variance = reportedTotal - expectedTotal
variancePercent = (variance / expectedTotal) × 100  (if expectedTotal > 0)
```

**Response** includes all calculated values for verification.

### 2.3 Audit Test Case

```
Initial State:
- Item: Test Spirit (baseUnitAmount = 750ml)
- currentStock = 5000ml
- currentBulk = 6
- currentPartial = 500

Action:
- POST /api/inventory/items/{id}/audit
- { "reportedBulk": 5, "reportedPartial": 400 }

Expected Result:
- reportedTotal = (5 × 750) + 400 = 4100ml
- expectedTotal = 5000ml
- variance = 4100 - 5000 = -900ml
- variancePercent = (-900 / 5000) × 100 = -18%
- Item updated: currentBulk = 5, currentPartial = 400, currentStock = 4100
```

---

### 2.4 Batch Audit System Testing (New April 2026)

The batch audit system allows auditing multiple inventory items at once, organized by type (spirits, beer, mixers, etc.).

#### 2.4.1 Audit Sessions Table

| Field               | Type           | Description                   | Test Case             |
| ------------------- | -------------- | ----------------------------- | --------------------- |
| `id`                | UUID           | Primary key                   | Verify unique         |
| `status`            | String         | in_progress / completed       | State transitions     |
| `typeFilter`        | String         | spirit/beer/mixer/etc or null | What category audited |
| `startedByUserId`   | UUID           | Who started session           | Track                 |
| `completedByUserId` | UUID           | Who completed session         | Track                 |
| `startedAt`         | Unix timestamp | When session started          | Verify timestamp      |
| `completedAt`       | Unix timestamp | When session completed        | Verify timestamp      |
| `itemCount`         | Number         | Total items in session        | Should match filter   |
| `completedCount`    | Number         | Items processed (submitted)   | After submit          |

#### 2.4.2 Batch Audit API Endpoints

| Endpoint                                   | Method | Description              |
| ------------------------------------------ | ------ | ------------------------ |
| `/api/inventory/audit-sessions`            | POST   | Create new audit session |
| `/api/inventory/audit-sessions/:id`        | GET    | Get session details      |
| `/api/inventory/audit-sessions/:id/items`  | GET    | Get items to audit       |
| `/api/inventory/audit-sessions/:id/submit` | POST   | Submit all audit counts  |

#### 2.4.3 Batch Audit Workflow Test Cases

##### Test Case 2.4.3.1: Create Audit Session (All Items)

```
Action:
- POST /api/inventory/audit-sessions
- { "typeFilter": "all", "startedByUserId": "user-123" }

Expected Result:
- Session created with status = "in_progress"
- typeFilter = null (or "all")
- itemCount = total non-deleted inventory items
- startedAt = current timestamp
- Returns session object with id
```

##### Test Case 2.4.3.2: Create Audit Session (By Type)

```
Action:
- POST /api/inventory/audit-sessions
- { "typeFilter": "spirit", "startedByUserId": "user-123" }

Expected Result:
- Session created with typeFilter = "spirit"
- itemCount = count of items where type = "spirit"
- Only spirit items appear in /items endpoint
```

##### Test Case 2.4.3.3: Get Session Items

```
Action:
- GET /api/inventory/audit-sessions/{sessionId}/items

Expected Result:
- Returns array of inventory items filtered by session's typeFilter
- Each item includes: id, name, currentBulk, currentPartial, currentStock, baseUnitAmount
- Items sorted alphabetically by name
```

##### Test Case 2.4.3.4: Submit Batch Audit (Basic)

```
Initial State:
- Session created for "spirit" type with 3 items:
  - Vodka: currentBulk=10, currentPartial=200, currentStock=7700ml (baseUnitAmount=750)
  - Whiskey: currentBulk=5, currentPartial=0, currentStock=3750ml
  - Gin: currentBulk=8, currentPartial=150, currentStock=6150ml

Action:
- POST /api/inventory/audit-sessions/{sessionId}/submit
- {
    "items": [
      { "itemId": "vodka-id", "reportedBulk": 9, "reportedPartial": 200 },
      { "itemId": "whiskey-id", "reportedBulk": 5, "reportedPartial": 100 },
      { "itemId": "gin-id", "reportedBulk": 8, "reportedPartial": 150 }
    ],
    "completedByUserId": "user-123"
  }

Expected Result:
- Session status = "completed"
- completedAt = current timestamp
- completedByUserId = "user-123"
- completedCount = 3

For Vodka:
- reportedTotal = (9 × 750) + 200 = 6950ml
- expectedTotal = 7700ml
- variance = -750ml
- variancePercent = -9.74%
- currentBulk = 9, currentPartial = 200, currentStock = 6950
- Audit record created in inventory_audits table

For Whiskey:
- reportedTotal = (5 × 750) + 100 = 3850ml
- expectedTotal = 3750ml
- variance = +100ml
- variancePercent = +2.67%
- currentBulk = 5, currentPartial = 100, currentStock = 3850

For Gin:
- reportedTotal = (8 × 750) + 150 = 6150ml
- expectedTotal = 6150ml
- variance = 0ml
- variancePercent = 0%
```

##### Test Case 2.4.3.5: Submit with Significant Variance

```
Initial State:
- Tequila: currentStock = 3000ml

Action:
- Submit audit with reportedTotal = 1500ml (significant variance)

Expected Result:
- variance = -1500ml
- variancePercent = -50%
- Audit record created with variancePercent > 5%
- System flags as significant variance
```

##### Test Case 2.4.3.6: Submit to Already Completed Session

```
Initial State:
- Session already completed

Action:
- POST /api/inventory/audit-sessions/{sessionId}/submit

Expected Result:
- Returns 400 error: "Session already completed"
- No changes made
```

##### Test Case 2.4.3.7: Batch Audit Variance Summary Display

```
Initial State:
- Session with 3 items, all with variances

Action:
- View batch audit page with entered counts

Expected Result:
- Each row shows real-time variance calculation:
  - Green text: variance > 0 (overstock)
  - Red text: variance < 0 (understock)
  - Yellow + warning icon: variance > 5% (significant)
  - Dashed line: variance = 0 (exact match)
```

#### 2.4.4 Frontend Batch Audit UI Tests

##### Test Case 2.4.4.1: Settings Page Entry Point

```
Action:
1. Navigate to Settings page
2. Locate "Audit Logs" section

Expected Result:
- "Individual Audit" button present (links to /inventory)
- "Batch Audit" dropdown button present with chevron icon
- Dropdown shows options: All Items, Spirits, Beer, Mixers, Ingredients
- Clicking option starts audit session and redirects
```

##### Test Case 2.4.4.2: Batch Audit Page Layout

```
Action:
- Navigate to /settings/batch-audit/{sessionId}

Expected Result:
- Header shows: "Batch Audit: [Type]" (e.g., "Spirits")
- Progress indicator: "X of Y items entered"
- Filter sidebar (collapsible) with search input
- Main table with columns:
  - Name (sortable)
  - Container
  - Current Sealed (read-only)
  - Current Partial (read-only)
  - Sealed (editable input)
  - Partial (editable input)
  - Variance (real-time calculation)
- Footer shows item count and submit instructions
```

##### Test Case 2.4.4.3: Variance Real-Time Calculation

```
Action:
1. Enter new sealed count: 5 (was 6)
2. Enter new partial: 200 (was 300)

Expected Result:
- Variance updates immediately as user types
- Shows: "+125ml (+5.0%)" or similar
- Color changes based on variance direction
```

##### Test Case 2.4.4.4: Submit Batch Audit

```
Action:
1. Enter counts for all items
2. Click "Submit Audit" button

Expected Result:
- Loading state shown
- Success toast: "X item audits recorded successfully"
- Redirects to Settings page
- Inventory items updated with new counts
- Audit records created for each item
```

##### Test Case 2.4.4.5: Cancel Batch Audit

```
Action:
1. Click "Cancel" button

Expected Result:
- Redirects to Settings page
- No changes made to inventory
- Session remains in_progress (or can be abandoned)
```

#### 2.4.5 Audit Session History Tests

##### Test Case 2.4.5.1: View Audit History

```
Action:
- Navigate to Settings > Audit Logs section
- View existing audit history

Expected Result:
- Batch audits appear with:
  - "batch_audit" action type
  - Session ID or type filter in entity
  - Item count in metadata
- Individual audits appear with "audit" action type
```

#### 2.4.6 Pool vs Collection Tracking in Audits

##### Test Case 2.4.6.1: Pool Item Audit (Spirit/Mixer)

```
Initial State:
- Vodka (type=spirit, trackingMode=auto)
- baseUnitAmount = 750ml
- currentBulk = 5, currentPartial = 350ml

Action:
- Audit with reportedBulk=4, reportedPartial=400

Expected Result:
- Container column shows "750ml"
- Partial column shows "ml" (or grams if weight entered)
- Variance calculated in ml
```

##### Test Case 2.4.6.2: Collection Item Audit (Beer)

```
Initial State:
- Corona (type=beer, trackingMode=auto)
- baseUnitAmount = 1 (unit)
- currentBulk = 10, currentPartial = 0

Action:
- Audit with reportedBulk=8, reportedPartial=0

Expected Result:
- Container column shows "1 units"
- Partial column shows "units"
- Variance calculated in units
```

---

## Part 3: Sales Tracking & Tab Lifecycle Testing

### 3.1 Tabs Table Fields

| Field           | Type           | Description    | Test Case            |
| --------------- | -------------- | -------------- | -------------------- |
| `id`            | UUID           | Primary key    | Verify unique        |
| `nickname`      | String         | Tab name/table | User input           |
| `status`        | String         | open/closed    | Verify state changes |
| `staffUserId`   | UUID           | Who opened     | Track                |
| `shiftId`       | UUID           | Link to shift  | Optional             |
| `totalMxn`      | Number         | Tab total      | Sum of orders        |
| `tipMxn`        | Number         | Tip amount     | User input           |
| `paymentMethod` | String         | cash/card/etc  | On close             |
| `closedAt`      | Unix timestamp | When closed    | Auto                 |

---

### 3.2 Orders Table Fields

| Field            | Type    | Description    | Test Case     |
| ---------------- | ------- | -------------- | ------------- |
| `id`             | UUID    | Primary key    | Verify unique |
| `tabId`          | UUID    | Parent tab     | Link          |
| `drinkId`        | UUID    | Drink ordered  | Reference     |
| `quantity`       | Integer | Number ordered | 1, 2, 3...    |
| `unitPriceMxn`   | Number  | Price per unit | From drink    |
| `voided`         | Integer | 0/1 void flag  | Soft delete   |
| `voidReason`     | String  | Reason if void | Validation    |
| `voidedByUserId` | UUID    | Who voided     | Track         |
| `voidedAt`       | Unix ts | When voided    | Timestamp     |

---

### 3.2.1 Void Order Tests (CRITICAL - April 2026)

Voided orders should NOT reduce inventory or appear in reports.

#### Test Case 3.2.1.1: Void Order Does Not Reduce Inventory

```
Initial State:
- Tequila: currentStock = 3000ml, reservedStock = 0

Action:
1. Add 2 margaritas to tab (uses 88.72ml tequila)
2. reservedStock = 88.72ml
3. Close tab - currentStock = 2911.28ml
4. Void one margarita order

Expected Result:
- Order marked as voided = 1
- currentStock = 2911.28ml (unchanged - already deducted on close)
- voidReason = user-selected reason
- voidedByUserId = current user
- voidedAt = timestamp
```

#### Test Case 3.2.1.2: Void Order Before Tab Close

```
Initial State:
- Tequila: currentStock = 3000ml, reservedStock = 0

Action:
1. Add 2 margaritas to tab
2. reservedStock = 88.72ml, currentStock = 3000ml (unchanged)
3. Void one margarita BEFORE closing tab

Expected Result:
- reservedStock = 44.36ml (reduced by 44.36ml)
- currentStock = 3000ml (unchanged)
- Order marked as voided

Action:
4. Close tab

Expected Result:
- currentStock = 2955.64ml (3000 - 44.36)
- NOT 2911.28ml (which would be if voided order was included)
```

#### Test Case 3.2.1.3: Void Order Not in Shift Report

```
Initial State:
- Tab with 3 orders (2 valid, 1 voided)

Action:
- Generate shift end report

Expected Result:
- Report shows only 2 orders
- voided order excluded from:
  - Total sales
  - Revenue calculations
  - Inventory usage calculations
  - Top sellers list
```

#### Test Case 3.2.1.4: Void Reason Required

```
Action:
- Attempt to void order without selecting reason

Expected Result:
- Error or validation message shown
- Order NOT voided
- Reason must be selected from: customer_changed_mind, wrong_order, spilled, comp, other
```

---

### 3.3 Inventory Flow Test Cases (CRITICAL)

#### Test Case 3.3.1: Add Order to Tab

```
Initial State:
- Tequila: currentStock = 3000ml, reservedStock = 0

Action:
- Add 2 margaritas (each uses 44.36ml tequila)

Expected Result:
- reservedStock = 2 × 44.36 = 88.72ml
- currentStock = 3000ml (unchanged)
- Orders table has 2 order records
```

#### Test Case 3.3.2: Delete Order from Tab

```
Initial State:
- Tequila: currentStock = 3000ml, reservedStock = 88.72ml

Action:
- Delete 1 margarita order

Expected Result:
- reservedStock = 88.72 - 44.36 = 44.36ml
- currentStock = 3000ml (still unchanged)
```

#### Test Case 3.3.3: Close Tab

```
Initial State:
- Tequila: currentStock = 2911.28ml, reservedStock = 133.08ml

Action:
- Close tab with payment

Expected Result:
- currentStock = 2911.28 - 133.08 = 2778.20ml
- reservedStock = 0
- tab.status = closed
```

---

## Part 4: Bulk Import Testing

### 4.1 Import Fields & Validation

| Field            | Validation       | Test Case           |
| ---------------- | ---------------- | ------------------- |
| `name`           | Required, string | Empty fails         |
| `type`           | Default "spirit" | Invalid fails       |
| `baseUnitAmount` | Default 750      | NaN→750, negative→0 |
| `orderCost`      | Default 0        | NaN→0, negative→0   |
| `trackingMode`   | Default "auto"   | Valid enum          |

### 4.2 Import Strategies

| Strategy | Behavior                 |
| -------- | ------------------------ |
| update   | Update existing items    |
| merge    | Keep existing, merge new |
| skip     | Skip existing items      |
| replace  | Delete all, import fresh |

---

## Part 5: Event Log / Audit Trail Testing

| Action           | Entity         | Test Case                   |
| ---------------- | -------------- | --------------------------- |
| inventory_update | inventory_item | Verify field changes logged |
| tab_close        | tab            | Verify close logged         |
| order_create     | order          | Verify order logged         |

---

## Part 6: Integration Tests

### Complete Sales Flow

1. Start shift
2. Create inventory: Tequila (750ml, $450, 3 bottles)
3. Create drink: Margarita (44.36ml tequila, $120)
4. Open tab for "Table 1"
5. Add 2 margaritas
6. Verify reservedStock = 88.72ml
7. Close tab - payment: cash
8. Verify currentStock -= reservedStock, reservedStock = 0
9. Verify sales logged in shift report

---

## Part 7: Edge Cases & Error Handling

### 7.1 Inventory Edge Cases

| Scenario               | Test                             | Expected Result               |
| ---------------------- | -------------------------------- | ----------------------------- |
| **Negative stock**     | Manually set currentStock = -100 | Prevent or allow with warning |
| **Zero serving size**  | Set servingSize = 0              | Prevent division by zero      |
| **No recipe**          | Add drink with no ingredients    | Allow, no inventory impact    |
| **Deleted ingredient** | Use deleted inventory in recipe  | Handle gracefully             |

### 7.2 Tab & Order Edge Cases

| Scenario        | Expected Result        |
| --------------- | ---------------------- |
| Empty tab close | Allow, $0 total        |
| Tab transfer    | Reserved stock follows |
| Comp tab        | Track comps in report  |
| Split payment   | Both recorded          |

---

## Part 8: Data Validation Rules

### 8.1 Inventory Item Validation

| Field            | Rule                |
| ---------------- | ------------------- |
| `name`           | Required, non-empty |
| `type`           | Must be valid enum  |
| `baseUnitAmount` | Must be > 0         |
| `servingSize`    | Must be >= 0        |
| `orderCost`      | Must be >= 0        |

---

## Part 9: Performance & Load Testing

| Operation                      | Target  |
| ------------------------------ | ------- |
| Get inventory list (100 items) | < 100ms |
| Add order                      | < 50ms  |
| Tab close                      | < 200ms |
| Shift report                   | < 500ms |
| Bulk import (100 items)        | < 2s    |

---

## Part 10: Database State Verification

### Expected Schema Tables

```sql
-- Core tables that must exist
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Expected tables:
-- audit_sessions, event_logs, inventory_items
-- inventory_audits, inventory_adjustments
-- shifts, tabs, tab_payments, orders
-- recipe_ingredients, drinks, users, settings
-- tax_rates, promo_codes, specials, rushes
-- staff_shifts, staff_performance
```

---

## Part 11: Regression Testing Checklist

### Critical Path Tests (Must Pass)

- [ ] Create inventory item → appears in list
- [ ] Add item to menu → drink created automatically
- [ ] Open tab → tab appears in list
- [ ] Add order to tab → inventory reserved increases
- [ ] Delete order → reserved returns
- [ ] Close tab → inventory finalized, sales recorded
- [ ] Close shift → report generates, backup created
- [ ] Bulk import → items created/updated
- [ ] Audit item → variance calculated
- [ ] PIN login → authenticated

---

## Part 12: Test Execution Order

### Phase 1: Unit Tests (Isolated)

1. Test each inventory field validation individually
2. Test each order field validation
3. Test calculation functions (cost, variance)

### Phase 2: Integration Tests (Component)

1. Test inventory → drink creation flow
2. Test order → reserved stock flow
3. Test tab → shift report flow

### Phase 3: End-to-End Tests (Full Flow)

1. Complete shift workflow
2. Bulk import + verify

---

## Part 13: Test Environment Setup

### Required Test Data

```typescript
const testUsers = [
  { email: "admin@gusto.local", role: "admin", pin: "1234" },
  { email: "staff@gusto.local", role: "bartender", pin: "5678" },
];

const testInventory = [
  {
    name: "Tequila Don Julio",
    type: "spirit",
    baseUnitAmount: 750,
    orderCost: 450,
    currentBulk: 3,
    currentPartial: 375,
  },
  {
    name: "Triple Sec",
    type: "mixer",
    baseUnitAmount: 750,
    orderCost: 150,
    currentBulk: 2,
  },
  {
    name: "Lime Juice",
    type: "mixer",
    baseUnitAmount: 1000,
    orderCost: 50,
    currentBulk: 1,
    currentPartial: 500,
  },
];
```

---

## Part 14: Reporting Verification

### Shift Report Fields to Verify

| Field         | Verification              |
| ------------- | ------------------------- |
| shift.id      | UUID matches closed shift |
| totalSalesMxn | Sum of closed tabs        |
| cashSalesMxn  | Cash payment sum          |
| cardSalesMxn  | Card payment sum          |
| salesByStaff  | Per-staff revenue         |
| salesByDrink  | Per-drink revenue         |
| inventoryUsed | Ingredient usage          |

### 14.1 Parent Item Pooling in Reports (New April 2026)

Inventory items with variations (parent/child) should be pooled in reports.

#### Test Case 14.1.1: Inventory Usage Pooled by Parent

```
Initial State:
- Parent: "Whiskey" with baseUnitAmount=750
  - currentStock = 3000ml (4 full bottles)
- Child: "Whiskey 1L" (parentItemId = Whiskey id)
  - currentStock = 1000ml (1 full 1L bottle)
- Child: "Whiskey 750ml" (parentItemId = Whiskey id)
  - currentStock = 0ml

Action:
- Create order using "Whiskey 750ml" recipe (44.36ml)
- Close tab
- Generate shift report

Expected Result:
- inventoryUsed shows:
  - ingredientName: "Whiskey" (parent name)
  - amountUsed: 44.36ml
  - currentStock: 4000ml (3000 + 1000 - should NOT show 3000 + 0)
- Should NOT show separate entries for "Whiskey 750ml" and "Whiskey 1L"
```

#### Test Case 14.1.2: Low Stock Alerts Pooled by Parent

```
Initial State:
- Parent: "Vodka" with lowStockThreshold = 500ml
  - currentStock = 300ml
- Child: "Vodka 1L" (currentStock = 200ml)
- Child: "Vodka 750ml" (currentStock = 100ml)

Action:
- Generate shift report

Expected Result:
- lowStockAlerts shows single entry for "Vodka"
- currentStock = 300 + 200 + 100 = 600ml (aggregated)
- Since 600 > 500, should NOT appear in low stock alerts
```

#### Test Case 14.1.3: Parent Item with No Children

```
Initial State:
- Tequila (no parentItemId - it's a parent)
  - currentStock = 1500ml

Action:
- Generate shift report

Expected Result:
- inventoryUsed shows "Tequila" with its own stock
- No aggregation issues
```

---

## Part 15: Test Failure Diagnostics

### 15.1 General Failure Response Protocol

When any test fails, follow this diagnostic sequence:

#### Step 1: Document the Failure

```
1. Record exact test case name and ID
2. Record expected vs actual result
3. Record timestamp of failure
4. Record any error messages displayed
5. Record browser/app state at failure
```

#### Step 2: Check Basic Connectivity

```
1. Verify API server is running (GET /api/healthz)
2. Verify database is accessible (GET /api/ready)
3. Check console for JavaScript errors
4. Check network tab for failed requests
```

#### Step 3: Verify Database State

```sql
-- Check if record exists
SELECT * FROM inventory_items WHERE name = 'Test Item';

-- Check current stock values
SELECT id, name, currentStock, reservedStock, currentBulk, currentPartial
FROM inventory_items WHERE id = '<item-id>';

-- Check related orders
SELECT * FROM orders WHERE tabId = '<tab-id>';
```

---

### 15.2 Inventory Test Failures

| Failure Symptom            | Likely Cause               | Diagnostic Query                            | Fix Action                                            |
| -------------------------- | -------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| **Stock not updating**     | Transaction not committing | Check DB after operation                    | Verify transaction commits                            |
| **ReservedStock wrong**    | Order flow logic error     | `SELECT reservedStock FROM inventory_items` | Check tabs.ts order handlers                          |
| **currentStock negative**  | Over-deduction             | Check order quantities                      | Add validation                                        |
| **Calculated stock wrong** | Formula error              | Manual calculation                          | Check baseUnitAmount math                             |
| **Bulk import fails**      | Validation error           | Check error response                        | Fix schema validation                                 |
| **Low stock not showing**  | Threshold logic            | Check threshold values                      | Verify threshold calculation                          |
| **Audit API error**        | Missing required params    | Check request body format                   | Now supports server-side calculation (see Appendix A) |

**Diagnostic Query - Stock State**:

```sql
SELECT
  name,
  currentStock,
  reservedStock,
  currentBulk,
  currentPartial,
  (COALESCE(currentBulk, 0) * COALESCE(baseUnitAmount, 0)) + COALESCE(currentPartial, 0) as calculatedTotal
FROM inventory_items
WHERE id = '<item-id>';
```

---

### 15.3 Tab/Order Test Failures

| Failure Symptom            | Likely Cause          | Diagnostic Query                            | Fix Action                   |
| -------------------------- | --------------------- | ------------------------------------------- | ---------------------------- |
| **Tab won't close**        | Open orders exist     | `SELECT * FROM orders WHERE tabId = '<id>'` | Close or delete orders first |
| **Total incorrect**        | Tax calculation error | Check tax rates                             | Verify tax rate settings     |
| **Order not creating**     | Recipe missing        | Check recipe_ingredients                    | Add recipe to drink          |
| **Inventory not reserved** | Order handler error   | Check tabs.ts flow                          | Debug order creation         |
| **Split payment fails**    | Payment validation    | Check payment amounts                       | Verify sum equals total      |

**Diagnostic Query - Tab State**:

```sql
SELECT
  t.id, t.status, t.totalMxn, t.paymentMethod,
  COUNT(o.id) as orderCount,
  SUM(o.quantity * o.unitPriceMxn) as orderTotal
FROM tabs t
LEFT JOIN orders o ON t.id = o.tabId
WHERE t.id = '<tab-id>'
GROUP BY t.id;
```

---

### 15.4 Report Test Failures

| Failure Symptom       | Likely Cause      | Diagnostic Query                                                  | Fix Action           |
| --------------------- | ----------------- | ----------------------------------------------------------------- | -------------------- |
| **Report empty**      | No closed tabs    | `SELECT * FROM tabs WHERE shiftId = '<id>' AND status = 'closed'` | Close some tabs      |
| **Missing inventory** | Recipe not linked | Check recipe_ingredients table                                    | Add ingredient links |
| **Wrong totals**      | Calculation error | Manual sum check                                                  | Debug report query   |
| **Variance wrong**    | Audit calculation | Check audit fields                                                | Verify formula       |

**Diagnostic Query - Shift Report Data**:

```sql
SELECT
  s.id, s.status, s.startedAt, s.closedAt,
  COUNT(DISTINCT t.id) as totalTabs,
  SUM(t.totalMxn) as totalSales,
  SUM(CASE WHEN t.paymentMethod = 'cash' THEN t.totalMxn ELSE 0 END) as cashSales,
  SUM(CASE WHEN t.paymentMethod = 'card' THEN t.totalMxn ELSE 0 END) as cardSales
FROM shifts s
LEFT JOIN tabs t ON s.id = t.shiftId AND t.status = 'closed'
WHERE s.id = '<shift-id>'
GROUP BY s.id;
```

---

### 15.5 Bulk Import Failures

| Failure Symptom          | Likely Cause          | Diagnostic                   | Fix Action        |
| ------------------------ | --------------------- | ---------------------------- | ----------------- |
| **Partial import**       | Row validation errors | Check failedRows in response | Fix CSV data      |
| **No items created**     | Database connection   | Test DB connection           | Restart API       |
| **Wrong values**         | Column mapping        | Check columnMappings         | Remap columns     |
| **Strategy not working** | Logic error           | Check strategy handling      | Debug import code |

**Diagnostic - Import Error Response**:

```json
{
  "success": false,
  "error": "Error message",
  "failedRows": [{ "row": 1, "errors": ["name: Name is required"] }]
}
```

---

### 15.6 Authentication/PIN Failures

| Failure Symptom       | Likely Cause      | Diagnostic                  | Fix Action      |
| --------------------- | ----------------- | --------------------------- | --------------- |
| **PIN not accepted**  | Hash mismatch     | Check user.pin in DB        | Reset PIN       |
| **Lock screen stuck** | State persistence | Check localStorage isLocked | Clear state     |
| **Session expired**   | Timeout           | Check JWT                   | Re-authenticate |

**Diagnostic Query - User PIN**:

```sql
SELECT id, email, pin, role FROM users WHERE email = '<email>';
```

---

### 15.7 Test Failure Resolution Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST FAILURE OCCURS                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. DOCUMENT: Record test ID, expected, actual, error msg   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. VERIFY ENVIRONMENT: Check API/DB connectivity           │
│    - GET /api/healthz                                       │
│    - GET /api/ready                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CHECK DATABASE: Query relevant tables                   │
│    - Use diagnostics above for each area                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. IDENTIFY ROOT CAUSE:                                     │
│    - Data issue? → Fix test data                            │
│    - Code bug? → File bug report                            │
│    - Config issue? → Fix settings                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. FIX AND RETEST:                                          │
│    - Apply fix                                               │
│    - Re-run test                                             │
│    - Document resolution                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. REGRESSION CHECK: Run related tests                       │
│    - Ensure fix doesn't break other functionality          │
└─────────────────────────────────────────────────────────────┘
```

---

### 15.8 Common Issues & Quick Fixes

| Issue                  | Quick Fix                         |
| ---------------------- | --------------------------------- |
| DB locked              | Restart API server                |
| Stale data             | Clear localStorage, refresh       |
| Wrong calculations     | Check baseUnitAmount values       |
| Missing recipes        | Add to drink in UI or bulk import |
| Tab total wrong        | Recalculate in Reports page       |
| Inventory not updating | Check reservedStock handling      |

---

### 15.9 Reporting Test Results

After resolving any test failure, document:

```markdown
### Test Failure Report

**Date**: YYYY-MM-DD  
**Test Case**: [Name]  
**Environment**: [Dev/Staging/Production]

**Failure Details**:

- Expected: [What should happen]
- Actual: [What happened]
- Error Message: [Any error shown]

**Root Cause**: [Why it failed]

**Resolution**: [How it was fixed]

**Verification**: [Test now passes]

**Related Tests**: [Any tests that might also be affected]
```

---

## Appendix A: Bug Fixes (April 12, 2026)

### A.1 Audit API - Server-Side Variance Calculation

**Issue**: The audit endpoint (`POST /api/inventory/items/:id/audit`) required the client to calculate `reportedTotal`, `expectedTotal`, `variance`, and `variancePercent` before sending the request. This was error-prone and placed unnecessary burden on clients.

**Fix Applied** (inventory.ts:593-710):

- Server now calculates `expectedTotal` from the item's current stock
- Server calculates `reportedTotal` from `reportedBulk × baseUnitAmount + reportedPartial` (if not provided)
- Server calculates `variance = reportedTotal - expectedTotal`
- Server calculates `variancePercent = (variance / expectedTotal) × 100` (with zero-div protection)
- Inventory item is updated with the new bulk/partial values and stock is recalculated

**API Request Format** (Simplified):

```json
{
  "reportedBulk": 5,
  "reportedPartial": 400
}
```

**Server calculates**:

- `reportedTotal = 5 × 750 + 400 = 4100`
- `expectedTotal = currentStock (e.g., 5000)`
- `variance = 4100 - 5000 = -900`
- `variancePercent = (-900 / 5000) × 100 = -18%`

### A.2 Delete Order Endpoint

**Issue**: The delete order endpoint was returning 404 when called via `/api/tabs/:tabId/orders/:orderId`.

**Fix**: The correct endpoint is `/api/orders/:orderId` (top-level route in tabs router). The frontend mutation correctly calls this path. The route is registered at `router.delete("/orders/:id", ...)` in tabs.ts:633.

**Frontend Usage**:

```typescript
fetch(`/api/orders/${orderId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reason, voidedByUserId }),
});
```

### A.3 Rate Limiting on Admin Login

**Issue**: Admin login endpoint was rate-limited after multiple failed attempts during testing.

**Fix**: Rate limiting is intentional for security. To reset during testing:

- Wait 15 minutes for the rate limit to expire
- Or restart the API server

---

## Part 16: Bilingual Support Testing (English/Spanish)

### 16.0 Implementation Status (April 2026)

**✅ Implemented:**

- Language toggle on Login screen (globe icon)
- Language toggle on PinPad screen (globe icon)
- Language state managed via `usePosStore` (language, setLanguage)
- Translations available via `getTranslation()` throughout app

**Pending Testing:**

- Full translation coverage verification
- Staff default language preference testing

### 16.1 UI Language Verification

| Component       | Test Case                                  | Expected Result                               |
| --------------- | ------------------------------------------ | --------------------------------------------- |
| Login Screen    | Verify language toggle exists              | Toggle button to switch EN/ES                 |
| PIN Screen      | Verify language toggle exists              | Toggle button to switch EN/ES                 |
| Main Navigation | Switch language, verify all labels change  | Menu, headers, buttons update                 |
| Inventory Page  | Verify all column headers translated       | Name, Type, Stock, Servings, etc.             |
| Drinks Page     | Verify all labels translated               | Category, Price, Recipe, etc.                 |
| Settings Page   | Verify all labels translated               | All form labels and hints                     |
| Audit Modal     | Verify all labels translated               | Current State, Full Bottles, Expected Partial |
| Error Messages  | Verify errors display in selected language | Validation errors, API errors                 |

### 16.2 Staff Language Preference

| Test Case              | Steps                                               | Expected Result                |
| ---------------------- | --------------------------------------------------- | ------------------------------ |
| Staff Default Language | Create staff with language "es", login              | UI loads in Spanish            |
| Staff Default Language | Create staff with language "en", login              | UI loads in English            |
| Language Override      | Login as EN user, toggle to ES, logout, login again | Returns to EN (user default)   |
| Session Language       | Toggle language mid-session                         | UI updates without page reload |
| Persistence            | Toggle language, refresh page                       | Language persists in session   |

### 16.3 Translation Coverage Checklist

- [ ] All button labels
- [ ] All table column headers
- [ ] All form labels and placeholders
- [ ] All error messages
- [ ] All success toasts
- [ ] All modal titles and content
- [ ] All dropdown options
- [ ] All placeholder text
- [ ] All tooltip content
- [ ] Date/time formatting (locale-aware)
- [ ] Number formatting (decimal separators)
- [ ] Currency formatting

### 16.4 Test Data

```typescript
const testLanguages = [
  { userLanguage: "en", expectedUI: "English" },
  { userLanguage: "es", expectedUI: "Español" },
];
```

---

## Summary Checklist

### Inventory Items

- [ ] All 40+ fields have test cases
- [ ] Bulk import validation tested
- [ ] Tracking mode auto-detection tested
- [ ] Low stock alerts verified

### Inventory Audits

- [ ] Bulk/partial entry tested
- [ ] Weight-based calculation tested
- [ ] Variance calculation verified

### Sales Tracking

- [ ] Order → reservedStock flow verified
- [ ] Delete order → stock return verified
- [ ] Tab close → final inventory verified

### Event Logging

- [ ] All actions logged
- [ ] Audit trail queryable
- [ ] User attribution verified

---

## Appendix: Quick Reference

### Common SQL Queries

```sql
-- Get all inventory with stock
SELECT name, currentStock, reservedStock, type FROM inventory_items
WHERE isDeleted = 0 ORDER BY name;

-- Get open tabs
SELECT * FROM tabs WHERE status = 'open';

-- Get orders for a tab
SELECT o.*, d.name as drinkName
FROM orders o
JOIN drinks d ON o.drinkId = d.id
WHERE o.tabId = '<tab-id>';

-- Get shift with sales
SELECT s.*,
  (SELECT SUM(totalMxn) FROM tabs WHERE shiftId = s.id AND status = 'closed') as totalSales
FROM shifts s WHERE s.id = '<shift-id>';
```

---

## Part 16: Period Closing & Financial Accounting (New April 2026)

### 16.1 Periods Table

| Field               | Type           | Description          | Test Case         |
| ------------------- | -------------- | -------------------- | ----------------- |
| `id`                | UUID           | Primary key          | Verify unique     |
| `name`              | String         | Period name          | User input        |
| `periodType`        | String         | daily/weekly/monthly | Verify options    |
| `startDate`         | Unix timestamp | Period start         | Verify timestamp  |
| `endDate`           | Unix timestamp | Period end           | Verify timestamp  |
| `status`            | String         | open/closed          | State transitions |
| `closedAt`          | Unix timestamp | When closed          | Auto on close     |
| `closedByUserId`    | UUID           | Who closed           | Track             |
| `totalSalesMxn`     | Number         | Total revenue        | Calculated        |
| `totalCostMxn`      | Number         | Total cost           | Calculated        |
| `cogsMxn`           | Number         | Cost of goods sold   | Calculated        |
| `totalTipsMxn`      | Number         | Total tips           | Calculated        |
| `totalDiscountsMxn` | Number         | Total discounts      | Calculated        |
| `totalVoidsMxn`     | Number         | Total voided value   | Calculated        |

### 16.2 Period API Tests

#### Test Case 16.2.1: Create Period

```
Action:
- POST /api/periods
- { "name": "April 2026", "periodType": "monthly", "startDate": 1740892800, "endDate": 1743571200 }

Expected Result:
- Period created with status = "open"
- All financial fields default to 0
```

#### Test Case 16.2.2: Get Open Period

```
Action:
- GET /api/periods/open

Expected Result:
- Returns current open period
- 404 if no open period exists
```

#### Test Case 16.2.3: Close Period (Critical)

```
Initial State:
- Period "Test Period" with 3 closed tabs totaling 5000 MXN
- Tabs used 750ml of tequila (cost 300 MXN)

Action:
- POST /api/periods/{id}/close
- { "closedByUserId": "admin-user-id" }

Expected Result:
- status = "closed"
- closedAt = current timestamp
- closedByUserId = "admin-user-id"
- totalSalesMxn = 5000
- cogsMxn = 300
- profitMxn = 4700 (calculated as sales - cogs)
- tabsClosed = 3
- ordersProcessed = count of non-voided orders
```

#### Test Case 16.2.4: Period Cannot Be Modified After Close

```
Initial State:
- Period already closed

Action:
- Attempt to modify data (implementation varies by route)

Expected Result:
- Should return error: "Period is closed - modifications not allowed"
```

---

## Part 17: Manager Approval for Voids (New April 2026)

### 17.1 Void Authorization Tests

#### Test Case 17.1.1: Void Without Manager Credentials

```
Action:
- DELETE /api/tabs/orders/{orderId}
- { "reason": "customer_changed_mind", "voidedByUserId": "staff-123" }

Expected Result:
- Returns 400 error
- code: "MANAGER_REQUIRED"
- Order NOT voided
```

#### Test Case 17.1.2: Void With Invalid Manager

```
Action:
- DELETE /api/tabs/orders/{orderId}
- { "reason": "customer_changed_mind", "voidedByUserId": "staff-123", "managerUserId": "staff-456", "managerPin": "1234" }

Expected Result:
- Returns 403 error
- code: "INVALID_MANAGER"
- Order NOT voided
```

#### Test Case 17.1.3: Void With Wrong PIN

```
Action:
- DELETE /api/tabs/orders/{orderId}
- { "reason": "customer_changed_mind", "voidedByUserId": "staff-123", "managerUserId": "admin-789", "managerPin": "wrong-pin" }

Expected Result:
- Returns 403 error
- code: "INVALID_PIN"
- Order NOT voided
```

#### Test Case 17.1.4: Void With Valid Manager Approval

```
Action:
- DELETE /api/tabs/orders/{orderId}
- { "reason": "customer_changed_mind", "voidedByUserId": "staff-123", "managerUserId": "admin-789", "managerPin": "1234" }

Expected Result:
- Order marked as voided = 1
- voidReason = "customer_changed_mind"
- voidedByUserId = "staff-123" (who performed void)
- voidedAt = timestamp
- Success response returned
```

---

## Part 18: CSV Export (New April 2026)

### 18.1 Export Endpoints (Admin Only)

| Endpoint                 | Description              |
| ------------------------ | ------------------------ |
| `/api/export/sales`      | Sales data by tab/date   |
| `/api/export/inventory`  | Current inventory levels |
| `/api/export/cogs`       | Cost of goods by period  |
| `/api/export/audit-logs` | Event logs               |
| `/api/export/periods`    | Period summaries         |

### 18.2 Export Tests

#### Test Case 18.2.1: Export Sales (Admin Only)

```
Action (as admin):
- GET /api/export/sales?startDate=1740892800&endDate=1743571200

Expected Result:
- CSV file download
- Headers: tabId, nickname, staffUserId, openedAt, closedAt, totalMxn, tipMxn, discountMxn, paymentMethod, orderCount, status
```

#### Test Case 18.2.2: Export Sales (Non-Admin Denied)

```
Action (as staff):
- GET /api/export/sales

Expected Result:
- Returns 403 Forbidden
```

#### Test Case 18.2.3: Export Inventory

```
Action:
- GET /api/export/inventory

Expected Result:
- CSV with all inventory items
- Includes: id, name, type, currentBulk, currentPartial, currentStock, orderCost, etc.
```

#### Test Case 18.2.4: Export COGS by Period

```
Action:
- GET /api/export/cogs?periodId={periodId}

Expected Result:
- CSV with itemName, quantityUsed, unitCost, totalCost, category
```

#### Test Case 18.2.5: Export Audit Logs

```
Action:
- GET /api/export/audit-logs?startDate=1740892800&endDate=1743571200&limit=500

Expected Result:
- CSV with: id, userId, action, entityType, entityId, oldValue, newValue, reason, createdAt
- Limited to 500 most recent
```

#### Test Case 18.2.6: Export Periods with Profit

```
Action:
- GET /api/export/periods

Expected Result:
- CSV with all periods
- Includes calculated profitMxn = totalSalesMxn - cogsMxn
```

---

## Part 19: COGS Integration Tests

### 19.1 Full Accounting Cycle Test

```
Initial State:
- Period "April 12" created and open
- Tequila: orderCost = 300 MXN, baseUnitAmount = 750ml
- Inventory: currentStock = 3000ml

Action:
1. Create tab, add 2 margaritas (each 44.36ml tequila)
2. Close tab
3. Close period

Expected Result:
After Tab Close:
- Tequila: currentStock = 3000 - 88.72 = 2911.28ml

After Period Close:
- Period.totalSalesMxn = tab total
- Period.cogsMxn = 88.72ml × (300/750) = 35.49 MXN
- Period.profitMxn = totalSales - cogs

CSV Export:
- /export/sales shows the tab
- /export/cogs shows tequila usage with cost
- /export/periods shows profit calculation
```

### 19.2 Void Order Not in COGS

```
Initial State:
- Period open
- Tab with 3 orders (2 valid, 1 voided after close)

Action:
- Close period

Expected Result:
- COGS calculated from 2 valid orders only
- voided order excluded from cost calculation
```

### 19.3 Parent Item COGS Pooling

```
Initial State:
- Parent: Whiskey (orderCost = 400 MXN, baseUnitAmount = 750ml)
- Child: Whiskey 1L (orderCost = 500 MXN, baseUnitAmount = 1000ml)

Action:
- Order uses Whiskey 750ml recipe
- Close period

Expected Result:
- COGS uses parent's orderCost (400 MXN / 750ml = 0.53/ml)
- Amount = 44.36ml × 0.53 = 23.73 MXN
- NOT using child's cost even though recipe might reference child
```

---

**End of Test Protocol**
