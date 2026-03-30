import { Router, type IRouter, type Request, type Response } from "express";
import { db, ingredientsTable, drinksTable, recipeIngredientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/bulk-ingredients", async (req: Request, res: Response) => {
  const { ingredients } = req.body;

  if (!Array.isArray(ingredients)) {
    res.status(400).json({ error: "Invalid input: ingredients must be an array" });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      for (const item of ingredients) {
        // Find by name manually since unique constraint might be absent or problematic
        const [existing] = await tx.select().from(ingredientsTable).where(eq(ingredientsTable.name, item.name));
        
        if (existing) {
          await tx.update(ingredientsTable)
            .set({
              nameEs: item.nameEs || null,
              costPerUnit: Number(item.costPerUnit) || 0,
              currentStock: Number(item.currentStock) || 0,
              minimumStock: Number(item.minimumStock) || 0,
              unit: item.unit || 'ml',
              unitSize: Number(item.unitSize) || 750,
              category: item.category || 'spirits',
              updatedAt: new Date(),
            })
            .where(eq(ingredientsTable.id, existing.id));
        } else {
          await tx.insert(ingredientsTable)
            .values({
              name: item.name,
              nameEs: item.nameEs || null,
              category: item.category || 'spirits',
              unit: item.unit || 'ml',
              unitSize: Number(item.unitSize) || 750,
              costPerUnit: Number(item.costPerUnit) || 0,
              currentStock: Number(item.currentStock) || 0,
              minimumStock: Number(item.minimumStock) || 0,
            } as typeof ingredientsTable.$inferInsert);
        }
      }
    });

    res.json({ success: true, count: ingredients.length });
  } catch (err: any) {
    console.error("Bulk ingredients import error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk-drinks", async (req: Request, res: Response) => {
  const { drinks } = req.body;

  if (!Array.isArray(drinks)) {
    res.status(400).json({ error: "Invalid input: drinks must be an array" });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      for (const item of drinks) {
        // 1. Find by name manually since we removed the strict UNIQUE constraint
        const [existing] = await tx.select().from(drinksTable).where(eq(drinksTable.name, item.name));
        
        let drink;
        if (existing) {
          [drink] = await tx.update(drinksTable)
            .set({
              nameEs: item.nameEs || null,
              description: item.description || null,
              descriptionEs: item.descriptionEs || null,
              category: item.category || 'cocktail',
              markupFactor: Number(item.markupFactor) || 3.0,
              actualPrice: item.actualPrice ? Number(item.actualPrice) : null,
              updatedAt: new Date(),
            })
            .where(eq(drinksTable.id, existing.id))
            .returning();
        } else {
          [drink] = await tx.insert(drinksTable)
            .values({
              name: item.name,
              nameEs: item.nameEs || null,
              description: item.description || null,
              descriptionEs: item.descriptionEs || null,
              category: item.category || 'cocktail',
              markupFactor: Number(item.markupFactor) || 3.0,
              actualPrice: item.actualPrice ? Number(item.actualPrice) : null,
            } as typeof drinksTable.$inferInsert)
            .returning();
        }

        // 2. If recipe is provided, sync it
        if (drink && Array.isArray(item.recipe) && item.recipe.length > 0) {
          // Clear existing recipe
          await tx.delete(recipeIngredientsTable).where(eq(recipeIngredientsTable.drinkId, drink.id));
          
          // Add new ingredients
          for (const r of item.recipe) {
            // Find ingredient by name if ID not provided
            let ingredientId = r.ingredientId;
            if (!ingredientId && r.ingredientName) {
              const [ing] = await tx.select().from(ingredientsTable).where(eq(ingredientsTable.name, r.ingredientName));
              if (ing) ingredientId = ing.id;
            }

            if (ingredientId) {
              await tx.insert(recipeIngredientsTable).values({
                drinkId: drink.id,
                ingredientId,
                amountInMl: Number(r.amountInMl),
              } as typeof recipeIngredientsTable.$inferInsert);
            }
          }
        }
      }
    });

    res.json({ success: true, count: drinks.length });
  } catch (err: any) {
    console.error("Bulk drinks import error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
