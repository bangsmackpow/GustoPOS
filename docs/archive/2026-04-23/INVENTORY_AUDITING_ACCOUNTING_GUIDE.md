# GustoPOS Inventory Auditing & Accounting Guide

**Version:** 1.0  
**Date:** April 15, 2026  
**For:** Managers, Inventory Controllers, Accountants

---

## Table of Contents

1. [Overview](#overview)
2. [Inventory Tracking Modes](#inventory-tracking-modes)
3. [Individual Item Audits](#individual-item-audits)
4. [Batch Audit Sessions](#batch-audit-sessions)
5. [Variance Analysis](#variance-analysis)
6. [Cost Calculations](#cost-calculations)
7. [Period Closing & COGS](#period-closing--cogs)
8. [Reports & Export](#reports--export)
9. [Audit Compliance](#audit-compliance)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

This guide covers inventory auditing workflows and accounting processes for GustoPOS. It is designed for managers and inventory controllers who need to:

- Track physical inventory against system records
- Analyze variance and identify discrepancies
- Calculate cost of goods sold (COGS)
- Generate accounting reports

### Key Concepts

| Term              | Definition                                    |
| ----------------- | --------------------------------------------- |
| **Current Stock** | Total inventory value (bulk × size + partial) |
| **Bulk**          | Number of full, sealed containers             |
| **Partial**       | Amount in open/partial containers             |
| **Variance**      | Difference between expected and actual counts |
| **COGS**          | Cost of Goods Sold during a period            |

---

## Inventory Tracking Modes

### Pool Mode (Weight-Based)

Used for: Spirits, Mixers, Liquid Ingredients

**How it works:**

- Tracks liquid volume in milliliters (ml)
- Measures partial bottles by weight (grams)
- Uses density to convert weight to volume

**Required fields:**

- Bottle Size (ml)
- Full Bottle Weight (grams)
- Container Weight (grams)
- Density (default: 0.94)

**Calculation:**

```
Current Stock (ml) = (Full Bottles × Bottle Size) + Partial Weight (g)
```

### Collection Mode (Unit-Based)

Used for: Beer, Merchandise, Misc items

**How it works:**

- Tracks items by individual units
- Cases and loose units

**Required fields:**

- Units Per Case
- Current Bulk (cases)
- Current Partial (loose units)

**Calculation:**

```
Current Stock (units) = (Full Cases × Units Per Case) + Loose Units
```

### Auto Mode

- System determines tracking mode based on item type
- Spirit/Mixer → Pool
- Beer/Merch/Misc → Collection

---

## Individual Item Audits

### When to Audit Individual Items

- Random spot checks
- Suspicion of theft or waste
- After a spill or break
- When variance is suspected

### Step-by-Step Individual Audit

1. **Navigate to Inventory**
   - Click **Inventory** in sidebar

2. **Find the Item**
   - Search or browse to find the item
   - Click on the item row OR click the Settings icon

3. **Open Audit Modal**
   - Click the **Audit Item** button (in the Edit Item modal)

4. **Choose Entry Method**

   **Method A: Bulk + Partial**

   ```
   - Enter number of Full Bottles/Sealed Cases
   - Enter weight of Open Bottle (grams) OR loose units
   ```

   **Method B: Total Only**

   ```
   - Enter total count directly
   - System calculates bulk and partial
   ```

5. **Submit Audit**
   - Click **Submit Audit**
   - Variance is calculated automatically

### Understanding Audit Results

After submission, you'll see:

| Field                    | Description                      |
| ------------------------ | -------------------------------- |
| **Expected Total**       | What system thought you had      |
| **Reported Total**       | What you counted                 |
| **Variance**             | Difference (reported - expected) |
| **Variance %**           | Variance as percentage           |
| **Variance in Servings** | Number of servings affected      |

### Variance Display

| Variance | Indicator | Action               |
| -------- | --------- | -------------------- |
| 0%       | ✓ Green   | Normal               |
| 1-5%     | 🟡 Yellow | Monitor              |
| >5%      | 🔴 Red    | Requires explanation |

**Note:** When variance exceeds 5%, you must select a reason:

- Spillage
- Wastage
- Counting error
- Theft suspected
- Manager override
- Other

---

## Batch Audit Sessions

### When to Use Batch Audits

- End of shift counts
- Weekly inventory checks
- Full monthly audit
- After high-volume events

### Creating a Batch Audit Session

1. **Go to Settings**
   - Click **Settings** in sidebar
   - Scroll to **Audit Logs** section

2. **Click Batch Audit**
   - Button in Audit Logs section

3. **Select Filter**
   - All Items
   - Spirits Only
   - Beer Only
   - Mixers Only
   - Ingredients Only

4. **Session Created**
   - You're redirected to Batch Audit page
   - Shows list of items to audit

### Completing a Batch Audit

1. **On Batch Audit Page**
   - See all items in the session
   - Items organized by category

2. **Audit Each Item**
   - Click on an item
   - Enter count
   - Submit

3. **Track Progress**
   - Progress bar shows completion
   - Items marked as audited

4. **Complete Session**
   - When all items audited, click **Complete Session**
   - Summary generated

### Batch Audit Summary

After completion, view:

| Metric         | Description               |
| -------------- | ------------------------- |
| Total Items    | Items in session          |
| Audited        | Items counted             |
| With Variance  | Items showing differences |
| Total Variance | Sum of all variances      |

---

## Variance Analysis

### Accessing Variance Analysis

1. **Go to Inventory**
2. **Click Variance Analysis** (in sidebar under Quick Filters)

### Variance Dashboard

The Variance Analysis page shows:

| Card                | Description                |
| ------------------- | -------------------------- |
| Total Audits        | Number of audits performed |
| Items Audited       | Unique items counted       |
| Items with Variance | Items showing differences  |

### Recommendations Engine

The system analyzes variance patterns and provides recommendations:

| Issue Type              | Description       | Threshold                              |
| ----------------------- | ----------------- | -------------------------------------- |
| **Consistent Underage** | Regular shortage  | >50% negative audits, >5% avg variance |
| **Consistent Overage**  | Regular overcount | >50% positive audits, >5% avg variance |
| **High Volatility**     | Unstable counts   | Range >50, ≥3 audits                   |
| **Recent Significant**  | Sudden change     | >10% in latest audit                   |

### Severity Levels

| Level        | Color     | Meaning                      |
| ------------ | --------- | ---------------------------- |
| **Critical** | 🔴 Red    | Immediate attention required |
| **High**     | 🟠 Orange | Investigate soon             |
| **Medium**   | 🟡 Yellow | Monitor                      |
| **Low**      | 🟢 Green  | Normal variation             |

### Filtering Variance Data

Filter by time period:

- Last 7 days
- Last 30 days
- Last 90 days

---

## Cost Calculations

### Understanding Cost Fields

| Field                | Purpose                                   |
| -------------------- | ----------------------------------------- |
| **Order Cost**       | Price paid per bottle/case                |
| **Cost Per Serving** | Cost of one serving                       |
| **Cost Per ml**      | Cost per milliliter                       |
| **Suggested Price**  | Menu price based on markup                |
| **Markup Factor**    | Multiplier for pricing (e.g., 3.0 = 300%) |

### Cost Calculation Formulas

**Cost Per ml:**

```
Cost Per ml = Order Cost ÷ Bottle Size (ml)
```

**Cost Per Serving:**

```
Cost Per Serving = Cost Per ml × Serving Size (ml)
```

**Suggested Price:**

```
Suggested Price = Cost Per Serving × Markup Factor
```

**Example:**

```
Order Cost: $15.00 (750ml bottle)
Cost Per ml: $15.00 ÷ 750 = $0.02
Serving Size: 44.36ml
Cost Per Serving: $0.02 × 44.36 = $0.89
Markup Factor: 3.0
Suggested Price: $0.89 × 3.0 = $2.67
```

### Bulk Inventory Cost Tracking

**Adding new inventory:**

```
Total Cost = Cost Per Bottle × Number of Bottles
```

**Average cost is NOT calculated** - system uses the cost of newly added inventory only.

---

## Period Closing & COGS

### Understanding Periods

A **Period** is an accounting timeframe for tracking:

- Sales revenue
- Cost of goods sold
- Inventory changes

**Note:** Period management UI is not yet implemented in the frontend. API endpoints exist at `/api/periods` for programmatic access.

### Creating a New Period

1. Go to Reports or Settings
2. Click Create Period
3. Enter period details:
   - Name (e.g., "April 2026")
   - Start date
   - End date

**Note:** GUI for period creation not yet available. API access only.

### Closing a Period

**Prerequisites:**

- All tabs in period must be closed
- All shifts in period must be closed

**Step-by-Step:**

1. **Navigate to Periods**
   - Go to **Reports** > **Periods**

2. **Select Period to Close**
   - Find the period
   - Click **Close Period**

3. **Review Summary**
   - Total Sales
   - Total COGS
   - Gross Profit
   - Inventory Changes

4. **Confirm Close**
   - Click **Confirm**
   - Period is now closed and read-only

### COGS Calculation

**COGS (Cost of Goods Sold):**

```
Beginning Inventory + Purchases - Ending Inventory = COGS
```

**In GustoPOS:**

```
COGS = Sum of (Order Cost × Quantity Sold) during period
```

### Viewing COGS Reports

1. Go to Reports
2. Click Period Reports
3. Select Period
4. View COGS breakdown by category

**Note:** Period and COGS GUI not yet implemented. API endpoints available for programmatic access.

---

## Reports & Export

### Available Reports

| Report            | Description       | Location |
| ----------------- | ----------------- | -------- |
| Sales Summary     | Revenue by period | Reports  |
| Staff Performance | Sales by staff    | Reports  |
| Void Analysis     | Voided orders     | Reports  |
| Top Sellers       | Best drinks       | Reports  |
| Inventory Value   | Stock worth       | Reports  |
| COGS Report       | Cost analysis     | Reports  |
| Audit Logs        | All audits        | Settings |

### Exporting Data

**Location:** Settings > Data Export (Admin only)

**Available Exports:**

| Export     | Format | Contents                |
| ---------- | ------ | ----------------------- |
| Sales      | CSV    | All tab and order data  |
| Inventory  | CSV    | Current stock levels    |
| COGS       | CSV    | Cost of goods by period |
| Audit Logs | CSV    | All audit records       |
| Periods    | CSV    | Period summaries        |

### Export Procedure

1. Click **Export** next to desired report
2. File downloads automatically
3. Filename includes date range

---

## Audit Compliance

### Audit Requirements

| Threshold      | Requirement             |
| -------------- | ----------------------- |
| Variance < 5%  | No action needed        |
| Variance 5-10% | Document reason         |
| Variance > 10% | Manager review required |

### Required Documentation

For significant variances (>5%), record:

1. **Reason code**
2. **Staff member who audited**
3. **Date and time**
4. **Additional notes** (optional)

### Audit Frequency Recommendations

| Item Type   | Recommended Frequency |
| ----------- | --------------------- |
| Spirits     | Weekly                |
| Beer        | Weekly                |
| Mixers      | Bi-weekly             |
| Merchandise | Monthly               |

### Audit Best Practices

1. **Consistency** - Audit at the same time each session
2. **Full count** - Don't estimate
3. **Weigh accurately** - Calibrate scales regularly
4. **Document immediately** - Record variance reasons right away
5. **Review trends** - Check variance analysis weekly

---

## Troubleshooting

### Common Issues

| Issue                      | Cause                   | Solution                    |
| -------------------------- | ----------------------- | --------------------------- |
| Audit won't submit         | Missing required fields | Fill all fields             |
| Variance >5% but no reason | Required reason missing | Select reason from dropdown |
| Stock shows negative       | Over-deduction          | Contact manager             |
| Can't close period         | Open tabs remain        | Close all tabs first        |
| Export fails               | Permission issue        | Verify admin access         |

### Variance Investigation Steps

1. **Verify audit count** - Was the count accurate?
2. **Check for spills** - Any documented losses?
3. **Review orders** - Were all orders properly recorded?
4. **Compare POS vs physical** - System vs actual
5. **Document findings** - Record investigation in notes

### Scale Calibration

For accurate weight-based tracking:

1. **Calibrate monthly**
2. **Use certified weights**
3. **Keep scale clean**
4. **Replace batteries regularly**

---

## Quick Reference

### Audit Entry Methods

| Method             | Best For                   |
| ------------------ | -------------------------- |
| **Bulk + Partial** | Most common, most accurate |
| **Total Only**     | Quick counts,经验的 staff  |

### Variance Thresholds

| Variance | Action          |
| -------- | --------------- |
| 0%       | ✓ Perfect       |
| 1-5%     | Monitor         |
| 5-10%    | Document reason |
| >10%     | Manager review  |

### Stock Calculation

**Pool (Weight-Based):**

```
Total ml = (Full Bottles × Bottle Size) + Partial Weight
```

**Collection (Unit-Based):**

```
Total units = (Full Cases × Units Per Case) + Loose Units
```

### COGS Formula

```
COGS = Beginning Inventory + Purchases - Ending Inventory
```

---

## Appendix: API Reference

### Audit Endpoints

| Endpoint                                 | Method | Purpose                 |
| ---------------------------------------- | ------ | ----------------------- |
| `/api/inventory/items/:id/audit`         | POST   | Submit individual audit |
| `/api/inventory/audit-sessions`          | GET    | List audit sessions     |
| `/api/inventory/audit-sessions`          | POST   | Create batch session    |
| `/api/inventory-audits/variance-summary` | GET    | Variance analysis       |

### Period Endpoints

| Endpoint                 | Method | Purpose         |
| ------------------------ | ------ | --------------- |
| `/api/periods`           | GET    | List periods    |
| `/api/periods`           | POST   | Create period   |
| `/api/periods/:id/close` | POST   | Close period    |
| `/api/periods/:id/cogs`  | GET    | COGS for period |

### Export Endpoints

| Endpoint                 | Method | Purpose        |
| ------------------------ | ------ | -------------- |
| `/api/export/sales`      | GET    | Sales CSV      |
| `/api/export/inventory`  | GET    | Inventory CSV  |
| `/api/export/cogs`       | GET    | COGS CSV       |
| `/api/export/audit-logs` | GET    | Audit logs CSV |

---

_End of Inventory Auditing & Accounting Guide_
