# Quick Test Execution Guide

## Running the Inventory Test Protocols

---

## Pre-Test Setup

```bash
# Restart database with fresh schema
pnpm run db:reset

# Or just restart services
pnpm run dev
```

---

## Run Tests by Category

### Critical Path Tests (Must Pass)

```bash
# 1. Bartender - Order Flow
# Test: BART-001, BART-003, BART-004
# Manual test required - see test protocols

# 2. Stock Check
# Verify: reservedStock increases on order
# Verify: currentStock decreases on close (NOT both!)
```

### Admin Tests

```bash
# Create test inventory via API
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tequila",
    "type": "spirit",
    "baseUnit": "ml",
    "baseUnitAmount": 750,
    "servingSize": 44.36,
    "currentStock": 750,
    "fullBottleWeightG": 950,
    "lowStockThreshold": 10,
    "trackingMode": "pool"
  }'
```

### Verify Stock Deduction Fix

```bash
# 1. Start with 750ml currentStock
curl -X PATCH http://localhost:3000/api/ingredients/TEQUILA-ID \
  -H "Content-Type: application/json" \
  -d '{"currentStock": 750, "reservedStock": 0}'

# 2. Create order (reserves 88.72ml)
# ... via UI or tab creation

# 3. Close tab - VERIFY:
# - currentStock = 750 - 88.72 = 661.28
# - reservedStock = 0
# NOT: 750 - 88.72 - 88.72 = 572.56 (BUG!)
```

### Verify Variance Calculations

```bash
# Run an audit
curl -X POST http://localhost:3000/api/inventory/items/TEQUILA-ID/audit \
  -H "Content-Type: application/json" \
  -d '{
    "reportedBulk": 3,
    "reportedPartial": 650,
    "auditEntryMethod": "bulk_partial",
    "auditedByUserId": "admin-id"
  }'

# Check response includes:
# - variance
# - variancePercent
# - varianceInServings  <- NEW FIELD
```

---

## Test Data Quick Reference

### Pool Item (Spirit)

| Field                | API Field         | Test Value |
| -------------------- | ----------------- | ---------- |
| Bottle ml            | baseUnitAmount    | 750        |
| Full bottle weight   | fullBottleWeightG | 950        |
| Container weight     | containerWeightG  | 245        |
| Density              | density           | 0.94       |
| Serving size         | servingSize       | 44.36      |
| Current bulk         | currentBulk       | 10         |
| Current partial (g)  | currentPartial    | 720        |
| Current stock (ml)   | currentStock      | 8220       |
| Reserved             | reservedStock     | 0          |
| Threshold (servings) | lowStockThreshold | 10         |

### Collection Item (Beer)

| Field                   | API Field         | Test Value |
| ----------------------- | ----------------- | ---------- |
| Units per case          | unitsPerCase      | 24         |
| Serving size            | servingSize       | 1          |
| Current bulk            | currentBulk       | 5          |
| Current partial (units) | currentPartial    | 12         |
| Current stock           | currentStock      | 132        |
| Reserved                | reservedStock     | 0          |
| Threshold (servings)    | lowStockThreshold | 10         |

---

## Verification Queries

```sql
-- Check stock values in database
SELECT
  name,
  currentStock,
  currentBulk,
  currentPartial,
  reservedStock,
  (currentStock / servingSize) as servings_remaining,
  CASE
    WHEN currentStock / servingSize <= lowStockThreshold
    THEN 'LOW'
    ELSE 'OK'
  END as stock_status
FROM inventory_items
WHERE is_deleted = 0;

-- Check recent audits
SELECT
  item_name,
  variance,
  variance_percent,
  variance_in_servings,  -- NEW FIELD
  audited_at
FROM inventory_audits
ORDER BY audited_at DESC
LIMIT 20;
```

---

## Manual Test Checklist

- [ ] **BART-001**: Add drink, verify reserved increases
- [ ] **BART-003**: Try oversell, verify rejection
- [ ] **BART-004**: Close tab, verify single deduction
- [ ] **ADMIN-005**: Audit item, verify varianceInServings in response
- [ ] **ACCT-001**: View variance, verify signs (negative vs positive)

---

## Troubleshooting

### "Insufficient stock" but have stock?

- Check: currentStock + reservedStock >= needed
- Bug: Only checking currentStock

### Variance shows positive but underage?

- Bug: Using absolute values for min/max

### Double deduction?

- Check: currentStock AND reservedStock both deducted on close

### Stock shows negative?

- Bug: Missing Math.max(0, ...) guard

---

_Guide Version: 1.0_
_For full test protocols, see INVENTORY_TEST_PROTOCOLS.md_
