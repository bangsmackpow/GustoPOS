# Ingredient Substitution Feature

## Overview

The ingredient substitution feature allows bartenders to swap ingredients in cocktails during order preparation, with full support for:

- **Stock tracking** - Automatic release and reservation of ingredient inventory
- **Price recalculation** - Cost difference between original and substitute ingredient
- **Full audit trail** - Complete history of all substitutions for inventory and sales tracking
- **Flexible substitution** - Filter by ingredient subtype (well vs. premium) or type

## User Workflows

### For Bartenders

1. **Open a tab** and add drinks to create orders
2. **Hover over an order** in the ticket list to reveal action buttons
3. **Click the coffee/mix icon** (blue button) to modify ingredients
4. **Select substitution mode:**
   - **Subtype** (default) - Replace within the same category (e.g., tequila variants)
   - **Type** - Replace with any ingredient of the same type (e.g., any spirit)
   - **All** - Replace with any available ingredient in the system
5. **Select the new ingredient** from the filtered list
6. **Review the price impact** - Shows cost difference for all units of the order
7. **Add optional notes** - Document reason for substitution (customer preference, stock issue, etc.)
8. **Confirm** - Price adjusts automatically, stock is reserved for new ingredient

### For Managers/Accounting

- **View audit logs** under Settings → Audit Logs to see all ingredient substitutions
- **Full modification history** shows:
  - Who made the change (staff member)
  - When it was made
  - Original vs. replacement ingredient
  - Price impact
  - Reason/notes if provided

## Technical Architecture

### Database Schema

#### order_modifications Table

Tracks all ingredient substitutions with full history:

```
order_modifications:
  - id: Primary key (UUID)
  - orderId: Reference to the order being modified
  - recipeLineIndex: Which recipe ingredient was swapped (0-based)
  - originalIngredientId: The original ingredient ID
  - originalIngredientName: The original ingredient name
  - originalAmount: Amount needed of original ingredient
  - replacementIngredientId: The new ingredient ID
  - replacementIngredientName: The new ingredient name
  - replacementAmount: Amount needed of replacement (usually same as original)
  - priceDifferenceMxn: Positive or negative price adjustment
  - modifiedByUserId: Staff member who made the change
  - modifiedAt: Timestamp of the change
  - notes: Optional reason/comments (e.g., "Customer allergy", "Out of stock")
```

Indexes created on:

- `order_id` - For quick lookup of all modifications to an order
- `modified_by_user_id` - For staff performance tracking

### API Endpoint

**PATCH /api/orders/:id/modify-ingredient**

#### Request Body

```json
{
  "recipeLineIndex": 0, // Which recipe item (0-based)
  "newIngredientId": "ing-123", // ID of replacement ingredient
  "notes": "Customer preference" // Optional: reason for substitution
}
```

#### Response

Returns the updated order with new `unitPriceMxn` reflecting the cost change.

#### Error Cases

- `400` - Invalid recipe line index or insufficient stock for new ingredient
- `404` - Order, ingredient, or original ingredient not found

### Stock Reservation Flow

The substitution process maintains inventory integrity through atomic transactions:

1. **Validate** - Check new ingredient has sufficient stock available
2. **Release** - Reduce `reservedStock` for original ingredient
3. **Reserve** - Increase `reservedStock` for new ingredient
4. **Update Price** - Adjust `unitPriceMxn` based on cost difference
5. **Record** - Create entry in `order_modifications` for audit trail
6. **Recalculate** - Update tab total to reflect price change

**Critical:** All steps execute in a database transaction. If any step fails, the entire transaction rolls back - no partial updates.

### Price Calculation

Price difference is calculated as:

```
costDifference = (newIngredientCost - originalIngredientCost) × amountNeeded
priceDifference = costDifference × orderQuantity

newUnitPrice = originalUnitPrice + (priceDifference / orderQuantity)
```

Example:

- Original: Tequila @ 50 MXN/unit, 2 oz needed = 100 MXN
- Replacement: Premium Tequila @ 75 MXN/unit, 2 oz needed = 150 MXN
- Difference per drink: +50 MXN
- Order quantity: 3 drinks
- Total adjustment: +150 MXN

## Frontend Components

### IngredientSubstitutionModal

Located in `artifacts/gusto-pos/src/components/IngredientSubstitutionModal.tsx`

**Props:**

- `isOpen` - Modal visibility
- `onClose` - Close handler
- `recipeItem` - Details of ingredient being replaced
- `currentIngredient` - Full ingredient object
- `availableIngredients` - List of all ingredients for substitution
- `orderQuantity` - Number of drinks in the order
- `onSubstitute` - Callback when substitution is confirmed
- `isLoading` - Loading state during API call

**Features:**

- Real-time ingredient filtering (subtype/type/all)
- Stock availability checking
- Price impact display (color-coded red for increase, green for decrease)
- Notes/comments field for audit trail
- Bilingual support (English/Spanish)

### Integration in TabDetail

- **Button:** Blue coffee/mix icon appears when hovering over orders
- **Modal:** Opens above the ticket, doesn't block view of other orders
- **Handlers:**
  - Auto-refetch tab data after successful substitution
  - Toast notifications for success/error
  - Clear substitution state after completion

## Use Cases

### Case 1: Premium Upcharge

Bartender upgrades tequila to premium brand at customer request:

- Subtype filter shows "tequila" variants
- Premium option costs +30 MXN more
- Order price auto-adjusts
- Customer sees updated price before payment

