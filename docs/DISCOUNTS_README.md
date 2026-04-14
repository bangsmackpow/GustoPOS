# GustoPOS Discounts/Specials Feature Documentation

## Overview

This folder contains comprehensive documentation for adding a discounts/specials feature to GustoPOS. The system builds on existing database tables (`promoCodesTable` and `specialsTable`) to provide flexible discount management at multiple levels:

1. **Promo Codes** - Global codes with usage tracking and expiration
2. **Specials** - Drink-specific or global time-based specials (happy hour, promotions)
3. **Order-Level Discounts** - Manual line-item discounts applied by staff
4. **Tab-Level Discounts** - Manual or automatic discounts at checkout

---

## Documentation Files

### 1. **DISCOUNTS_ARCHITECTURE.md** (18 KB)
**Comprehensive architectural guide covering:**

- **Database Schema**: Complete table structures for promo codes, specials, orders, tabs
- **Pricing Flow**: How discounts integrate with order creation and tab closing
- **Discount Strategies**: Three-level approach (drink-level, order-level, tab-level)
- **Current API Status**: What's implemented vs. what's needed
- **Cost Flow Details**: Discount calculation formulas with examples
- **Frontend Patterns**: Component structure, modal pattern, mutation pattern
- **API Route Patterns**: Express patterns, transactions, error handling
- **Zod Schemas & Generation**: How API specs are generated
- **TabDetail Integration**: How to add discount UI to main ordering page
- **Implementation Roadmap**: Phased approach (4 phases, 11-16 hours total)
- **Key Implementation Notes**: Database migrations, timestamps, transactions, auth

**Best for**: Understanding the big picture, planning implementation, understanding existing patterns

---

### 2. **DISCOUNTS_QUICK_REFERENCE.md** (12 KB)
**Quick lookup guide featuring:**

- **Database Structure**: Visual diagram of all relevant tables
- **Pricing Flow**: Current vs. proposed flow diagrams
- **API Endpoints**: Status table showing what's built and what's needed
- **Frontend Integration Points**: What's needed in TabDetail and Settings
- **Key Types & Schemas**: TypeScript interface definitions
- **Discount Hierarchy**: Priority and application timing
- **Calculation Examples**: Real-world discount scenarios
- **Testing Checklist**: Unit, integration, and UI tests
- **Files Summary**: What files need to be created/modified
- **Common Patterns**: Code templates for backend and frontend
- **Implementation Order**: Step-by-step sequence

**Best for**: Quick lookups, reference during coding, testing checklist, pattern examples

---

### 3. **DISCOUNTS_CODE_EXAMPLES.md** (29 KB)
**Production-ready code templates including:**

- **Part 1: Backend API Routes**
  - Specials CRUD route (GET all, GET active, GET single, POST, PATCH, DELETE)
  - Promo Code CRUD endpoints (add to existing)
  - Order-level discount endpoint
  - Updated `recalcTabTotal()` function

- **Part 2: Frontend Components**
  - `DiscountModal.tsx` - Apply discount to single order
  - Integration into `TabDetail.tsx` - How to add buttons and modals
  - `SpecialsModal.tsx` - Admin management UI

- **Part 3: Zod Schemas**
  - OpenAPI endpoint definitions (YAML)
  - Schema definitions for Special, CreateSpecialBody, UpdateSpecialBody

- **Part 4: Database Migrations**
  - Auto-migration for adding `discount_mxn` to orders table

- **Part 5: Type Exports**
  - TypeScript type definitions for database schema

**Best for**: Copy-paste code during implementation, understanding endpoint structure, modal patterns

---

## Quick Start

### If you're **just learning** the architecture:
1. Start with **DISCOUNTS_QUICK_REFERENCE.md** - Database Structure section
2. Read **DISCOUNTS_ARCHITECTURE.md** - Sections 1-5 (schema through discount strategies)
3. Review **DISCOUNTS_CODE_EXAMPLES.md** - Part 1 Backend patterns

