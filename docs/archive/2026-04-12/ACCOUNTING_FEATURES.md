# GustoPOS Accounting Features Guide

**Last Updated**: April 12, 2026  
**Version**: 1.0

---

## Overview

GustoPOS now includes essential accounting features for small business inventory management:

1. **Period Closing** - End-of-period financial summaries
2. **COGS Tracking** - Cost of goods sold by period
3. **Manager Authorization** - Dual control for voids
4. **CSV Export** - Data export for accounting software

---

## Period Closing System

### Purpose

Close a period (day/week/month) to calculate financial totals and lock the data.

### Creating a Period

```bash
# Create a daily period
POST /api/periods
{
  "name": "April 12, 2026",
  "periodType": "daily",
  "startDate": 1741824000,
  "endDate": 1741910400
}
```

### Closing a Period

```bash
POST /api/periods/{periodId}/close
{
  "closedByUserId": "admin-user-id"
}
```

**Response includes:**

- `totalSalesMxn` - Total revenue from all closed tabs
- `cogsMxn` - Cost of goods sold (calculated from inventory usage)
- `totalTipsMxn` - Total tips
- `totalDiscountsMxn` - Total discounts given
- `totalVoidsMxn` - Total value of voided orders
- `profitMxn` - Calculated as totalSales - cogs

---

## Manager Authorization for Voids

### Purpose

Require manager approval when voiding orders to maintain internal controls.

### API Change

The void endpoint now requires manager credentials:

```bash
DELETE /api/tabs/orders/{orderId}
{
  "reason": "customer_changed_mind",
  "voidedByUserId": "staff-user-id",
  "managerUserId": "admin-user-id",
  "managerPin": "1234"
}
```

### Error Codes

| Code               | Description                 |
| ------------------ | --------------------------- |
| `MANAGER_REQUIRED` | Missing manager credentials |
| `INVALID_MANAGER`  | User is not admin role      |
| `INVALID_PIN`      | PIN verification failed     |

---

## CSV Export

All exports require admin role authentication.

### Available Exports

| Endpoint                 | Description       |
| ------------------------ | ----------------- |
| `/api/export/sales`      | Sales by tab      |
| `/api/export/inventory`  | Current inventory |
| `/api/export/cogs`       | COGS by period    |
| `/api/export/audit-logs` | Event history     |
| `/api/export/periods`    | Period summaries  |

### Sales Export

```bash
GET /api/export/sales?startDate=1741824000&endDate=1741910400
```

Returns CSV with columns:

- tabId, nickname, staffUserId, openedAt, closedAt
- totalMxn, tipMxn, discountMxn, paymentMethod
- orderCount, status

### Inventory Export

```bash
GET /api/export/inventory
```

Returns CSV with all inventory fields:

- id, name, type, currentBulk, currentPartial, currentStock
- orderCost, servingSize, density, lowStockThreshold, etc.

### COGS Export

```bash
GET /api/export/cogs?periodId={periodId}
```

Returns CSV with:

- itemName, quantityUsed, unitCost, totalCost, category

### Audit Logs Export

```bash
GET /api/export/audit-logs?startDate=1741824000&endDate=1741910400&limit=1000
```

Returns CSV with:

- id, userId, action, entityType, entityId
- oldValue, newValue, reason, createdAt

---

## Database Schema

### periods table

| Field             | Type    | Description          |
| ----------------- | ------- | -------------------- |
| id                | UUID    | Primary key          |
| name              | String  | Period name          |
| periodType        | String  | daily/weekly/monthly |
| startDate         | Integer | Unix timestamp       |
| endDate           | Integer | Unix timestamp       |
| status            | String  | open/closed          |
| closedAt          | Integer | When closed          |
| closedByUserId    | String  | Who closed           |
| totalSalesMxn     | Real    | Revenue              |
| totalCostMxn      | Real    | Total cost           |
| cogsMxn           | Real    | Cost of goods sold   |
| totalTipsMxn      | Real    | Tips                 |
| totalDiscountsMxn | Real    | Discounts            |
| totalVoidsMxn     | Real    | Voids                |

### cogs_entries table

| Field        | Type   | Description     |
| ------------ | ------ | --------------- |
| id           | UUID   | Primary key     |
| periodId     | UUID   | FK to periods   |
| itemId       | UUID   | FK to inventory |
| itemName     | String | Item name       |
| quantityUsed | Real   | Amount used     |
| unitCost     | Real   | Cost per unit   |
| totalCost    | Real   | Total cost      |
| category     | String | Item type       |

---

## Workflow Example: End of Day

1. **Create Period** (if not auto-created)

   ```bash
   POST /api/periods
   ```

2. **Close Shift** - Sales happen throughout the day

3. **Close Period** at end of day

   ```bash
   POST /api/periods/{id}/close
   ```

4. **Export Reports** for accounting

   ```bash
   GET /api/export/sales
   GET /api/export/cogs
   GET /api/export/periods
   ```

5. **Import** into QuickBooks/Xero

---

## Permissions

| Action                 | Required Role     |
| ---------------------- | ----------------- |
| View periods           | admin             |
| Create period          | admin             |
| Close period           | admin             |
| Export sales           | admin             |
| Export inventory       | admin             |
| Export COGS            | admin             |
| Export audit logs      | admin             |
| Void order (with auth) | staff + admin PIN |
