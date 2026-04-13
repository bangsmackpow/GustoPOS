# GustoPOS Testing Guide

This guide covers testing procedures for GustoPOS including unit tests, integration tests, and acceptance testing.

---

## Testing Overview

### Test Categories

| Category    | Scope                | Run Frequency  |
| ----------- | -------------------- | -------------- |
| Unit        | Individual functions | Every commit   |
| Integration | API endpoints        | Every commit   |
| Acceptance  | Full user flows      | Before release |
| Manual      | Exploratory          | As needed      |

### Running Tests

```bash
# Run all tests
pnpm run test

# Run with coverage
pnpm run test:coverage

# Run in watch mode
pnpm run test:watch
```

---

## Quality Checks

Before any commit or release, run:

```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Build
pnpm run build
```

---

## Test Environment Setup

### 1. Start Development Servers

```bash
pnpm run dev
```

### 2. Initialize Test Data

The system resets on each test run. Test sequence:

1. **Admin Login** → `POST /api/admin/login`

   ```json
   { "username": "GUSTO", "password": "ADMIN_PASSWORD" }
   ```

2. **Create Employee** → `POST /api/users`

   ```json
   {
     "firstName": "Test",
     "lastName": "Staff",
     "username": "teststaff",
     "pin": "1234",
     "role": "employee"
   }
   ```

3. **Start Shift** → `POST /api/shifts`

   ```json
   { "name": "Test Shift", "expectedCashMxn": 1000 }
   ```

4. **Add Inventory** → Direct SQL or via API

   ```sql
   INSERT INTO inventory_items (name, type, base_unit, base_unit_amount, current_bulk, order_cost)
   VALUES ('Test Vodka', 'spirit', 'ml', 750, 10, 150);
   ```

5. **Create Drinks** → `POST /api/drinks`

   ```json
   {
     "name": "Test Martini",
     "category": "cocktail",
     "actualPrice": 120,
     "isOnMenu": true
   }
   ```

6. **Create/Open Tab** → `POST /api/tabs`
   ```json
   { "nickname": "Test Tab" }
   ```

---

## Authentication Tests

### PIN Login

| Test            | Steps             | Expected Result          |
| --------------- | ----------------- | ------------------------ |
| Valid PIN       | Enter correct PIN | Login success, JWT token |
| Invalid PIN     | Enter wrong PIN   | Error: "Invalid PIN"     |
| Empty PIN       | Submit empty      | Error: "PIN required"    |
| Repeated digits | Enter 1111        | Success (allowed)        |

### Admin Login

| Test              | Steps                           | Expected Result                |
| ----------------- | ------------------------------- | ------------------------------ |
| Valid credentials | Enter correct username/password | Login success                  |
| Wrong password    | Enter wrong password            | Error: "Invalid credentials"   |
| Non-admin user    | Login as employee               | Error: "Admin access required" |

---

## Tab & Order Tests

### Create Tab

```bash
POST /api/tabs
{"nickname": "Table 1"}
```

**Expected**: 201 Created, tab with status "open"

### Add Order

```bash
POST /api/tabs/{tabId}/orders
{
  "drinkId": "{drinkId}",
  "quantity": 2,
  "notes": ""
}
```

**Expected**:

- 201 Created
- Order added to tab
- Tab total updated
- Inventory reserved

### Check Stock Reservation

```bash
GET /api/inventory/items/{itemId}
```

**Expected**: `reservedStock` increased by (amount × quantity)

### Update Order Quantity

```bash
PATCH /api/tabs/orders/{orderId}
{"quantity": 3}
```

**Expected**: Reserved stock adjusted

### Void Order

```bash
DELETE /api/tabs/orders/{orderId}
{
  "reason": "wrong_order",
  "managerUserId": "{adminId}",
  "managerPin": "0000"
}
```

**Expected**:

- Order marked as voided
- Reason recorded
- Reserved stock returned
- Order shows crossed out

### Close Tab

```bash
PATCH /api/tabs/{tabId}/close
{
  "paymentMethod": "cash",
  "tipMxn": 20,
  "closeType": "sale"
}
```

**Expected**:

- Tab status "closed"
- Inventory finalized (currentStock -= reservedStock)
- reservedStock = 0

---

## Inventory Tests

### Add Inventory Item

```bash
POST /api/inventory/items
{
  "name": "Test Rum",
  "type": "spirit",
  "baseUnit": "ml",
  "baseUnitAmount": 750,
  "currentBulk": 5,
  "currentPartial": 375,
  "orderCost": 200,
  "markupFactor": 3.0,
  "containerWeightG": 350,
  "fullBottleWeightG": 1050,
  "density": 0.94
}
```

**Expected**: Item created with calculated currentStock

### Stock Calculation (Pool)

Formula: `currentStock = (currentBulk × bottleSizeMl) + currentPartial`

**Verification**:

