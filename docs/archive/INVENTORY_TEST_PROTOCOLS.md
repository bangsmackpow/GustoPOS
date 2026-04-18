# Inventory System Test Protocols

## Master Test Suite for GustoPOS Inventory Tracking & Auditing

---

# Table of Contents

1. [Executive Summary](#executive-summary)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Role-Based Test Matrices](#role-based-test-matrices)
4. [Integration Test Scenarios](#integration-test-scenarios)
5. [Test Data Sets](#test-data-sets)
6. [Acceptance Criteria](#acceptance-criteria)

---

# Executive Summary

This document defines comprehensive test protocols for the GustoPOS inventory tracking and auditing system. Tests are organized by role perspective to ensure all user interactions are validated.

**Roles Covered:**

- Bartender (Front-line service)
- Manager (Operations oversight)
- Admin (System configuration)
- Accountant (Financial reconciliation)

**Key System Flows Tested:**

- Stock Reservation Flow
- Tab Close & Stock Deduction
- Inventory Auditing
- Variance Analysis
- Bulk Import/Export

---

# Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                        GUSTOPOS INVENTORY SYSTEM                         │
│                         DATA FLOW DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   FRONTEND (React)    │
│   TabDetail.tsx       │
│   Inventory.tsx      │
│   AuditModal.tsx     │
└──────────┬───────────┘
           │ 1. POST /tabs/:id/orders
           │    (reserve stock)
           ▼
┌──────────────────────┐      ┌─────────────────────┐
│   API SERVER         │      │   ORDER CREATION    │
│   tabs.ts           │◄────►│   Flow              │
│   - Check stock     │      │   ✓ Check available │
│   - Reserve stock  │      │   ✓ Reserve stock   │
└──────────┬───────────┘      └─────────────────────┘
           │
           │ 2. POST /tabs/:id/close
           │    (finalize inventory)
           ▼
┌──────────────────────┐      ┌─────────────────────┐
│   FINALIZE TAB      │      │   STOCK DEDUCTION  │
│   tabs.ts:36-84     │◄────►│   - currentStock  │
│   - Filter non-void │      │   - NOT both!    │
│   - Deduct stock  │      └─────────────────────┘
└──────────┬───────────┘
           │
           │ 3. POST /inventory/items/:id/audit
           ▼
┌──────────────────────┐      ┌─────────────────────┐
│   AUDIT FLOW         │      │   VARIANCE CALC      │
│   inventory.ts:594  │◄────►│   - variance ml     │
│   - reportedTotal   │      │   - variance %     │
│   - expectedTotal │      │   - servings      │
│   - variance      │      └─────────────────────┘
└──────────┬───────────┘
           │
           │ 4. PATCH /inventory/items/:id
           │    (update stock after audit)
           ▼
┌──────────────────────┐
│   SQLITE DATABASE    │
│   inventory_items   │
│   - currentStock   │
│   - currentBulk   │
│   - currentPartial│
│   - reservedStock│
└──────────────────────┘
           │
           │ 5. GET /inventory-audits/variance-summary
           ▼
┌──────────────────────┐      ┌─────────────────────┐
│   VARIANCE SUMMARY   │      │   ANALYTICS         │
│   inventory-       │◄────►│   - min/max (sign)   │
│   audits.ts:105    │      │   - by item         │
│   - aggregate    │      │   - recommendations  │
└──────────────────────┘      └─────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                         STOCK VALUE EQUATIONS                             │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POOL (Spirit/Mixer) - Weight Based                                      │
│  ─────────────────────                                                 │
│  currentStock = currentBulk × bottleSizeMl + partialMl                  │
│                                                                         │
│  Pooled Stock (with variations) =                                         │
│    parent.currentBulk × parent.bottleSizeMl + parent.currentPartial +              │
│    Σ(variation.currentBulk × variation.bottleSizeMl + variation.currentPartial)     │
│                                                                         │
│  Servings = currentStock / servingSize                                       │
│                                                                         │
│  Low Stock = (currentStock / servingSize) <= lowStockThreshold              │
│                                                                         │
│                                                                         │
│  COLLECTION (Beer/Merch) - Unit Based                                    │
│  ────────────────────────────                                          │
│  currentStock = currentBulk × unitsPerCase + looseUnits                       │
│                                                                         │
│  Servings = currentStock / 1  (1 serving = 1 unit)                         │
│                                                                         │
│  Low Stock = currentStock <= lowStockThreshold                            │
│                                                                         │
│                                                                         │
│  WEIGHT CONVERSIONS                                                    │
│  ────────────────                                                     │
│  Grams to ml:   ml = grams × density                                   │
│  ml to grams:   grams = ml / density                                   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                          STOCK STATUS LOGIC                           │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FRONTEND (TabDetail.tsx:308-310)                                       │
│  availableStock = ingredient.currentStock                              │
│  reservedStock = ingredient.reservedStock                            │
│  totalAvailable = availableStock + reservedStock  ◄── KEY FIX!       │
│  servingsAvailable = totalAvailable / amountNeeded                   │
│                                                                          │
│  Status Thresholds:                                                   │
│  - available (>= 15 servings)                                         │
│  - medium (5-14 servings)                                          │
│  - low (< 5 servings)                                              │
│  - out (0 servings)                                               │
│                                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                         VARIANCE TRACKING                              │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AUDIT (inventory.ts:636-641)                                          │
│  variance = reportedTotal - expectedTotal                                 │
│  variancePercent = (variance / expectedTotal) × 100                   │
│  varianceInServings = Math.abs(variance) / servingSize  ◄── NEW!         │
│                                                                          │
│  VARIANCE SUMMARY (inventory-audits.ts:159-179)                        │
│  maxVariance = most positive (overage)                              │
│  minVariance = most negative (underage) ◄── SIGN TRACKED!          │
│  negativeCount = how many underage audits                           │
│  positiveCount = how many overage audits                             │
│                                                                          │
│  Recommendations Generated:                                              │
│  - Consistent Underage (>50% audits, avg <-5%)                              │
│  - Consistent Overage (>50% audits, avg >5%)                               │
│  - High Volatility (max-min > 50ml, 3+ audits)                    │
│  - Recent Significant Variance (last >10%)                           │
│                                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# Role-Based Test Matrices

## 1. BARTENDER TEST PROTOCOLS

### Role: Bartender

**Primary Function:** Take orders, serve drinks, manage tabs
**Test Priority:** HIGH - Core revenue flow

### Test 1.1: Normal Order Flow

```
TEST: BART-001 - Add drink to open tab
─────────────────────────────────────────
PRECONDITIONS:
- Tab is open with status "open"
- Drink has valid recipe with in-stock ingredients
- Ingredient has currentStock (750ml) + reservedStock (0)

ACTION:
1. Add 2x "Margarita" to tab
   - drink uses 44.36ml tequila per serving
   - Total needed: 88.72ml

EXPECTED RESULT:
✓ Order created successfully
✓ reservedStock increases by 88.72ml
✓ Stock status shows correct availability

VERIFICATION:
- Query /api/tabs/:id returns order with quantity=2
- Query ingredient shows reservedStock = 88.72
- TabDetail shows drink as "available" (750-0)/44.36 = 16.9 servings
```

### Test 1.2: Partial Stock Alert

```
TEST: BART-002 - Order when stock is low
─────────────────────────────────────────
PRECONDITIONS:
- Tab is open
- Ingredient has currentStock = 100ml, reservedStock = 0
- Drink serving size = 44.36ml

ACTION:
1. Add 1x drink (needs 44.36ml)
2. Add 2nd drink (needs additional 44.36ml)

EXPECTED RESULT:
✓ 1st drink succeeds
✓ 2nd drink succeeds (total reserved = 88.72ml, remaining = 11.28ml)
✓ Stock status shows "LOW" (< 5 servings: 11.28/44.36 = 0.25)

VERIFICATION:
- TabDetail drink card shows amber indicator with "0 left"
```

### Test 1.3: Oversell Attempt (SHOULD FAIL)

```
TEST: BART-003 - Prevent overselling
─────────────────────────────────────────
PRECONDITIONS:
- Tab is open
- Ingredient has currentStock = 50ml, servingSize = 44.36ml
- No reserved stock

ACTION:
1. Attempt to add 2x drink (needs 88.72ml)

EXPECTED RESULT:
✗ Order REJECTED with error
Error message: "Insufficient stock. Need 88.72, have 50"

VERIFICATION:
- No order created
- currentStock unchanged at 50ml
- reservedStock = 0
```

### Test 1.4: Tab Close - Stock Deduction

```
TEST: BART-004 - Close tab and verify stock deduction
─────────────────────────────────────────
PRECONDITIONS:
- Open tab with 3 orders
- Each order uses 44.36ml (total 133.08ml reserved)
- Ingredient currentStock = 750ml
- reservedStock = 133.08ml

ACTION:
1. Close tab with cash payment

EXPECTED RESULT:
✓ Tab status changes to "closed"
✓ currentStock deducted by consumed amount ONLY
  - New currentStock = 750 - 133.08 = 616.92ml
✓ reservedStock = 0 (was cleared, now re-credited = 0)

VERIFICATION:
- Query ingredient shows currentStock ��� 616.92
- reservedStock = 0
```

### Test 1.5: Void Order - Stock Release

```
TEST: BART-005 - Void order releases stock
─────────────────────────────────────────
PRECONDITIONS:
- Open tab with active order
- Order quantity = 2 (88.72ml reserved)
- Ingredient reservedStock = 88.72ml

ACTION:
1. Void order with reason "wrong_item"

EXPECTED RESULT:
✓ Order marked as voided
✓ reservedStock decreases
  - (if implemented) New reservedStock = 0
  - (current) reservedStock still shows 88.72 until close

VERIFICATION:
- Order shows voided = true
- Order shows voidReason = "wrong_item"
```

### Test 1.6: Split Bill Display

```
TEST: BART-006 - Split bill calculates correctly
─────────────────────────────────────────
PRECONDITIONS:
- Tab total = $500
- Tip = $50
- Split between 4 people

ACTION:
1. Close tab with split 4 way

EXPECTED RESULT:
✓ Each person pays: ($500 + $50) / 4 = $137.50
✓ Payments array has 4 entries

VERIFICATION:
- API receives correct payments array
```

---

## 2. MANAGER TEST PROTOCOLS

### Role: Manager

**Primary Function:** Oversee operations, handle voids, run reports
**Test Priority:** HIGH - Operational integrity

### Test 2.1: Void with Manager Authorization

```
TEST: MGR-001 - Void with manager PIN
─────────────────────────────────────────
PRECONDITIONS:
- Tab with active order
- Manager staff logged in
- Manager PIN verified

ACTION:
1. Select order to void
2. Choose reason "customer_changed_mind"
3. Confirm void

EXPECTED RESULT:
✓ Order marked as voided
✓ voidReason = "customer_changed_mind"
✓ voidedByUserId = manager's user ID

VERIFICATION:
- Query /api/tabs/:id shows voided order
- Order includes voidReason field
```

### Test 2.2: Run Sales Report

```
TEST: MGR-002 - Generate shift sales report
─────────────────────────────────────────
PRECONDITIONS:
- Shift has been closed
- Multiple tabs closed during shift

ACTION:
1. Navigate to Reports
2. Select shift date
3. Generate report

EXPECTED RESULT:
✓ Report shows:
  - Total sales
  - Total tabs closed
  - Average ticket
  - Total tips
  - Sales by staff member

VERIFICATION:
- Values match sum of closed tabs
```

### Test 2.3: View Void Analytics

```
TEST: MGR-003 - Analyze void patterns
─────────────────────────────────────────
PRECONDITIONS:
- Multiple voids in system with various reasons

ACTION:
1. Navigate to Reports > Stats tab
2. View void breakdown

EXPECTED RESULT:
✓ Shows void count by reason
✓ Shows void count by staff
✓ Shows % of total orders voided

VERIFICATION:
- Counts match actual voids
- Reasons properly categorized
```

### Test 2.4: Inventory Stock Alert

```
TEST: MGR-004 - Monitor low stock items
─────────────────────────────────────────
PRECONDITIONS:
- Some inventory items at or below threshold
- Threshold = 10 servings

ACTION:
1. View inventory page
2. Filter by "Low Stock"

EXPECTED RESULT:
✓ Shows only items below threshold
✓ Items display warning indicator

VERIFICATION:
- For each item: servings <= 10
```

---

## 3. ADMIN TEST PROTOCOLS

### Role: Administrator

**Primary Function:** System configuration, inventory management, audit execution
**Test Priority:** HIGH - Data integrity

### Test 3.1: Add New Inventory (Pool Item)

```
TEST: ADMIN-001 - Add spirit with full weight tracking
─────────────────────────────────────────
PRECONDITIONS:
- Admin logged in

ACTION:
1. Navigate to Add Inventory
2. Enter:Name = "Jose Cuervo"
3. Type = "spirit"
4. Bottle Size = 750ml
5. Full Bottle Weight = 950g
6. Alcohol Density = 0.94
7. Serving Size = 44.36ml
8. Current Stock = 0

EXPECTED RESULT:
✓ Item created
✓ containerWeightG auto-calculated = 950 - (750 × 0.94) = 245g
✓ trackingMode = "pool" (or "auto" for spirit)

VERIFICATION:
- GET /api/ingredients shows new item
- containerWeightG = 245
```

### Test 3.2: Add Inventory (Collection Item)

```
TEST: ADMIN-002 - Add beer case
─────────────────────────────────────────
PRECONDITIONS:
- Admin logged in

ACTION:
1. Navigate to Add Inventory
2. Enter:Name = "Corona"
3. Type = "beer"
4. Units Per Case = 24
5. Serving Size = 1 (unit)
6. Current Stock = 2 cases

EXPECTED RESULT:
✓ Item created with trackingMode = "collection"
✓ servingSize = 1 (1 can = 1 serving)
✓ No density/bottle weight fields used

VERIFICATION:
- GET /api/ingredients shows:
  - unitsPerCase = 24
  - servingSize = 1
  - trackingMode = "collection"
```

### Test 3.3: Add Inventory - Partial for Pool

```
TEST: ADMIN-003 - Add partial bottle for pool item
─────────────────────────────────────────
PRECONDITIONS:
- Existing pool item with weights
- Full bottle: 950g total, 245g container

ACTION:
1. Click "+" on inventory item
2. Enter Full Bottles: 2
3. Enter Partial Weight: 700g (weighed bottle)

EXPECTED RESULT:
✓ currentBulk increases by 2
✓ currentPartial = 700g
✓ New currentStock = 2×750 + estimated partial ml

VERIFICATION:
- Partial in grams (700g)
- Display: "2 full + ~428ml" (700 × 0.94)
```

### Test 3.4: Add Inventory - Partial for Collection

```
TEST: ADMIN-004 - Add loose units for collection item
─────────────────────────────────────────
PRECONDITIONS:
- Existing collection item (24 per case)

ACTION:
1. Click "+" on inventory item
2. Enter Full Cases: 1
3. Enter Loose Units: 5

EXPECTED RESULT:
✓ currentBulk increases by 1
✓ currentPartial = 5
✓ New currentStock = 1×24 + 5 = 29 units

VERIFICATION:
- Display: "1 full + 5 units"
```

### Test 3.5: Perform Audit (Pool)

```
TEST: ADMIN-005 - Audit pool item with weights
─────────────────────────────────────────
PRECONDITIONS:
- Pool item with weights
- currentBulk = 3, currentPartial = 720g
- Expected: 3 full + ~677ml (720 × 0.94)

ACTION:
1. Navigate to Inventory
2. Select item, click Audit
3. Enter: Full Bottles = 3
4. Enter: Partial Weight = 710g
5. Submit audit

EXPECTED RESULT:
✓ Audit recorded
✓ Variance = reported - expected
  - Reported: 3×750 + 667 = 2417ml
  - Expected: 3×750 + 677 = 2427ml
  - Variance: -10ml
✓ varianceInServings = 10 / 44.36 = -0.23 servings

VERIFICATION:
- Audit shows exact values
- Variance calculations correct
```

### Test 3.6: Perform Audit (Collection)

```
TEST: ADMIN-006 - Audit collection item
─────────────────────────────────────────
PRECONDITIONS:
- Collection item, 24 per case
- currentBulk = 2, currentPartial = 5
- Expected: 2×24 + 5 = 53 units

ACTION:
1. Navigate to Inventory
2. Select beer item, click Audit
3. Enter: Full Cases = 2
4. Enter: Loose Units = 3
5. Submit audit

EXPECTED RESULT:
✓ Reported Total = 2×24 + 3 = 51 units
✓ Expected Total = 53 units
✓ Variance = -2 units

VERIFICATION:
- Variance in units (not %)
- Variance in servings = -2 (1 serving = 1 unit)
```

### Test 3.7: Bulk Import

```
TEST: ADMIN-007 - Bulk import with tracking mode
─────────────────────────────────────────
PRECONDITIONS:
- CSV file with inventory items

ACTION:
1. Navigate to Bulk Import
2. Upload CSV:
   NAME,TYPE,BASE_UNIT_AMOUNT,TRACKING_MODE,CURRENT_STOCK
   Vodka,spirit,750,auto,5
   Corona,beer,24,collection,10

EXPECTED RESULT:
✓ 2 items imported
✓ Vodka trackingMode = "pool" (auto-detected from spirit)
✓ Corona trackingMode = "collection" (auto-detected from beer)

VERIFICATION:
- GET /api/ingredients returns both items
- Tracking modes correctly set
```

---

## 4. ACCOUNTANT TEST PROTOCOLS

### Role: Accountant

**Primary Function:** Financial reconciliation, COGS, period closing
**Test Priority:** HIGH - Financial accuracy

### Test 4.1: View Variance Summary

```
TEST: ACCT-001 - Check variance analysis
─────────────────────────────────────────
PRECONDITIONS:
- Multiple audits performed over past 30 days

ACTION:
1. Navigate to Variance Analysis page
2. Set period = 30 days
3. View summary

EXPECTED RESULT:
✓ Summary shows:
  - Total audits
  - Items audited
  - Items with variance
✓ Each item shows:
  - totalVariance (with SIGN: negative = underage)
  - avgVariancePercent
  - maxVariance (most positive)
  - minVariance (most negative)
  - by-reason breakdown

VERIFICATION:
- Negative variance correctly identified as underage
- Positive variance correctly identified as overage
```

### Test 4.2: COGS Report

```
TEST: ACCT-002 - Generate COGS report
─────────────────────────────────────────
PRECONDITIONS:
- Period has been closed
- Inventory consumed during period

ACTION:
1. Navigate to Reports > COGS
2. Select period
3. Generate export

EXPECTED RESULT:
✓ Shows:
  - Beginning inventory value
  - Purchases during period
  - Ending inventory value
  - Consumed = Beginning + Purchases - Ending

VERIFICATION:
- Values match calculated COGS
```

### Test 4.3: Period Close

```
TEST: ACCT-003 - Close period and reconcile
─────────────────────────────────────────
PRECONDITIONS:
- Open period exists
- All shifts closed for period

ACTION:
1. Navigate to Periods
2. Close current period

EXPECTED RESULT:
✓ Period closed
✓ COGS entries calculated
✓ Inventory values snapshot taken

VERIFICATION:
- Period shows closed status
- COGS entries match inventory consumption
```

### Test 4.4: Export Data

```
TEST: ACCT-004 - Export audit logs
─────────────────────────────────────────
PRECONDITIONS:
- System has audit history

ACTION:
1. Navigate to Settings > Export
2. Select Audit Logs
3. Download CSV

EXPECTED RESULT:
✓ CSV contains:
  - itemId, itemName
  - auditedAt, auditedByUserId
  - reportedTotal, expectedTotal
  - variance, variancePercent
  - varianceInServings

VERIFICATION:
- CSV is valid format
- All fields present
```

---

# Integration Test Scenarios

## Scenario 1: Full Service Night Flow

```
TEST: INTEGRATION-001 - Complete service night
─────────────────────────────────────────
SCENARIO: Simulate a busy bar night

PRECONDITIONS:
- Manager opens shift
- Inventory stocked:
  - Tequila: 10 bottles (7500ml)
  - Beer Corona: 5 cases (120 units)
- Shifts started

STEP 1: SERVICE FLOW
1. Bartender A opens tab for Table 1
2. Customer orders 3 margaritas
   → Needs: 3 × 44.36 = 133.08ml tequila
   → reservedStock = 133.08ml
3. Customer orders 4 Corona
   → Needs: 4 units
   → reservedStock = 4 units

STEP 2: SECOND CUSTOMER
4. Bartender B opens tab for Table 2
5. Customer orders 2 margaritas + 2 Corona
   → Tequila reserved: 88.72ml more (total 221.8ml)
   → Beer reserved: 2 units more (total 6 units)

STEP 3: CLOSE FIRST TAB
6. Table 1 closes (3 margaritas paid)
   → Current stock deducts 133.08ml
   → Reserved cleared: 133.08ml

STEP 4: VOID
7. Table 2 - Customer changed mind on 1 margarita
   → Order voided
   → Reserved released: 44.36ml

STEP 5: CLOSE SECOND TAB
8. Table 2 closes
   → Tequila consumed: 88.72ml - 44.36ml (voided) = 44.36ml
   → Beer consumed: 4 units
   → Current stock deducts consumed amount

END STATE:
- Tequila: 7500 - 133.08 - 44.36 = 7322.56ml
- Beer: 120 - 4 = 116 units
- ReservedStock = 0 all items

VERIFICATION:
- All stock values calculated correctly
- Voids properly tracked
- No double-deduction
```

## Scenario 2: Audit Flow

```
TEST: INTEGRATION-002 - Inventory audit and variance analysis
─────────────────────────────────────────
SCENARIO: End of night audit

PRECONDITIONS:
- Day time inventory counts performed
- Multiple items audited

STEP 1: AUDIT TEQUILA
1. Audit Jose Cuervo (spirit)
   - Expected: 7322.56ml (from INTEGRATION-001)
   - Physical count: 7300ml
   - Variance: -22.56ml
   - Variance%: -0.31%
   - Servings: -0.51 servings

STEP 2: AUDIT BEER
2. Audit Corona
   - Expected: 116 units
   - Physical count: 115 units
   - Variance: -1 unit
   - Variance%: -0.86%
   - Servings: -1 serving

STEP 3: VARIANCE ANALYSIS
3. Run 7-day variance summary

EXPECTED RESULT:
✓ Both items show negative variance
✓ Tequila: -22.56ml (underage)
✓ Corona: -1 unit (underage)
✓ Consistent underage detected

STEP 4: CORRECTIVE ACTION
4. Manager orders restock

END STATE:
- Inventory adjusted to physical count
- Variance logged for analysis

VERIFICATION:
- Variance tracking works per item
- Units consistent across display
```

---

# Test Data Sets

## Pool Item Test Data

| Field             | Value          |
| ----------------- | -------------- |
| name              | "Test Tequila" |
| type              | "spirit"       |
| bottleSizeMl      | 750            |
| fullBottleWeightG | 950            |
| density           | 0.94           |
| servingSize       | 44.36          |
| currentBulk       | 10             |
| currentPartial    | 720            |
| currentStock      | 8220           |
| reservedStock     | 0              |
| lowStockThreshold | 10             |
| trackingMode      | "pool"         |

## Collection Item Test Data

| Field             | Value        |
| ----------------- | ------------ |
| name              | "Test Beer"  |
| type              | "beer"       |
| unitsPerCase      | 24           |
| servingSize       | 1            |
| currentBulk       | 5            |
| currentPartial    | 12           |
| currentStock      | 132          |
| reservedStock     | 0            |
| lowStockThreshold | 10           |
| trackingMode      | "collection" |

## Mixed Variation Test Data

| Field        | Parent   | Variation |
| ------------ | -------- | --------- |
| name         | "1750ml" | "750ml"   |
| bottleSizeMl | 1750     | 750       |
| currentBulk  | 3        | 8         |

---

# Acceptance Criteria Matrix

| Test ID         | Priority | Success Criteria              | Validation Method |
| --------------- | -------- | ----------------------------- | ----------------- |
| BART-001        | CRITICAL | Order creates, stock reserved | API + UI          |
| BART-002        | CRITICAL | Low stock shows alert         | UI                |
| BART-003        | CRITICAL | Order rejected                | API error         |
| BART-004        | CRITICAL | Stock deducted once           | DB query          |
| MGR-001         | HIGH     | Void with auth                | API + UI          |
| ADMIN-001       | HIGH     | Pool item created             | API + DB          |
| ADMIN-002       | HIGH     | Collection item created       | API + DB          |
| ADMIN-005       | HIGH     | Audit recorded                | API + DB          |
| ACCT-001        | HIGH     | Variance with sign            | API               |
| INTEGRATION-001 | CRITICAL | Full flow works               | DB + UI           |

---

# Test Execution Checklist

## Pre-Test Setup

- [ ] Database rebuilt with test schema
- [ ] Test users created (admin, manager, bartender)
- [ ] Test inventory items loaded
- [ ] Test drinks with recipes configured

## Test Execution Order

1. [ ] Admin tests (create inventory)
2. [ ] Bartender tests (orders)
3. [ ] Manager tests (voids, reports)
4. [ ] Accountant tests (variance)
5. [ ] Integration tests (full flows)

## Post-Test Verification

- [ ] All stock values verified in DB
- [ ] No double-deductions
- [ ] Variance calculations correct
- [ ] API schema matches types

---

_Document Version: 1.0_
_Created: April 2026_
_Test Suite: Master Inventory Protocols_
