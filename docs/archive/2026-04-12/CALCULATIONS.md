# GustoPOS Inventory Calculations

This document describes all calculations and conversions used in the GustoPOS inventory system.

---

## 1. Volume & Weight Conversions

### 1.1 Milliliters to Fluid Ounces

```
oz = ml ÷ 29.5735
```

**Used in:** Inventory edit modal when displaying serving size in oz

### 1.2 Fluid Ounces to Milliliters

```
ml = oz × 29.5735
```

**Used in:** User input conversion when entering serving size in oz

### 1.3 Liters to Milliliters

```
ml = liters × 1000
```

**Used in:** Bulk import when container size is in liters

### 1.4 Kilograms to Grams

```
g = kg × 1000
```

**Used in:** Bulk import when weight is in kg

### 1.5 Partial Bottle Weight to Milliliters

```
liquidWeight = currentWeight - glassWeightG
remainingMl = liquidWeight ÷ density
```

**Used in:** Converting bottle weight to remaining ml when auditing

---

## 2. Stock Calculations

### 2.1 Total Stock (Pool Items)

```
totalStock = (sealedBottles × bottleSizeMl) + partialWeight
```

**Example:** 10 full 750ml bottles + 500g = 7,500ml + partial

### 2.2 Total Stock (Collection Items)

```
totalStock = (sealedCases × unitsPerCase) + looseUnits
```

**Example:** 5 cases of 24 beers + 6 loose = 126 units

### 2.3 Pooled Stock (with Variations)

```
pooledStock = parentStock + Σ(variationStock)
```

**Aggregates:** Parent spirit + all size variations (e.g., 750ml, 1L, 1.75L)

---

## 3. Glass Weight Calculations

### 3.1 Calculate Glass Weight from Full Bottle

```
glassWeightG = fullBottleWeightG - (bottleSizeMl × density)
```

**Example:** Full bottle = 1200g, bottle = 750ml, density = 0.94

```
glassWeightG = 1200 - (750 × 0.94) = 1200 - 705 = 495g
```

### 3.2 Calculate Remaining ml from Current Weight

```
liquidWeight = currentWeight - glassWeightG
remainingMl = liquidWeight ÷ density
```

**Example:** Current = 800g, glass = 495g, density = 0.94

```
liquidWeight = 800 - 495 = 305g
remainingMl = 305 ÷ 0.94 = 324.5ml
```

---

## 4. Serving Calculations

### 4.1 Servings in Stock

```
servingsInStock = totalStock ÷ servingSize
```

**Example:** 7500ml total, 2oz (59ml) serving = 127 servings

### 4.2 Cost per Serving (from bottle cost)

```
costPerServing = (orderCost ÷ bottleSizeMl) × servingSize
```

**Example:** Bottle costs $25, 750ml, 2oz serving

```
costPerServing = (25 ÷ 750) × 44.36 = $1.48
```

### 4.3 Cost per ml

```
costPerMl = orderCost ÷ bottleSizeMl
```

### 4.4 Servings per Bottle

```
servingsPerBottle = bottleSizeMl ÷ servingSize
```

---

## 5. Audit Calculations

### 5.1 Reported Total (Bulk + Partial Method)

```
reportedTotal = (fullBottles × baseUnitAmount) + partialWeight
```

**Note**: As of April 12, 2026, this is calculated server-side in the audit endpoint.

### 5.2 Reported Total (Total Only Method)

```
reportedTotal = partialWeight (when only total is provided)
```

### 5.3 Variance (Server-Side)

```
expectedTotal = currentStock (from database)
variance = reportedTotal - expectedTotal
```

### 5.4 Variance Percentage

```
variancePercent = (variance ÷ expectedTotal) × 100
```

**Note**: Division by zero is handled - if expectedTotal is 0, variancePercent is 0.

### 5.5 Significant Variance Threshold

```
isSignificant = |variancePercent| > 5%
```

### 5.6 Audit Flow (April 2026)

The audit endpoint (`POST /api/inventory/items/:id/audit`) now calculates all values server-side:

```
1. Get item from DB to find currentStock (expectedTotal)
2. Calculate reportedTotal:
   - If client provides: use client value
   - Otherwise: (reportedBulk × baseUnitAmount) + reportedPartial
3. Calculate variance = reportedTotal - expectedTotal
4. Calculate variancePercent = (variance / expectedTotal) × 100
5. Update inventory item with new bulk/partial/stock values
6. Return audit record with all calculated values
```

---

## 6. Cost Calculations

### 6.1 Add Inventory - Cost per Serving

```
totalCost = unitCost × bottlesAdded
servingsAdded = totalMlAdded ÷ servingSize
costPerServing = totalCost ÷ servingsAdded
```

### 6.2 Weighted Average Cost (DEPRECATED - Using Simple Cost)

**Note:** Previous versions used weighted averages. Current version stores simple cost per serving of most recent inventory addition.

---

## 7. Conversion Constants

| Constant  | Value        | Description             |
| --------- | ------------ | ----------------------- |
| `29.5735` | ml per fl oz | US fluid ounce          |
| `0.94`    | g/ml         | Default alcohol density |
| `1000`    | ml per liter | Liter to ml             |
| `1000`    | g per kg     | Kilogram to gram        |

---

## 8. Tracking Mode Logic

### 8.1 Auto-Detection (Bulk Import Failsafe)

```
if containerSize >= 100:
    trackingMode = "pool"  (ml-based)
else:
    trackingMode = "collection"  (unit-based)
```

### 8.2 Type Override

```
spirit → pool
mixer → pool
beer → collection
merch → collection
misc → collection
ingredient + liquid → pool
ingredient + weighted → collection
```

### 8.3 Display Logic

```
if trackingMode == "pool":
    show "Xml" (e.g., "750ml")
else if trackingMode == "collection":
    show "X units" (e.g., "24 units")
else:  // auto
    use type/subtype logic
```

### 8.4 Partial Display (No Weights)

```
if hasGlassWeight AND hasFullBottleWeight:
    show exact grams (e.g., "500g")
else if isPool:
    show "<Xml" (e.g., "<750ml" - honest about uncertainty)
else:
    show units
```

---

## 9. File Locations

| Calculation        | File                    | Lines       |
| ------------------ | ----------------------- | ----------- |
| ml ↔ oz conversion | Inventory.tsx           | 1133, 1141  |
| Serving cost       | Inventory.tsx           | 1200-1202   |
| Stock pooling      | Inventory.tsx           | 161-182     |
| Glass weight calc  | bulk-import.ts          | 213-217     |
| Weight to ml       | inventory.ts (backend)  | 17-31       |
| Partial to ml      | Inventory.tsx           | 1267-1284   |
| Variance           | InventoryAuditModal.tsx | 62-65       |
| Cost per serving   | Inventory.tsx           | 1533-1534   |
| **Audit variance** | **inventory.ts (API)**  | **593-710** |

---

## 10. Notes

- All internal calculations use **ml** for volume and **grams** for weight
- Display converts to user-friendly units (oz, bottles, cases)
- Density defaults to 0.94 (typical for spirits)
- Partial bottles without weight data show "<Xml" to indicate uncertainty
- Cost is stored as **cost per serving** (not per bottle or per ml)
