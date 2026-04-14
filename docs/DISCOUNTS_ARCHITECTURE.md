# GustoPOS Discounts/Specials Feature - Architecture & Integration Guide

## Executive Summary

GustoPOS has **existing database tables** for both **Promo Codes** (`promoCodesTable`) and **Specials** (`specialsTable`), with partial API support for promo codes. This guide outlines the current architecture and how to extend both systems for a complete discount feature.

---

## 1. CURRENT DATABASE SCHEMA

### 1.1 Existing Tables

#### **PromoCodesTable** (lib/db/src/schema/gusto.ts: lines 273-291)
```typescript
export const promoCodesTable = sqliteTable("promo_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: real("discount_value").notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: integer("expires_at"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});
```

**Characteristics:**
- Global codes (not drink-specific)
- Discount types: `percentage` or `fixed_amount`
- Usage tracking with max limits
- Expiration dates (unix seconds)
- Already used in tabs table as `promoCodeId`

#### **SpecialsTable** (lib/db/src/schema/gusto.ts: lines 293-312)
```typescript
export const specialsTable = sqliteTable("specials", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  drinkId: text("drink_id").references(() => drinksTable.id),
  specialType: text("special_type").notNull().default("manual"),
  discountType: text("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  daysOfWeek: text("days_of_week"),  // JSON string or comma-separated
  startHour: integer("start_hour"),
  endHour: integer("end_hour"),
  startDate: integer("start_date"),
  endDate: integer("end_date"),
  isActive: integer("is_active").notNull().default(1),
  name: text("name"),
  createdByUserId: text("created_by_user_id"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});
```

**Characteristics:**
- Drink-specific (can be null for global specials)
- Special types: `manual`, `happy_hour`, `promotional`, `bundle`, etc.
- Day/time-based scheduling (day of week, start/end hours)
- Date ranges for limited-time specials
- No usage tracking
- **STATUS**: Table exists but no API routes or frontend UI

### 1.2 Related Tab Structure
**TabsTable** (lines 85-108):
- `discountMxn: real` - Manual discount amount
- `promoCodeId: text` - Reference to promo code applied
- `taxMxn: real` - Tax calculation
- `taxPercent: real` - Tax percentage

### 1.3 Related Order Structure
**OrdersTable** (lines 125-149):
- `unitPriceMxn: real` - Unit price (no order-level discount field)
- `quantity: integer`
- `taxCategory` and `taxRate` - Tax info
- Voiding fields exist for manual removal

---

## 2. HOW PRICING FLOWS THROUGH THE SYSTEM

### 2.1 Order Creation Flow (tabs.ts:430-557)

```
1. GET drink from drinksTable
2. FETCH recipe ingredients
3. CALCULATE drink cost:
   - For each ingredient: costPerBaseUnit = ingredient.orderCost / ingredient.baseUnitAmount
   - totalDrinkCost = SUM(amountInBaseUnit × costPerBaseUnit)
   - suggestedPrice = totalDrinkCost × drink.markupFactor
   - unitPriceMxn = drink.actualPrice OR suggestedPrice
4. RESERVE inventory (increment reservedStock)
5. INSERT order with unitPriceMxn
6. RECALCULATE tab total
```

### 2.2 Tab Total Calculation (tabs.ts:134-147)

```typescript
async function recalcTabTotal(tabId: string) {
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.tabId, tabId));
  
  const total = orders
    .filter((o) => o.voided !== 1)
    .reduce((sum, o) => sum + Number(o.unitPriceMxn) * o.quantity, 0);
  
  await db.update(tabsTable)
    .set({ totalMxn: total })
    .where(eq(tabsTable.id, tabId));
}
```

**Key Insight**: Currently, `totalMxn` = SUM of all active orders' unit prices × quantities. Discount and tax are applied at **close time**, not order time.

### 2.3 Tab Close Flow (tabs.ts:297-396)

**Current discount flow:**
1. Manual discount applied via `promoCodeId` in promo-codes.ts (lines 72-183)
2. Discount calculated as: `discountMxn = (tabTotal × percentage)` OR `fixed_amount`
3. Tab updated: `discountMxn` field set
4. **Missing**: Final total calculation with discount + tax (not shown in snippet)

---

## 3. DISCOUNT APPLICATION STRATEGIES

### Where to Apply Discounts?

Based on the current architecture, there are **three levels**:

