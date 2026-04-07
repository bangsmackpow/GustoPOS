# GustoPOS — API Reference

**Version:** 1.0  
**Base URL:** `/api`  
**Last Updated:** 2026-04-04

---

## Authentication

Sessions are managed via httpOnly cookies containing JWT tokens. The global auth middleware runs on every request and attaches `req.user` if a valid session exists.

| Level             | Description                |
| ----------------- | -------------------------- |
| **Public**        | No authentication required |
| **Authenticated** | Any valid session cookie   |
| **Admin**         | Requires `admin` role      |

### Session Headers

| Property           | Value                   |
| ------------------ | ----------------------- |
| Cookie name        | `sid`                   |
| Max age            | 7 days                  |
| Inactivity timeout | 1 hour                  |
| Security           | httpOnly, sameSite: lax |

---

## Health

### `GET /api/healthz`

**Auth:** Public  
**Response (200):**

```json
{ "status": "ok" }
```

### `GET /api/ready`

**Auth:** Public  
**Response (200):**

```json
{ "status": "ok", "database": "connected" }
```

**Response (503):**

```json
{ "status": "error", "database": "disconnected", "error": "string" }
```

---

## Auth

### `GET /api/auth/user`

**Auth:** Public  
**Response (200) — authenticated:**

```json
{
  "isAuthenticated": true,
  "user": {
    "id": "string",
    "email": "string | null",
    "firstName": "string | null",
    "lastName": "string | null",
    "role": "string",
    "language": "string"
  }
}
```

**Response (200) — unauthenticated:**

```json
{ "isAuthenticated": false, "user": null }
```

### `GET /api/auth/logout`

**Auth:** Public  
**Response (200):** `{ "success": true }`  
**Side effect:** Clears session cookie

### `POST /api/auth/reset-password`

**Auth:** Public  
**Request Body:**

```json
{ "email": "string", "pin": "string", "newPassword": "string" }
```

**Response (200):** `{ "success": true, "message": "Password reset successfully" }`  
**Errors:** 400 (missing fields), 401 (invalid PIN), 404 (user not found)

---

## Login

### `POST /api/admin/login`

**Auth:** Public · **Rate Limited:** 5 attempts / 15 min  
**Request Body:**

```json
{ "email": "string", "password": "string" }
```

**Response (200):** `{ "ok": true, "user": { ... } }`  
**Errors:** 400 (missing fields), 401 (invalid credentials), 403 (disabled or insufficient permissions)

### `POST /api/pin-login`

**Auth:** Public · **Rate Limited:** 5 attempts / 15 min  
**Request Body:**

```json
{ "email": "string", "pin": "string" }
```

**Response (200):** `{ "ok": true, "user": { ... } }`  
**Errors:** 400 (missing fields or invalid PIN format), 401 (invalid)

### `POST /api/login`

**Auth:** Public · **Note:** Only active when `DEV_LOGIN=true`  
**Request Body:**

```json
{ "email": "string", "password": "string" }
```

---

## Users (Admin Only)

### `GET /api/users`

**Auth:** Admin  
**Response (200):** Array of user objects (no PIN or password fields)

### `POST /api/users`

