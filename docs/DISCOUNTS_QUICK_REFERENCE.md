# Discounts/Specials Feature - Quick Reference

## Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    PROMO CODES TABLE                         │
├─────────────────────────────────────────────────────────────┤
│ • Global discount codes (not drink-specific)                 │
│ • Types: percentage, fixed_amount                            │
│ • Usage tracking: maxUses, currentUses                        │
│ • Status: active, inactive, expired                          │
│ • Location: promo_codes in tabs as promoCodeId              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SPECIALS TABLE                            │
├─────────────────────────────────────────────────────────────┤
│ • Drink-specific OR global specials                          │
│ • Types: manual, happy_hour, promotional, bundle            │
│ • Schedule: daysOfWeek, startHour, endHour, date ranges    │
│ • Status: active, inactive                                  │
│ • NO API ROUTES YET (needs implementation)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ORDERS TABLE (needs update)                 │
├─────────────────────────────────────────────────────────────┤
│ • unitPriceMxn: base order price                            │
│ • NEW: discountMxn (order-level discount)                   │
│ • quantity, taxRate, voiding fields                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   TABS TABLE (uses discount)                 │
├─────────────────────────────────────────────────────────────┤
│ • totalMxn: SUM of order prices                             │
│ • discountMxn: tab-level discount amount                    │
│ • promoCodeId: reference to applied promo code              │
│ • taxMxn, tipMxn: other components                          │
└─────────────────────────────────────────────────────────────┘
```

## Pricing Flow

### Current (Tab-Level Only)
```
Order Created:
  1. Calculate drink cost from recipe
  2. Apply drink.markupFactor OR use drink.actualPrice
  3. Create order with unitPriceMxn
  4. Recalculate tab total = SUM(order.unitPriceMxn × quantity)

Tab Close:
  1. Apply promo code (if any)
  2. Calculate discount: discountMxn = (total × %) OR fixed
  3. Update tab.discountMxn
  4. Final total = total - discountMxn + tax + tip
```

### Proposed (Multi-Level)
```
Order Created:
  1. Check for active specials (drink-specific)
  2. Modify unitPriceMxn based on special discount
  3. Reserve inventory
  4. Store order with unitPriceMxn + discountMxn (if manual)
  5. Recalculate tab total including order discounts

Tab Close:
  1. Apply promo code + special discounts
  2. Calculate total discounts
  3. Final total = subtotal - totalDiscounts + tax + tip
```

## API Endpoints Status

### ✅ Already Implemented
```
GET  /api/promo-codes/:code          - Validate promo code
PATCH /api/tabs/:id/apply-code       - Apply promo to tab
```

### ❌ Need to Add (Promo Code CRUD)
```
POST   /api/promo-codes              - Create promo code (admin)
GET    /api/promo-codes              - List all promo codes (admin)
PATCH  /api/promo-codes/:id          - Update promo code (admin)
DELETE /api/promo-codes/:id          - Delete promo code (admin)
```

### ❌ Need to Add (Specials CRUD)
```
POST   /api/specials                 - Create special (admin)
GET    /api/specials                 - List all specials
GET    /api/specials/active          - Get active specials NOW (for UI)
PATCH  /api/specials/:id             - Update special (admin)
DELETE /api/specials/:id             - Delete special (admin)
```

### ❌ Need to Add (Order-Level Discounts)
```
PATCH  /api/orders/:id/discount      - Apply discount to order
```

## Frontend Integration Points

### TabDetail.tsx (Main page for discounts)
| Feature | Current | Needed |
|---------|---------|--------|
| Show order prices | ✅ | - |
| Manual order discount UI | ❌ | Modal with $/% options |
| Show active specials | ❌ | Display badge on drinks |
| Promo code entry | ✅ (local state only) | Connect to backend |
| Discount summary at close | ❌ | Show breakdown of all discounts |

### Settings.tsx (Admin management)
| Feature | Current | Needed |
|---------|---------|--------|
| Manage promo codes | ❌ | New modal CRUD |
| Manage specials | ❌ | New section with schedule UI |
| View discount history | ❌ | Admin dashboard |

## Key Types & Schemas

### PromoCode Type (from schema)
```typescript
{
  id: string
  code: string                  // Unique code like "HAPPY20"
  description?: string
  discountType: "percentage" | "fixed_amount"
  discountValue: number         // 20 for 20%, or 50 for $50 off
  maxUses?: number
  currentUses: number
  expiresAt?: unix timestamp
  isActive: 0 | 1
  createdAt: unix timestamp
  updatedAt: unix timestamp
}
```

### Special Type (from schema)
```typescript
{
  id: string
  drinkId?: string              // null for global special
  specialType: "manual" | "happy_hour" | "promotional" | "bundle"
  discountType: "percentage" | "fixed_amount"
  discountValue: number
  daysOfWeek?: string           // "1,5" for Mon/Fri (0-6)
  startHour?: number            // 0-23
  endHour?: number              // 0-23
  startDate?: unix timestamp    // Period range
  endDate?: unix timestamp
  isActive: 0 | 1
  name?: string
  createdByUserId?: string
  createdAt: unix timestamp
}
```

### Order Type (needs update)
```typescript
{
  id: string
  tabId: string
  drinkId: string
  drinkName: string
  quantity: number
  unitPriceMxn: number          // Base price
  discountMxn?: number          // NEW: order-level discount
  taxCategory: string
  taxRate: number
  notes?: string
  voided: 0 | 1
  voidReason?: string
  createdAt: unix timestamp
}
```

## Discount Hierarchy & Application

```
PRIORITY:           When to apply:         Field:
───────────────────────────────────────────────────
1. Specials         Order creation         order.unitPriceMxn
2. Order discount   Manual via UI          order.discountMxn
3. Promo code       Tab close              tab.discountMxn
4. Manual discount  Tab close              tab.discountMxn
```

**Note**: Overlaps should be prevented by UI (can't apply both order and tab discount typically)

## Calculation Examples

### Example 1: Special on Drink
```
Drink: Margarita, normal price $12
Special: Happy Hour 20% off on margaritas
When ordered:
  - unitPriceMxn = $12 × (1 - 0.20) = $9.60
  - Order shows $9.60