| Level | Current Support | Use Case | Implementation |
|-------|-----------------|----------|-----------------|
| **Per-Drink** | None | "Well spirits 20% off" | Add discount to Order table + recalc tab |
| **Per-Tab** | Partial (promo codes) | "Customer has 15% off" | Apply at close time |
| **Per-Order** | None | "This particular order get discount" | Add discount field to Order table |

### Recommended Approach: **Flexible Discounts**

Implement discounts at **multiple levels** to support all use cases:

1. **Drink-level discounts** (specialsTable) → Applied when order created → Modifies `unitPriceMxn`
2. **Order-level discounts** → Manual discount per line item → Stored in orders table
3. **Tab-level discounts** (promoCodeId + specials) → Applied at close → Affects tab total

---

## 4. CURRENT API IMPLEMENTATION

### 4.1 Promo Codes Routes (artifacts/api-server/src/routes/promo-codes.ts)

**Existing Endpoints:**

```
GET  /api/promo-codes/:code
     - Validates and returns promo code details
     - Checks: active, expiration, max uses
     - Returns: id, code, discountType, discountValue, etc.

PATCH /api/tabs/:id/apply-code
     - Applies promo code to a tab
     - Calculates discount: discountMxn = (tabTotal × %) OR fixed amount
     - Updates: discountMxn, promoCodeId
     - Increments: currentUses on promo code
     - Validates: active, expiration, max uses
```

**Status**: Working but limited to tab-level, percentage-based discounts

### 4.2 Missing Routes for Full Implementation

**Need to add:**

1. **Promo Code CRUD**
   - `POST /api/promo-codes` - Create (admin)
   - `GET /api/promo-codes` - List (admin)
   - `PATCH /api/promo-codes/:id` - Update (admin)
   - `DELETE /api/promo-codes/:id` - Delete (admin)

2. **Specials CRUD**
   - `POST /api/specials` - Create (admin)
   - `GET /api/specials` - List (optional filter by drink/active)
   - `GET /api/specials/active` - Active specials at current time (for UI)
   - `PATCH /api/specials/:id` - Update (admin)
   - `DELETE /api/specials/:id` - Delete (admin)

3. **Order-level Discounts**
   - `PATCH /api/orders/:id/discount` - Apply discount to single order
   - Modify `recalcTabTotal()` to include order-level discounts

---

## 5. PRICING/COST FLOW DETAILS

### 5.1 Key Fields

**In Drinks:**
- `actualPrice: real` - Overrides suggested price
- `markupFactor: real` - Suggested multiplier (default 3.0)

**In Orders:**
- `unitPriceMxn: real` - Final price used for the order
- `quantity: integer`
- **NEW**: `discountMxn` (optional) - Line-item discount

**In Tabs:**
- `totalMxn: real` - SUM of all order prices
- `discountMxn: real` - Tab-level discount (manual or promo)
- `taxMxn: real` - Calculated tax
- `tipMxn: real` - Tip amount

### 5.2 Discount Calculation Formula

**Current (Tab-level only):**
```
subtotal = SUM(order.unitPriceMxn × order.quantity)
discount = (subtotal × discountPercent) OR fixed_amount
taxableAmount = subtotal - discount
tax = taxableAmount × taxRate
total = subtotal - discount + tax + tip
```

**Proposed (with order-level discounts):**
```
FOR EACH ORDER:
  basePrice = order.unitPriceMxn × order.quantity
  orderDiscount = order.discountMxn OR 0
  subtotal += basePrice - orderDiscount

tabDiscount = (subtotal × discountPercent) OR fixed_amount
taxableAmount = subtotal - tabDiscount
tax = taxableAmount × taxRate
total = subtotal - tabDiscount + tax + tip
```

---

## 6. FRONTEND PATTERNS & COMPONENTS

### 6.1 Page Structure
- **Pages** (`artifacts/gusto-pos/src/pages/*.tsx`):
  - Page-level state management
  - Route handling via `wouter`
  - Data fetching via TanStack Query (auto-generated hooks)
  - Modal dialogs for CRUD

### 6.2 Modal Implementation Pattern
**Reference: InventoryAuditModal.tsx (80 lines)**

```typescript
interface ModalProps {
  item: T;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ item, isOpen, onClose }: ModalProps) {
  const [formState, setFormState] = useState(...);
  const mutation = useMutation({ mutationFn, onSuccess, onError });
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        {/* Form fields */}
        <Button onClick={() => mutation.mutate(...)}>Save</Button>
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
```

### 6.3 Mutation Pattern
**Reference: use-pos-mutations.ts (245 lines)**