**Auth:** Admin  
**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string | null",
  "email": "string | null",
  "role": "admin | manager | head_bartender | bartender | server",
  "language": "en | es",
  "pin": "string",
  "password": "string | null"
}
```

**Response (201):** User object  
**Errors:** 400 (validation), 409 (duplicate email)

### `PATCH /api/users/:id`

**Auth:** Admin  
**Request Body:** Any user field (partial update)  
**Response (200):** Updated user object  
**Errors:** 400 (validation), 404 (not found)

### `DELETE /api/users/:id`

**Auth:** Admin  
**Response (200):** `{ "success": true }`

### `POST /api/users/:id/reset-password`

**Auth:** Admin  
**Request Body:** `{ "newPassword": "string" }`  
**Response (200):** `{ "success": true }`  
**Errors:** 400 (min 4 chars), 404 (not found)

---

## Ingredients

### `GET /api/ingredients`

**Auth:** Public  
**Response (200):** Array of ingredient objects

### `POST /api/ingredients`

**Auth:** Public  
**Request Body:** `{ "name": "string", "baseUnit": "string", "baseUnitAmount": "number", "servingSize": "number", "currentStock": "number", ... }`  
**Response (201):** Ingredient object

### `GET /api/ingredients/:id`

**Auth:** Public  
**Response (200):** Ingredient object · **Errors:** 404

### `PATCH /api/ingredients/:id`

**Auth:** Public  
**Request Body:** Any ingredient field (partial)  
**Response (200):** Updated ingredient object

### `DELETE /api/ingredients/:id`

**Auth:** Public  
**Response (200):** `{ "success": true }`

---

## Inventory

### `GET /api/inventory/items`

**Auth:** Public  
**Response (200):** Array of inventory items (excludes soft-deleted)

### `GET /api/inventory/low-stock`

**Auth:** Public  
**Response (200):** Array of items where `currentStock < lowStockThreshold`

### `GET /api/inventory/items/:id`

**Auth:** Public · **Response (200):** Inventory item

### `POST /api/inventory/items`

**Auth:** Public  
**Request Body:** Full inventory item object  
**Response (200):** Created item

### `PATCH /api/inventory/items/:id`

**Auth:** Public  
**Request Body:** Partial inventory item. Note: toggling `isOnMenu` also toggles linked drink.  
**Response (200):** Updated item

### `DELETE /api/inventory/items/:id`

**Auth:** Public  
**Response (200):** `{ "ok": true }` (soft delete)

### `POST /api/inventory/items/:id/weigh`

**Auth:** Public  
**Request Body:** `{ "weightG": "number", "countedByUserId": "string" }`  
**Response (200):** `{ "ok": true, "item": {...}, "remainingBaseUnits": "number" }`

### `GET /api/inventory/items/:id/counts`

**Auth:** Public  
**Response (200):** Array of count records (up to 50, most recent first)

---

## Drinks

### `GET /api/drinks`

**Auth:** Public  
**Response (200):** Array of drink objects with computed recipe/cost data

### `POST /api/drinks`

**Auth:** Public  
**Request Body:** `{ "name": "string", "category": "string", "recipe": [{ "ingredientId": "string", "amountInBaseUnit": "number" }], ... }`  
**Response (201):** Drink object with computed fields

### `GET /api/drinks/:id`

**Auth:** Public · **Response (200):** Drink object · **Errors:** 404

### `PATCH /api/drinks/:id`

**Auth:** Public  
**Request Body:** Partial drink object. Providing `recipe` replaces entire recipe.  
**Response (200):** Updated drink object

### `DELETE /api/drinks/:id`

**Auth:** Public  
**Response (200):** `{ "success": true }` (soft delete)

---

## Tabs & Orders

### `GET /api/tabs`

**Auth:** Public  
**Query:** `status?: "open" | "closed" | "all"`, `shiftId?: string`  
**Response (200):** Array of tab objects

### `POST /api/tabs`

**Auth:** Public  
**Request Body:** `{ "nickname": "string", "staffUserId": "string", "currency": "MXN | USD | CAD", ... }`  
**Response (201):** Tab object

### `GET /api/tabs/:id`

**Auth:** Public  
**Response (200):** Tab object with embedded orders array

### `PATCH /api/tabs/:id`

**Auth:** Public  
**Request Body:** `{ "nickname": "string | null", "notes": "string | null", "currency": "string | null" }`  
**Response (200):** Updated tab object

### `POST /api/tabs/:id/close`

**Auth:** Public  
**Request Body (single payment):**

```json
{ "paymentMethod": "cash | card", "notes": "string | null", "tipMxn": "number" }
```

**Request Body (split bill):**

```json
{
  "notes": "string | null",
  "payments": [
    {
      "amountMxn": "number",
      "tipMxn": "number",
      "paymentMethod": "cash | card"
    }
  ]
}
```

**Response (200):** Closed tab object  
**Errors:** 400 (validation or payment mismatch)

### `DELETE /api/tabs/:id`

**Auth:** Public  
**Response (200):** `{ "success": true }` (also deletes associated orders)

### `POST /api/tabs/:id/orders`

**Auth:** Public  
**Request Body:** `{ "drinkId": "string", "quantity": "number", "notes": "string | null" }`  
**Response (201):** Order object  
**Errors:** 400 (closed tab), 404 (tab or drink not found)

### `PATCH /api/orders/:id`

**Auth:** Public  
**Request Body:** `{ "quantity": "number | null", "notes": "string | null" }`  
**Response (200):** Updated order object

### `DELETE /api/orders/:id`

**Auth:** Public  
**Response (200):** `{ "success": true }` (restores inventory)

### `PATCH /api/tabs/:id/apply-code`

**Auth:** Public  
**Request Body:** `{ "promoCode": "string" }`  
**Response (200):** `{ "id": "string", "discountMxn": "number", "promoCodeId": "string | null" }`

---

## Shifts

### `GET /api/shifts`

**Auth:** Public  
**Response (200):** Array of shift objects

### `POST /api/shifts`

**Auth:** Public  
**Request Body:** `{ "name": "string", "openedByUserId": "string" }`  
**Response (201):** Shift object  
**Errors:** 400 (active shift already exists)

### `GET /api/shifts/active`

**Auth:** Public  
**Response (200):** `{ "shift": shiftObject | null }`

### `POST /api/shifts/:id/close`

**Auth:** Public  
**Request Body:** `{ "force": "boolean" }`  
**Response (200):** Closed shift object  
**Errors:** 400 (open tabs exist, unless force=true)

### `GET /api/reports/end-of-night/:shiftId`

**Auth:** Public  
**Response (200):** Full end-of-night report with sales, staff, drinks, categories, inventory used, low stock alerts

---

## Settings

### `GET /api/settings`

**Auth:** Public  
**Response (200):** Settings object (exchange rates, markup, bar config, PIN lock timeout)

### `PATCH /api/settings`

**Auth:** Admin  
**Request Body:** Any settings field (partial)  
**Response (200):** Updated settings object  
**Errors:** 401 (not authenticated), 403 (not admin)

---

## Rush Events

### `GET /api/rushes`

**Auth:** Public · **Response (200):** Array of rush event objects

### `POST /api/rushes`

**Auth:** Public  
**Request Body:** `{ "title": "string", "startTime": "date", "impact": "low | medium | high", "type": "cruise | festival | music | other", ... }`  
**Response (201):** Rush object

---

## Audit Logs (Admin Only)

### `GET /api/audit-logs`

**Auth:** Admin  
**Query:** `limit?: number`, `offset?: number`, `entityType?: string`, `userId?: string`  
**Response (200):** Array of audit log entries with user name resolution

---

## Promo Codes

### `GET /api/promo-codes/:code`

**Auth:** Public  
**Response (200):** Promo code object with validation status  
**Errors:** 400 (inactive, expired, max uses reached), 404 (not found)

---

## Analytics

### `GET /api/analytics/sales`

**Auth:** Public  
**Query:** `startDate?: ISO date`, `endDate?: ISO date`  
**Response (200):** Sales summary, by drink, by staff, hourly breakdown

### `GET /api/analytics/inventory/forecast`

**Auth:** Public  
**Query:** `days?: 7 | 14 | 30`  
**Response (200):** Inventory forecasts with velocity, days until stockout, alert levels

---

## Staff Performance

### `GET /api/staff-performance/:shiftId`

**Auth:** Public  
**Response (200):** Staff metrics with rankings, revenue, tips, orders/hour, revenue/hour

### `POST /api/staff-performance/recalculate/:shiftId`

**Auth:** Public  
**Response (200):** `{ "success": true, "message": "Performance metrics recalculated", "shiftId": "string", "staffCount": "number" }`

---

## Staff Shifts

### `GET /api/staff-shifts/:shiftId`

**Auth:** Public  
**Response (200):** Array of staff shift records with hours worked

### `POST /api/staff-shifts/clock-in`

**Auth:** Public  
**Request Body:** `{ "shiftId": "string", "staffUserId": "string", "notes": "string" }`  
**Response (200):** `{ "success": true, "shift": { ... } }`

### `POST /api/staff-shifts/clock-out`

**Auth:** Public  
**Request Body:** `{ "staffShiftId": "string", "notes": "string" }`  
**Response (200):** `{ "success": true, "shift": { ... } }`

---

## Tax Rates

### `GET /api/tax-rates`

**Auth:** Public · **Response (200):** `{ "rates": [...] }`

### `GET /api/tax-rates/config`

**Auth:** Public · **Response (200):** `{ "defaultRate": "number", "rates": { ... }, "lastUpdated": "ISO" }`

### `GET /api/tax-rates/:category`

**Auth:** Public · **Response (200):** Tax rate object

### `POST /api/tax-rates/:category`

**Auth:** Public  
**Request Body:** `{ "category": "string", "rate": "number", "description": "string" }`  
**Response (200):** `{ "success": true, "rate": { ... } }`

---

## Bulk Import (Admin Only)

### `POST /api/admin/bulk-ingredients`

**Auth:** Admin  
**Request Body:** `{ "ingredients": [{ "name": "string", "type": "string", "baseUnit": "string", ... }] }`  
**Response (200):** `{ "success": true, "count": "number", "message": "string" }`

### `POST /api/admin/bulk-drinks`

**Auth:** Admin  
**Request Body:** `{ "drinks": [{ "name": "string", "category": "string", "recipe": [{ ... }], ... }] }`  
**Response (200):** `{ "success": true, "count": "number", "message": "string" }`

---

## Admin

### `POST /api/admin/reset-database`

**Auth:** Admin  
**Response (200):** `{ "ok": true, "message": "Database reset successfully" }`

---

## Inventory Audits

### `GET /api/inventory-audits/history`

**Auth:** Public  
**Query:** `itemId?: string`, `days?: number`, `varianceOnly?: "true"`  
**Response (200):** Audit history with variances

### `GET /api/inventory-audits/variance-summary`

**Auth:** Public  
**Query:** `days?: number`  
**Response (200):** Variance summary with recommendations

### `POST /api/inventory-audits`

**Auth:** Public  
**Request Body:** `{ "itemId": "string", "physicalCount": "number", "auditedByUserId": "string", ... }`  
**Response (200):** `{ "success": true, "audit": { ... } }`

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "string",
  "details": "object (optional)",
  "message": "string (optional)"
}
```

| Status Code | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| 400         | Bad Request — invalid input or validation failure             |
| 401         | Unauthorized — authentication required                        |
| 403         | Forbidden — insufficient permissions                          |
| 404         | Not Found — resource doesn't exist                            |
| 409         | Conflict — duplicate resource (e.g., email)                   |
| 429         | Too Many Requests — rate limit exceeded                       |
| 500         | Internal Server Error                                         |
| 503         | Service Unavailable — database disconnected (readiness check) |