### If you're **implementing** the feature:
1. Reference **DISCOUNTS_QUICK_REFERENCE.md** - Endpoints Status & Implementation Order
2. Use **DISCOUNTS_CODE_EXAMPLES.md** for copy-paste code templates
3. Check **DISCOUNTS_ARCHITECTURE.md** for implementation notes and patterns
4. Use **DISCOUNTS_QUICK_REFERENCE.md** - Testing Checklist when done

### If you're **debugging** an issue:
1. Check **DISCOUNTS_ARCHITECTURE.md** - Section 11 (Key Implementation Notes)
2. Reference **DISCOUNTS_QUICK_REFERENCE.md** - Troubleshooting & Common Patterns
3. Look up specific code in **DISCOUNTS_CODE_EXAMPLES.md**

---

## Key Concepts

### Three-Level Discount System

```
LEVEL 1: Drink Specials (specialsTable)
├── Applied at order creation
├── Modifies unitPriceMxn
└── Examples: happy hour, drink-specific promos

LEVEL 2: Order-Level Discounts (orders.discountMxn)
├── Applied manually by staff during service
├── Stored per order
└── Examples: give customer $5 off this margarita

LEVEL 3: Tab-Level Discounts (tabs.discountMxn)
├── Applied at checkout
├── Can be from promo code or manual
└── Examples: "SAVE15" code, manager discount
```

### Database Tables Status

| Table | Status | Purpose |
|-------|--------|---------|
| `promoCodesTable` | ✅ Exists | Global discount codes |
| `specialsTable` | ✅ Exists | Time-based drink specials |
| `ordersTable` | ⚠️ Needs field | Add `discount_mxn` column |
| `tabsTable` | ✅ Exists | Already has `discountMxn` field |

### API Endpoints Status

| Endpoint | Current | Status |
|----------|---------|--------|
| GET /api/promo-codes/:code | ✅ | Works |
| PATCH /api/tabs/:id/apply-code | ✅ | Works |
| POST/GET/PATCH/DELETE /api/promo-codes | ❌ | Needs implementation |
| POST/GET/PATCH/DELETE /api/specials | ❌ | Needs implementation |
| GET /api/specials/active | ❌ | Needs implementation |
| PATCH /api/orders/:id/discount | ❌ | Needs implementation |

---

## Implementation Phases

### Phase 1: Backend Foundation (2-3 hours)
- [ ] Add Promo Code CRUD endpoints
- [ ] Test with existing apply-code endpoint
- [ ] Update OpenAPI spec

### Phase 2: Specials System (4-6 hours)
- [ ] Create `specials.ts` route file
- [ ] Add specials CRUD endpoints
- [ ] Add active specials filtering logic
- [ ] Update OpenAPI spec
- [ ] Regenerate Zod/React schemas

### Phase 3: Order-Level Discounts (3-4 hours)
- [ ] Add `discount_mxn` migration to orders table
- [ ] Create discount endpoint
- [ ] Update `recalcTabTotal()` function
- [ ] Add order-level discount button to TabDetail

### Phase 4: Frontend & Integration (4-6 hours)
- [ ] Create DiscountModal component
- [ ] Integrate discount UI into TabDetail
- [ ] Create Specials admin section in Settings
- [ ] Create Promo Code admin section in Settings
- [ ] Test full flow end-to-end

**Total Estimated Time**: 13-19 hours

---

## File Structure

```
docs/
├── DISCOUNTS_README.md (this file)
├── DISCOUNTS_ARCHITECTURE.md (14 sections, comprehensive)
├── DISCOUNTS_QUICK_REFERENCE.md (quick lookups and patterns)
└── DISCOUNTS_CODE_EXAMPLES.md (production-ready code)

Implementation will modify/create:
├── lib/db/src/schema/gusto.ts
├── lib/db/src/index.ts (migration)
├── lib/api-spec/openapi.yaml
├── artifacts/api-server/src/routes/
│   ├── specials.ts (NEW)
│   ├── promo-codes.ts (UPDATE)
│   ├── tabs.ts (UPDATE)
│   └── index.ts (UPDATE)
└── artifacts/gusto-pos/src/
    ├── components/DiscountModal.tsx (NEW)
    ├── pages/TabDetail.tsx (UPDATE)
    ├── pages/Settings.tsx (UPDATE)
    └── hooks/use-pos-mutations.ts (UPDATE)
```

