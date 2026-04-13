# INVENTORY_MANUAL.md - GustoPOS Inventory System Guide

> **Last Updated**: April 10, 2026  
> **Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts](#key-concepts)
3. [Adding Inventory](#adding-inventory)
4. [Item Variants](#item-variants)
5. [Cost Tracking](#cost-tracking)
6. [Low Stock Alerts](#low-stock-alerts)
7. [Audit System](#audit-system)
8. [Trash & Recovery](#trash--recovery)

---

## Overview

GustoPOS inventory system is designed for bar operations with support for:

- Multiple alcohol types (spirits, beer, wine, mixers)
- Precise ml-tracking
- Parent/child item variants
- Weighted average cost tracking
- Low stock alerts

---

## Key Concepts

### Item Types

| Type   | Description    | Examples                |
| ------ | -------------- | ----------------------- |
| Spirit | Bottled liquor | Tequila, Vodka, Whiskey |
| Beer   | Beer/cider     | Draft, Bottle, Can      |
| Wine   | Wine           | Red, White, Sparkling   |
| Mixer  | Non-alcoholic  | Soda, Juice, Tonic      |

### Subtypes

**For Spirits:**

- tequila, mezcal, vodka, gin, whiskey, rum, brandy, other

**For Mixers:**

- bulk (from tap)
- prepackaged (bottled)

### Measurement Units

| Unit        | Abbreviation | Use Case             |
| ----------- | ------------ | -------------------- |
| Milliliters | ml           | Standard for spirits |
| Grams       | g            | Weight-based items   |
| Liters      | L            | Bulk items           |
| Ounces      | oz           | Display conversion   |

---

## Adding Inventory

### Using the Add Inventory Modal

The **+** button on any inventory item opens the Add Inventory modal:

```
┌────────────────────────────────┐
│  Add Inventory                │
│  ─────────────────────────     │
│  Tequila Jose Cuervo (750ml)  │
│                                │
│  Full Bottles    [ 5    ]     │
│                                │
│  Partial         [ 2.5  ]     │
│  (servings)                   │
│                                │
│  Unit Cost       [ $45.00 ]   │
│  ($ per full bottle)          │
│                                │
│  ─────────────────────────     │
│  Bottles added: 5             │
│  Servings added: 16.5         │
│  Total cost: $225.00          │
│                                │
│  [ + Add Inventory ]          │
└────────────────────────────────┘
```

### Fields Explained

| Field                  | Description                 | Example |
| ---------------------- | --------------------------- | ------- |
| **Full Bottles**       | Number of unopened bottles  | 5       |
| **Partial (servings)** | Servings from opened bottle | 2.5     |
| **Unit Cost**          | Price paid per full bottle  | $45.00  |

### How It Works

1. Enter full bottles + partial servings
2. Enter unit cost (if known)
3. Click "Add Inventory"
4. System calculates new weighted average cost

---

## Item Variants

### What Are Variants?

Variants are different sizes/versions of the same product that share a pool:

```
Tequila (Parent)
├── Tequila 750ml (Variation)
├── Tequila 1L (Variation)
└── Tequila 1.75L (Variation)
```

### Creating a Variant

1. Open the parent item for editing
2. Click **Add Variation** button
3. Enter variation details (name, size)
4. Save

### Viewing Pooled Stock

The table shows:

- Individual stock for each variation
- "Pooled Total" = sum of all variations

---

## Cost Tracking

### Weighted Average Cost

GustoPOS uses **weighted average** to calculate cost:

```
new_average = ((current_qty × current_cost) + (added_qty × unit_cost)) / (current_qty + added_qty)
```

### Example Calculation

**Initial state:**

- 10 bottles @ $10 each = $100 total cost

**Adding inventory:**

- Add 5 bottles @ $12 each = $60 added cost
- Total: 15 bottles, $160 total
- New average: $160 ÷ 15 = $10.67 per bottle

### Cost Per Serving

The system calculates:

```
Cost per Serving = Average Cost ÷ Serving Size
```

**Example:**

- Average cost: $10.67/bottle
- Bottle size: 750ml
- Serving size: 44ml (1.5oz)
- Servings per bottle: 17
- Cost per serving: $10.67 ÷ 17 = $0.63

### Viewing Cost Information

In the inventory table:

| Column       | Description                    |
| ------------ | ------------------------------ |
| **Avg $**    | Weighted average cost per unit |
| **Cost/Srv** | Cost per serving               |

---

## Low Stock Alerts

### Setting Thresholds

In Edit Item form, set **Low Stock Alert** threshold:

1. Open item for editing
2. Find "Low Stock Alert" field
3. Enter threshold (in base units)
4. Save

### Alert Display

Low stock items show:

- Warning icon (⚠️) in the stock column
- Appear in "Low Stock" filter

---

## Audit System

### What is Auditing?

Auditing reconciles physical inventory count vs. system inventory.

### Running an Audit

1. Go to inventory item
2. Select audit method:
   - **Count**: Physical count
   - **Weight**: Use scale
   - **Expected**: System calculates expected

### Variance Tracking

**Guest Logic:**

```
variance = physical_count - system_stock
```

**Advanced Logic:**

```
variance = reported_total - expected_total
```

### Audit History

All audits are stored with:

- Date/time
- User who performed
- Results (variance)
- Notes

---

## Trash & Recovery

### Deleting Items

When you delete an inventory item:

1. Item moves to trash (soft delete)
2. Hidden from normal view
3. Count shown in trash indicator

### Viewing Trash

1. Click "Trash Folder" in filter bar
2. See all deleted items
3. Can restore or permanently delete

### Permanent Delete

Admins can:

1. View trash
2. Click "Clear Trash"
3. Confirms deletion
4. Items permanently removed

---

## Best Practices

### For Cost Tracking

1. Always enter unit cost when adding inventory
2. Track all purchases to maintain accurate averages
3. Review cost per serving regularly

### For Stock Management

1. Perform regular audits (weekly recommended)
2. Set appropriate low stock thresholds
3. Keep variants organized under parents

### For Operations

1. Use the Add Inventory workflow consistently
2. Train all staff on proper inventory entry
3. Review reports to identify issues early

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Technical details
- [USER_GUIDE.md](../USER_GUIDE.md) - Staff operations
- [OFFLINE_DESKTOP_GUIDE.md](../OFFLINE_DESKTOP_GUIDE.md) - App guide