```

### Example 2: Manual Order Discount
```
Drink: Vodka Tonic, normal price $10
Staff manually discounts order by $3
  - unitPriceMxn = $10
  - discountMxn = $3
  - Line total = $10 - $3 = $7
```

### Example 3: Promo Code on Tab
```
Subtotal from orders: $45.00
Promo code: "SAVE15" = 15% off
At close:
  - discountMxn = $45.00 × 0.15 = $6.75
  - taxableAmount = $45.00 - $6.75 = $38.25
  - tax = $38.25 × 0.16 = $6.12
  - tip (customer adds): $5.00
  - total = $38.25 + $6.12 + $5.00 = $49.37
```

## Testing Checklist

### Unit Tests
- [ ] Percentage discount calculation
- [ ] Fixed amount discount calculation
- [ ] Discount capped at subtotal
- [ ] Negative amounts rejected
- [ ] Promo code expiration works
- [ ] Max uses limit works
- [ ] Special time-based filtering works

### Integration Tests
- [ ] Order with special applies discount to unitPriceMxn
- [ ] Order-level discount applied correctly
- [ ] Promo code reduces tab total
- [ ] Multiple discounts don't stack (or if they do, tested)
- [ ] Tax calculated on correct base (after discount)
- [ ] Inventory reserved correctly with discounted orders
- [ ] Voiding order clears its discount

### UI Tests
- [ ] Promo code input in TabDetail works
- [ ] Discount modal opens/closes properly
- [ ] Discount amount displays correctly
- [ ] Active specials show badges on drinks
- [ ] Admin can create/edit/delete promo codes
- [ ] Admin can create/edit/delete specials
- [ ] Schedule UI for specials is intuitive

## Files Changed Summary

### Backend (API Server)
- `lib/db/src/schema/gusto.ts` - Export Special type
- `artifacts/api-server/src/routes/index.ts` - Add specials router
- `artifacts/api-server/src/routes/specials.ts` - NEW: CRUD endpoints
- `artifacts/api-server/src/routes/promo-codes.ts` - Add CRUD endpoints
- `artifacts/api-server/src/routes/tabs.ts` - Update recalcTabTotal()
- `artifacts/api-server/src/routes/orders.ts` - NEW: discount endpoint

### Frontend (React App)
- `artifacts/gusto-pos/src/pages/TabDetail.tsx` - Add discount UI
- `artifacts/gusto-pos/src/pages/Settings.tsx` - Add admin sections
- `artifacts/gusto-pos/src/components/DiscountModal.tsx` - NEW
- `artifacts/gusto-pos/src/hooks/use-pos-mutations.ts` - Add mutations

### API Schemas (Auto-generated after OpenAPI update)
- `lib/api-spec/openapi.yaml` - Add endpoint definitions
- `lib/api-zod/src/generated/api.ts` - AUTO: Zod validators
- `lib/api-client-react/src/generated/api.ts` - AUTO: React hooks

## Common Patterns to Follow

### Backend Route Pattern
```typescript
// GET by ID
router.get("/:id", async (req, res) => {
  const [item] = await db.select().from(table)
    .where(eq(table.id, req.params.id));
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(formatResponse(item));
});

// POST create
router.post("/", async (req, res) => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const [item] = await db.insert(table).values(parsed.data).returning();
  res.status(201).json(formatResponse(item));
});
```

### Frontend Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: (data) => api.call(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/path"] });
    toast({ title: "Success" });
  },
  onError: (err) => {
    toast({ variant: "destructive", description: err.message });
  },
});
```

## Key Implementation Order

1. **Backend Foundation** (Promo Code CRUD)
   - Add missing CRUD endpoints
   - Test promo code validation

2. **Backend Specials** (Specials CRUD)
   - Create specials.ts route
   - Add active specials filtering
   - Test scheduling logic

3. **Frontend Admin** (Settings)
   - Promo code management modal
   - Specials management modal
   - Schedule UI

4. **Frontend User** (TabDetail)
   - Discount UI for orders
   - Promo code entry
   - Discount summary

5. **Integration & Testing**
   - Full flow testing
   - Edge case handling
   - Performance optimization