- currentBulk: 5
- currentPartial: 375ml
- Expected: 5 × 750 + 375 = 4125ml

### Stock Calculation (Collection)

**Verification**:

- unitsPerCase: 24
- currentBulk: 2
- Expected: 48 units

### Perform Audit

```bash
POST /api/inventory/items/{itemId}/audit
{
  "reportedBulk": 4,
  "reportedPartial": 400,
  "countedByUserId": "{userId}"
}
```

**Expected**:

- variance calculated
- lastAuditedAt updated
- currentStock updated

### View Variance History

```bash
GET /api/inventory/variance?days=30
```

**Expected**:

- List of items with variance
- Trend indicators
- Severity recommendations

---

## Reporting Tests

### Shift Report

```bash
GET /api/shifts/{shiftId}/report
```

**Expected**:

- Total sales
- Total orders
- Total tips
- Total voids
- Cash variance

### Void Analytics

```bash
GET /api/analytics/voids?startDate=2026-01-01&endDate=2026-12-31
```

**Expected**:

- totalVoids
- totalVoidValue
- voidRate
- byReason breakdown
- byStaff breakdown

### Period Close

```bash
POST /api/periods/{periodId}/close
```

**Expected**:

- Period status "closed"
- COGS calculated
- Totals populated

### COGS Report

```bash
GET /api/periods/{periodId}/cogs
```

**Expected**:

- List of items used
- Quantity used
- Unit cost
- Total cost

---

## CSV Export Tests

### Export Sales

```bash
GET /api/export/sales?startDate=2026-01-01&endDate=2026-01-31
```

**Expected**: CSV file with sales data

### Export Inventory

```bash
GET /api/export/inventory
```

**Expected**: CSV file with current stock

### Export COGS

```bash
GET /api/export/cogs?periodId={periodId}
```

**Expected**: CSV file with COGS entries

---

## Edge Cases

### Inventory

| Scenario      | Test                        | Expected                    |
| ------------- | --------------------------- | --------------------------- |
| Zero stock    | Add order when stock = 0    | Error: "Insufficient stock" |
| Partial order | Reserve more than available | Error: "Insufficient stock" |
| Delete tab    | Close tab with open orders  | Inventory returned          |
| Delete order  | Remove from open tab        | Reserved stock returned     |

### Tabs

| Scenario          | Test                      | Expected                    |
| ----------------- | ------------------------- | --------------------------- |
| Empty tab         | Close with no orders      | Error: "No orders to close" |
| Negative quantity | Submit quantity = -1      | Error: "Invalid quantity"   |
| Zero quantity     | Submit quantity = 0       | Order removed               |
| Double void       | Void already voided order | Error: "Already voided"     |

### Authentication

| Scenario      | Test                   | Expected               |
| ------------- | ---------------------- | ---------------------- |
| Expired token | Use expired JWT        | Error: "Token expired" |
| Invalid token | Use random string      | Error: "Invalid token" |
| Missing token | Request without header | Error: "Unauthorized"  |

---

## Bilingual Tests

### Language Toggle

1. On login screen, tap globe icon
2. Select "English" or "Spanish"
3. Verify all UI labels change

### Bilingual Data

1. Create drink with both names
   ```json
   {
     "name": "Margarita",
     "nameEs": "Margarita"
   }
   ```
2. Switch language
3. Verify name changes

---

## Performance Tests

### Response Times

| Endpoint                  | Target  |
| ------------------------- | ------- |
| GET /api/tabs             | < 100ms |
| POST /api/tabs/:id/orders | < 200ms |
| GET /api/inventory/items  | < 150ms |
| GET /api/reports/sales    | < 500ms |

### Load Testing

Use tools like k6 or Apache Bench to simulate concurrent users.

---

## Debugging

### Enable Debug Logs

Set environment:

```bash
DEBUG=*
```

### Check API Logs

Logs are in `./logs/` or console output.

### Database Inspection

```bash
sqlite3 ./data/gusto.db

# List tables
.tables

# View data
SELECT * FROM users;
SELECT * FROM tabs;
SELECT * FROM inventory_items;
```

---

## Test Checklist

Before release, verify:

- [ ] All authentication flows work
- [ ] Tab open → add orders → close works
- [ ] Inventory tracks correctly (pool & collection)
- [ ] Audits calculate variance correctly
- [ ] Reports generate accurate data
- [ ] CSV exports contain correct data
- [ ] Period close calculates COGS
- [ ] Void tracking works with reasons
- [ ] Language toggle works throughout
- [ ] Lint passes: `pnpm run lint`
- [ ] Typecheck passes: `pnpm run typecheck`
- [ ] Build succeeds: `pnpm run build`

---

## Related Documentation

- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [USER_GUIDE.md](USER_GUIDE.md) - Staff user guide
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Administrator guide
- [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) - Deployment guide