---

## Key Implementation Details

### Timestamps
- **Always store as unix seconds** (integer): `Math.floor(Date.now() / 1000)`
- **Convert for API**: `new Date(timestamp * 1000).toISOString()`

### Discount Calculation
- **Percentage**: `discountMxn = subtotal × (discountValue / 100)`
- **Fixed Amount**: `discountMxn = discountValue`
- **Capped**: `finalDiscount = Math.min(discountMxn, subtotal)`

### Database Transactions
```typescript
const result = await db.transaction(async (tx) => {
  // All operations here rollback together if any fail
  await tx.update(...);
  return item;
});
```

### Authorization
- **Promo Code CRUD**: Admin only
- **Specials CRUD**: Admin only
- **Order Discount**: Any staff (no auth needed)
- **Tab Discount**: Any staff

---

## Common Questions

### Q: Can a customer have multiple discounts?
**A**: Yes, but they're applied in sequence:
1. Order-level discounts reduce line item totals
2. Tab-level discounts reduce final subtotal
3. Tax calculated on discounted amount
4. Tip added at end

### Q: What's the difference between Promo Codes and Specials?
**A**: 
- **Promo Codes**: Global codes (e.g., "SAVE15"), with usage limits and expiration dates
- **Specials**: Drink-specific or global, with day/time scheduling (e.g., happy hour)

### Q: How are order-level discounts different from specials?
**A**:
- **Specials**: Automatic, applied when order created, based on rules
- **Order Discounts**: Manual, applied by staff on demand, per-order

### Q: Where does inventory deduction happen?
**A**: When order is **closed** (tab closed), not when order created. Inventory is **reserved** during order creation.

---

## Testing Strategy

### Unit Tests
- Discount calculations (percentage, fixed, capped)
- Special time filtering (day, hour, date range)
- Promo code expiration and usage limits

### Integration Tests
- Full discount flow (order → tab close → payment)
- Multiple discount combinations
- Tax calculation on discounted amounts
- Inventory reservation with discounts

### UI Tests
- Discount modal opens/closes
- Discount applied to correct order
- Admin CRUD for promo codes and specials
- Active specials display on drinks

---

## Performance Considerations

- **Active specials**: Cached on client side, refresh on open tab
- **Promo code validation**: Quick lookup by code
- **Discount calculations**: Done at order creation and tab close
- **Database**: All operations indexed by ID

---

## Related Documentation

See also in this repository:
- `ARCHITECTURE.md` - Overall system architecture
- `AGENTS.md` - Development guidelines
- `USER_GUIDE.md` - User-facing documentation
- `OPERATIONS_GUIDE.md` - Deployment and operations

---

## Version History

- **April 13, 2026** - Initial documentation created
  - DISCOUNTS_ARCHITECTURE.md - Comprehensive guide
  - DISCOUNTS_QUICK_REFERENCE.md - Quick reference
  - DISCOUNTS_CODE_EXAMPLES.md - Code templates
  - This README

---

## Need Help?

1. **Architecture questions?** → DISCOUNTS_ARCHITECTURE.md
2. **Quick lookup?** → DISCOUNTS_QUICK_REFERENCE.md  
3. **Code patterns?** → DISCOUNTS_CODE_EXAMPLES.md
4. **Implementation order?** → DISCOUNTS_QUICK_REFERENCE.md - Key Implementation Order
5. **Troubleshooting?** → DISCOUNTS_ARCHITECTURE.md - Section 14 Checklist