### Case 2: Stock Recovery

Bartender runs out of house vodka mid-shift:

- Realizes stock is gone after a few drinks
- Opens upcoming orders with vodka
- Uses "All" filter to find alternatives in budget
- Substitutes remaining orders with similar spirit
- Inventory system updates stock accordingly

### Case 3: Customer Allergy/Preference

Customer mentions allergy after order taken:

- Bartender substitutes ingredient immediately
- Adds note: "Customer shellfish allergy - used alternative mixer"
- Audit log shows substitution details
- Price adjusted if new ingredient costs more/less

## Data Integrity

### Stock Tracking

- **Reserved stock always represents current commitments** - When ingredient is substituted, reserved stock is moved from original to replacement
- **Current stock remains unchanged** - Only reserved stock is modified during order lifetime
- **On tab close** - Reserved stock is deducted from current stock (same as normal order)

### Price Integrity

- **Unit price updates immediately** - Customer sees correct charge before paying
- **Tab total recalculated** - Discount, tax, tip all re-applied after modification
- **Audit trail is immutable** - Historical record cannot be modified, only viewed

### Stock Validation

- **Substitution blocked if insufficient stock** - API returns error before any changes
- **Stock checked at substitution time** - Not at tab close, preventing overselling
- **Accounts for parent items** - If ingredient is variant of parent, uses parent's stock

## Reporting & Analytics

### Available in Audit Logs

- Filter by action type: "modify_order_ingredient"
- View all modifications with:
  - Staff member name
  - Timestamp
  - Original vs. replacement ingredient
  - Price impact
  - Customer notes

### For Inventory Management

- Track which ingredients are frequently substituted out (stock issues)
- Track which premium ingredients are frequently substituted in (upsell opportunities)
- Identify ingredient variants that should be standardized

### For Staff Training

- Monitor substitution frequency by staff member
- Identify training needs (e.g., if bartender frequently forgets to adjust price)
- Recognize staff going above and beyond for customers

## Security Considerations

### Access Control

- Only active staff can make substitutions (authenticated endpoint)
- Staff member ID recorded for all modifications
- No modification of historical records (audit trail is immutable)

### Validation

- Recipe line index validated against actual recipe
- New ingredient ID validated against inventory system
- Stock check prevents inventory overselling
- Transactional execution prevents partial updates

### Data Sensitivity

- Modification records retained indefinitely for audit
- All changes logged with user attribution
- No way to "undo" substitution without creating new audit entry

## Testing Checklist

### Functional Tests

- [ ] Substitute ingredient within same subtype
- [ ] Substitute with ingredient of different type
- [ ] Substitute when new ingredient costs more (price increase)
- [ ] Substitute when new ingredient costs less (price decrease)
- [ ] Fail gracefully when insufficient stock
- [ ] Fail gracefully with invalid recipe index
- [ ] Multiple substitutions in same order
- [ ] Substitution affects correct order in multi-item tab

### Stock Tests

- [ ] Original ingredient reserved stock decreases by correct amount
- [ ] New ingredient reserved stock increases by correct amount
- [ ] Tab close applies correct final stock deduction
- [ ] Parent item stock affected when variant is substituted

### Price Tests

- [ ] Unit price updates correctly
- [ ] Tab total reflects new price
- [ ] Discount still applies to adjusted price
- [ ] Tax calculated on adjusted price

### Audit Tests

- [ ] Modification recorded in audit logs
- [ ] User ID captured correctly
- [ ] Original and replacement shown correctly
- [ ] Price difference captured accurately
- [ ] Notes saved if provided

### UI/UX Tests

- [ ] Modal appears with correct ingredient pre-selected
- [ ] Filters show only valid options
- [ ] Stock availability displayed accurately
- [ ] Price impact shown correctly before confirmation
- [ ] Bilingual text displays correctly
- [ ] Loading state during API call

## Troubleshooting

### "Insufficient Stock" Error

**Problem:** User tries to substitute but gets insufficient stock error
**Cause:** Sum of current + reserved stock is less than needed amount
**Solution:** Check inventory levels, may need to adjust pending orders or do inventory audit

### Price Not Updating on Tab

**Problem:** Order price changed but tab total didn't update
**Cause:** Tab total calculation failed to refresh
**Solution:** Reload the tab page - should sync with database. If persistent, check server logs.

### Modification Not in Audit Log

**Problem:** Completed substitution doesn't appear in audit logs
**Cause:** Audit logging failure (rare), or filter is hiding it
**Solution:** Check audit log filter, verify correct date range and action type selected

## Future Enhancements

### Possible Extensions

1. **Multi-ingredient substitution** - Replace multiple recipe items in one interaction
2. **Preset substitutions** - Manager-defined standard substitutions (e.g., "well → premium upgrade")
3. **Smart recommendations** - System suggests similar/compatible ingredients based on taste profile
4. **Substitution analytics** - Dashboard showing most common substitutions and revenue impact
5. **Recipe version control** - Track recipe changes alongside substitutions for true COGS tracking

## Related Features

- **Inventory Management** - `lib/db/src/schema/inventory.ts`
- **Stock Reservation** - `artifacts/api-server/src/routes/tabs.ts` (order creation/closure)
- **Audit Logging** - `artifacts/api-server/src/lib/auditLog.ts`
- **Recipe Management** - `artifacts/api-server/src/routes/drinks.ts`
- **Discounts** - `artifacts/api-server/src/routes/tabs.ts` (separate from substitutions)