```typescript
export function useCreateTabMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { data: Parameters<typeof createTab>[0] }) =>
      createTab(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tabs"] });
      toast({ title: "Tab opened successfully" });
    },
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Failed to open tab",
        description: err.message,
      }),
  });
}
```

### 6.4 Query Pattern
**Auto-generated from OpenAPI spec:**

```typescript
// Generated hooks
useGetPromoCodeByCode(code, options?)
useGetDrinks(options?)
useGetTab(id, options?)

// In components:
const { data, isLoading, error } = useGetTab(tabId);
```

---

## 7. API ROUTE PATTERNS

### 7.1 Express Router Pattern
**Reference: promo-codes.ts**

```typescript
const router: IRouter = Router();

// GET with validation
router.get("/promo-codes/:code", async (req: Request, res: Response) => {
  const parsed = GetPromoCodeByCodeParams.safeParse({ code: req.params.code });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid code" });
    return;
  }
  // ... logic
});

// PATCH with body validation
router.patch("/tabs/:id/apply-code", async (req: Request, res: Response) => {
  const bodyCheck = ApplyPromoCodeToTabBody.safeParse(req.body);
  if (!bodyCheck.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  // ... logic
});

export default router;
```

### 7.2 Transaction Pattern (drinks.ts)
```typescript
const result = await db.transaction(async (tx) => {
  await tx.update(...).set(...).where(...);
  const [item] = await tx.insert(...).values(...).returning();
  return item;
});
```

### 7.3 Error Handling Pattern
```typescript
if (!found) {
  res.status(404).json({ error: "Not found" });
  return;
}

if (invalid) {
  res.status(400).json({ error: "Invalid input" });
  return;
}
```

---

## 8. ZODA SCHEMA & API GENERATION

### 8.1 Schema Location
- **Schemas**: `lib/api-zod/src/generated/api.ts` (auto-generated from OpenAPI)
- **OpenAPI Spec**: `lib/api-spec/openapi.yaml`
- **Generation Tool**: Orval (see generated header)

### 8.2 Example Promo Code Schemas
```typescript
// From api.ts (auto-generated)
export const GetPromoCodeByCodeParams = zod.object({
  code: zod.string(),
});

export const GetPromoCodeByCodeResponse = zod.object({
  id: zod.string(),
  code: zod.string(),
  description: zod.string().optional(),
  discountType: zod.enum(["percentage", "fixed_amount"]),
  discountValue: zod.number(),
  maxUses: zod.number().optional(),
  currentUses: zod.number(),
  expiresAt: zod.string().datetime().optional(),
});
```

### 8.3 How to Add New Schemas
1. **Update OpenAPI spec** (`lib/api-spec/openapi.yaml`)
2. **Run codegen**: `pnpm --filter @workspace/api-spec run codegen`
3. Auto-generates:
   - `lib/api-zod/src/generated/api.ts` (Zod validators)
   - `lib/api-client-react/src/generated/api.ts` (React hooks)

---

## 9. INTEGRATION INTO TabDetail.tsx

### 9.1 Current State (lines 65-98)
```typescript
const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
const [promoCode, setPromoCode] = useState<string>("");

const getGrandTotal = () => {
  return Math.max(0, (tabData?.totalMxn || 0) - appliedDiscount) + tipAmount;
};
```

**Issue**: Discount management is local state, not integrated with backend.

### 9.2 Proposed Changes

**In Order Display (lines 400-600):**
```typescript
// For each order in filteredOrders:
const orderDiscount = order.discountMxn || 0;
const orderTotal = (order.unitPriceMxn * order.quantity) - orderDiscount;

// Add discount button per order
<Button onClick={() => showDiscountModal(order)}>
  {orderDiscount > 0 ? `${formatMoney(orderDiscount)} off` : "Add Discount"}
</Button>
```

**In Close Tab Dialog (lines 700-900):**
```typescript
// Add special selector
<Select value={selectedSpecial} onValueChange={setSelectedSpecial}>
  <option value="">No Special</option>
  {activeSpecials?.map(s => (
    <option key={s.id} value={s.id}>{s.name}</option>
  ))}
</Select>

// Promo code input (existing)
<Input 
  value={promoCode} 
  placeholder="Enter promo code"
  onChange={e => setPromoCode(e.target.value)}
/>
<Button onClick={applyPromoCode}>Apply</Button>
```

