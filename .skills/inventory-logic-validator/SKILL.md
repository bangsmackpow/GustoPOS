---
name: inventory-logic-validator
description: Validate and audit inventory decrement/restoration logic in GustoPOS. Use when modifying tab or order routes to ensure stock levels remain accurate and transactional integrity is maintained.
---

# inventory-logic-validator

Specialized guidance for maintaining the integrity of the POS inventory system.

## Critical Files
- Backend Logic: `artifacts/api-server/src/routes/tabs.ts`
- Schema: `lib/db/src/schema/gusto.ts` (specifically `ingredientsTable` and `recipeIngredientsTable`)

## Core Rules

### 1. Atomic Decrements
Always use `sql` fragments for inventory updates to ensure atomicity and prevent race conditions.
```typescript
await tx.update(ingredientsTable)
  .set({
    currentStock: sql`${ingredientsTable.currentStock} - ${amount.toString()}`
  })
  .where(eq(ingredientsTable.id, ingredientId));
```

### 2. Transactional Integrity
Any operation that creates or deletes an order MUST be wrapped in a database transaction that also updates the corresponding stock levels.
- **Add Order**: [Decrement Stock] -> [Insert Order]
- **Delete Order**: [Restore Stock] -> [Delete Order]
- **Update Quantity**: [Calculate Difference] -> [Adjust Stock] -> [Update Order]

### 3. Recipe Resolution
When calculating stock changes, always fetch the drink's recipe from `recipeIngredientsTable`. Ensure `amountInMl` is correctly typed (usually cast from string/decimal).

## Validation Checklist
- [ ] Are stock updates wrapped in `db.transaction`?
- [ ] Is `sql` used for the decrement/increment operation?
- [ ] Does the logic handle multiple ingredients per drink?
- [ ] Is stock restored correctly when an order is deleted?
- [ ] Is `recalcTabTotal` called after any order modification?