**In Payment Dialog (lines 950-1050):**
```typescript
const summary = {
  subtotal: tabData.totalMxn,
  discounts: tabData.discountMxn + orderLevelDiscounts,
  tax: calculateTax(subtotal - discounts),
  tip: tipAmount,
  total: subtotal - discounts + tax + tip,
};
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Enable Existing Promo Codes (2-3 hours)
1. ✅ Already partially working in promo-codes.ts
2. Add admin CRUD endpoints for managing promo codes
3. Add frontend modal in TabDetail for promo code entry
4. Test discount calculation

### Phase 2: Implement Specials System (4-6 hours)
1. Create API routes for specials CRUD
2. Add "active specials" endpoint (filters by time/day)
3. Create admin UI in Settings page
4. Modify order creation to apply drink-level specials
5. Update TabDetail to show active specials

### Phase 3: Add Order-Level Discounts (3-4 hours)
1. Add `discountMxn` field to ordersTable (via migration)
2. Create PATCH /api/orders/:id/discount endpoint
3. Update recalcTabTotal() to include order discounts
4. Add discount UI buttons in TabDetail
5. Test with various combinations

### Phase 4: Enhanced Discount Management (2-3 hours)
1. Discount analytics (see Report.tsx for pattern)
2. Bulk discount application
3. Discount audit trail (already have eventLogsTable)

---

## 11. KEY IMPLEMENTATION NOTES

### 11.1 Database Migrations
If adding new fields:
```typescript
// In lib/db/src/index.ts (auto-migration pattern):
if (!hasColumn(table, 'discount_mxn')) {
  await db.run(
    sql`ALTER TABLE orders ADD COLUMN discount_mxn REAL DEFAULT 0`
  );
}
```

### 11.2 Timestamps
- All timestamps are **unix seconds** (integer), not JS Dates
- When storing: `Math.floor(Date.now() / 1000)`
- When returning: `new Date(timestamp * 1000).toISOString()`

### 11.3 Booleans
- Stored as 0/1 integers in SQLite
- No automatic conversion; handle manually

### 11.4 Transaction Safety
For multi-step operations (order creation + inventory + discount):
```typescript
const result = await db.transaction(async (tx) => {
  // All operations here rollback together if any fail
  await tx.update(...);
  const [item] = await tx.insert(...).returning();
  return item;
});
```

### 11.5 Authorization
- Use `requireRole("admin")` middleware for admin-only endpoints
- Promo codes: Anyone can apply, only admins create
- Specials: Only admins manage
- Order discounts: Bartenders can apply (no auth required)

---

## 12. SUMMARY TABLE: Where Discounts Live

| Discount Type | Database Field | Applied When | Calculation Point | Responsible Code |
|---|---|---|---|---|
| **Promo Code** | `tabs.promoCodeId` | Tab close | Tab-level after order total | promo-codes.ts |
| **Specials** | `specials.discountValue` | Order created | Drink price modifier | needs new route |
| **Order-Level** | `orders.discountMxn` (new) | Manual via UI | Per-order line item | needs new route + TabDetail |
| **Manual Tab Discount** | `tabs.discountMxn` | Tab close | Tab-level manual override | promo-codes.ts |

---

## 13. FILES TO CREATE/MODIFY

### New Files
- `artifacts/api-server/src/routes/specials.ts` - CRUD for specials
- `artifacts/gusto-pos/src/pages/Specials.tsx` - Admin page for managing specials
- `artifacts/gusto-pos/src/components/DiscountModal.tsx` - Apply discount to order

### Modify
- `lib/db/src/schema/gusto.ts` - Export Special type
- `lib/api-spec/openapi.yaml` - Add specials + discount endpoints
- `artifacts/api-server/src/routes/index.ts` - Register specials router
- `artifacts/api-server/src/routes/tabs.ts` - Add order-level discount logic
- `artifacts/gusto-pos/src/pages/TabDetail.tsx` - Add discount UI
- `artifacts/gusto-pos/src/pages/Settings.tsx` - Add specials admin section
- `artifacts/gusto-pos/src/hooks/use-pos-mutations.ts` - Add discount mutations

---

## 14. TROUBLESHOOTING CHECKLIST

- [ ] After API changes, run: `pnpm run lint` & `pnpm run typecheck`
- [ ] After OpenAPI changes, regenerate: `pnpm --filter @workspace/api-spec run codegen`
- [ ] Remember timestamps are unix seconds (integer)
- [ ] Remember booleans are 0/1 (integer)
- [ ] Use transactions for multi-step operations
- [ ] Invalidate correct query keys after mutations
- [ ] Test discount edge cases: 0 discount, discount > total, negative amounts
- [ ] Verify inventory isn't double-counted with specials
- [ ] Check discount type validation (percentage vs fixed_amount)

