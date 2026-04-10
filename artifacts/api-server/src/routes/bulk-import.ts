import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import {
  db,
  inventoryItemsTable,
  drinksTable,
  recipeIngredientsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const IngredientRowSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  type: z
    .string()
    .default("spirit")
    .pipe(z.string().transform((s) => s.toLowerCase())),
  subtype: z.string().optional().nullable(),
  baseUnit: z.string().default("ml"),
  baseUnitAmount: z.coerce.number().positive().default(750),
  bulkUnit: z.string().optional().nullable(),
  servingSize: z.coerce.number().positive().default(44.36),
  servingUnit: z.string().optional().nullable(),
  bottleSizeMl: z.coerce.number().optional().nullable(),
  fullBottleWeightG: z.coerce.number().optional().nullable(),
  orderCost: z.coerce.number().nonnegative().default(0),
  currentStock: z.coerce.number().nonnegative().default(0),
  currentPartial: z.coerce.number().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().nonnegative().default(1),
  unitsPerCase: z.coerce.number().positive().default(1),
  isOnMenu: z.boolean().optional().default(false),
  sellSingleServing: z.boolean().optional().default(false),
  singleServingPrice: z.coerce.number().optional().nullable(),
  // Aliases for source fields
  unitSize: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  bulkCost: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  qty: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  minimumStock: z.coerce.number().optional(),
});

const DrinkRowSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  nameEs: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionEs: z.string().optional().nullable(),
  category: z.string().default("cocktail"),
  markupFactor: z.coerce.number().positive().default(3.0),
  actualPrice: z.coerce.number().optional().nullable(),
  sourceType: z.string().default("standard"),
  recipe: z
    .array(
      z.object({
        ingredientId: z.string().optional(),
        ingredientName: z.string().optional(),
        amountInBaseUnit: z.coerce.number().positive(),
      }),
    )
    .optional(),
});

const router: IRouter = Router();

router.post("/bulk-ingredients", async (req: Request, res: Response) => {
  const { ingredients, strategy = "update" } = req.body;

  if (!Array.isArray(ingredients)) {
    res
      .status(400)
      .json({ error: "Invalid input: ingredients must be an array" });
    return;
  }

  const validStrategies = ["update", "merge", "skip", "replace"];
  if (!validStrategies.includes(strategy)) {
    res.status(400).json({
      error: `Invalid strategy: ${strategy}. Must be one of: ${validStrategies.join(", ")}`,
    });
    return;
  }

  // Validate database connection first
  try {
    await db.select().from(inventoryItemsTable).limit(1);
  } catch (dbErr: any) {
    console.error("Database connection test failed:", dbErr.message);
    res.status(500).json({
      error: `Database error: ${dbErr.message}. The database may not be initialized. Please restart the application.`,
    });
    return;
  }

  // Validate all rows first and collect errors
  const validationErrors: { row: number; errors: string[] }[] = [];
  const validRows: any[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    const result = IngredientRowSchema.safeParse(ingredients[i]);
    if (!result.success) {
      validationErrors.push({
        row: i + 1,
        errors: result.error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        ),
      });
    } else {
      validRows.push({ index: i, data: result.data });
    }
  }

  if (validationErrors.length > 0) {
    res.status(400).json({
      error: "Validation failed",
      validationErrors,
      summary: `${validationErrors.length} of ${ingredients.length} rows failed validation`,
    });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      // Handle "replace" strategy - delete all existing items first
      if (strategy === "replace") {
        console.log(
          "[Bulk Import] Replace strategy - deleting all inventory items",
        );
        await tx.delete(inventoryItemsTable);
      }

      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Track parents for auto-pooling within this session
      const nameToParentId = new Map<string, string>();

      for (const { data: item } of validRows) {
        const name = item.name;
        const type = item.type;
        const subtype = item.subtype || null;

        // Map all CSV columns to inventory item fields
        const baseUnit = item.baseUnit || "ml";
        const baseUnitAmount =
          item.baseUnitAmount || item.unitSize || item.size || 750;
        const servingSize = item.servingSize || 44.36;
        const servingUnit = item.servingUnit || null;
        const bottleSizeMl = item.bottleSizeMl || null;
        const fullBottleWeightG = item.fullBottleWeightG || null;
        // Calculate glassWeightG from fullBottleWeightG if provided
        const density = 0.94; // Default density
        const glassWeightG = fullBottleWeightG
          ? fullBottleWeightG - baseUnitAmount * density
          : null;
        const currentStock = item.currentStock || item.stock || item.qty || 0;
        const currentPartial = item.currentPartial || 0;
        const orderCost = item.orderCost || item.cost || item.bulkCost || 0;
        const lowStockThreshold =
          item.lowStockThreshold || item.min || item.minimumStock || 1;
        const unitsPerCase = item.unitsPerCase || 1;
        const isOnMenu = item.isOnMenu ? 1 : 0;
        const singleServingPrice = item.singleServingPrice || null;
        const sellSingleServing =
          singleServingPrice && singleServingPrice > 0 ? 1 : 0;
        const bulkUnit = item.bulkUnit || null;

        try {
          // AUTO-POOLING logic: ONLY for Spirits and Mixers
          let parentItemId: string | null = null;
          const isPooledType = type === "spirit" || type === "mixer";

          if (isPooledType) {
            if (nameToParentId.has(name)) {
              parentItemId = nameToParentId.get(name)!;
            } else {
              // Check DB for an existing top-level item with this name
              const [dbParent] = await tx
                .select()
                .from(inventoryItemsTable)
                .where(eq(inventoryItemsTable.name, name))
                .limit(1);

              if (dbParent) {
                // If it's already a variation, find its parent
                parentItemId = dbParent.parentItemId || dbParent.id;
                nameToParentId.set(name, parentItemId);
              }
            }
          }

          // Search criteria for "existing" depends on strategy
          // For spirits/mixers, we might want to check name + size if we allow multiple variations in DB
          const [existing] = await tx
            .select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.name, name))
            .limit(1);

          if (existing) {
            if (strategy === "skip") {
              skippedCount++;
              continue;
            }

            if (strategy === "merge") {
              await tx
                .update(inventoryItemsTable)
                .set({
                  type: existing.type,
                  subtype: subtype || existing.subtype,
                  baseUnit: existing.baseUnit,
                  baseUnitAmount: existing.baseUnitAmount,
                  bulkUnit: bulkUnit || existing.bulkUnit,
                  servingSize: existing.servingSize,
                  servingUnit: servingUnit || existing.servingUnit,
                  bottleSizeMl: bottleSizeMl || existing.bottleSizeMl,
                  fullBottleWeightG:
                    fullBottleWeightG || existing.fullBottleWeightG,
                  glassWeightG: glassWeightG || existing.glassWeightG,
                  orderCost: existing.orderCost,
                  currentStock: existing.currentStock,
                  currentPartial: existing.currentPartial,
                  lowStockThreshold: existing.lowStockThreshold,
                  unitsPerCase: existing.unitsPerCase,
                  isOnMenu: existing.isOnMenu,
                  sellSingleServing: !!existing.sellSingleServing,
                  singleServingPrice: existing.singleServingPrice,
                  parentItemId: existing.parentItemId,
                  updatedAt: new Date(),
                })
                .where(eq(inventoryItemsTable.id, existing.id));
            } else {
              // Update (default): replace all values
              await tx
                .update(inventoryItemsTable)
                .set({
                  name,
                  type,
                  subtype,
                  baseUnit,
                  baseUnitAmount,
                  bulkUnit,
                  servingSize,
                  servingUnit,
                  bottleSizeMl,
                  fullBottleWeightG,
                  glassWeightG,
                  orderCost,
                  currentStock,
                  currentPartial,
                  lowStockThreshold,
                  unitsPerCase,
                  isOnMenu: !!isOnMenu,
                  sellSingleServing: !!sellSingleServing,
                  singleServingPrice,
                  parentItemId: parentItemId || existing.parentItemId,
                  updatedAt: new Date(),
                })
                .where(eq(inventoryItemsTable.id, existing.id));
            }

            // Sync drinks for existing item update
            if (isOnMenu) {
              const drinkData = {
                name: name,
                category: type,
                actualPrice: 0,
                isAvailable: true,
                isOnMenu: true,
                sourceType: "inventory_single",
                updatedAt: new Date(),
              };
              const [existingDrink] = await tx
                .select()
                .from(drinksTable)
                .where(eq(drinksTable.id, existing.id));
              if (existingDrink) {
                await tx
                  .update(drinksTable)
                  .set(drinkData)
                  .where(eq(drinksTable.id, existing.id));
              } else {
                await tx
                  .insert(drinksTable)
                  .values({ id: existing.id, ...drinkData });
              }
            }

            if (sellSingleServing) {
              const singleDrinkId = `${existing.id}-single`;
              const singleDrinkData = {
                name: `${name} (Shot)`,
                category: type,
                actualPrice: singleServingPrice || 0,
                isAvailable: true,
                isOnMenu: true,
                sourceType: "inventory_single",
                updatedAt: new Date(),
              };
              const [existingSingle] = await tx
                .select()
                .from(drinksTable)
                .where(eq(drinksTable.id, singleDrinkId));
              if (existingSingle) {
                await tx
                  .update(drinksTable)
                  .set(singleDrinkData)
                  .where(eq(drinksTable.id, singleDrinkId));
              } else {
                await tx
                  .insert(drinksTable)
                  .values({ id: singleDrinkId, ...singleDrinkData });
              }
            }
          } else {
            // Insert new item
            const [inserted] = await tx
              .insert(inventoryItemsTable)
              .values({
                name,
                type,
                subtype,
                baseUnit,
                baseUnitAmount,
                bulkUnit,
                servingSize,
                servingUnit,
                bottleSizeMl,
                fullBottleWeightG,
                glassWeightG,
                orderCost,
                currentStock,
                currentPartial,
                lowStockThreshold,
                unitsPerCase,
                isOnMenu: !!isOnMenu,
                sellSingleServing: !!sellSingleServing,
                singleServingPrice,
                parentItemId,
                updatedAt: new Date(),
              } as any)
              .returning();

            // Create drinks for new item
            if (isOnMenu) {
              await tx.insert(drinksTable).values({
                id: inserted.id,
                name: name,
                category: type,
                actualPrice: 0,
                isAvailable: true,
                isOnMenu: true,
                sourceType: "inventory_single",
              });
            }

            if (sellSingleServing) {
              await tx.insert(drinksTable).values({
                id: `${inserted.id}-single`,
                name: `${name} (Shot)`,
                category: type,
                actualPrice: singleServingPrice || 0,
                isAvailable: true,
                isOnMenu: true,
                sourceType: "inventory_single",
              });
            }

            if (isPooledType && !parentItemId) {
              nameToParentId.set(name, inserted.id);
            }
          }
          processedCount++;
        } catch (itemErr: any) {
          console.error(`Error processing item "${name}":`, itemErr.message);
          errorCount++;
          if (errorCount > 10) {
            throw new Error(
              `Too many errors (${errorCount}). Stopping import. Last error: ${itemErr.message}`,
            );
          }
        }
      }

      console.log(
        `[Bulk Import] Complete: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors, strategy: ${strategy}`,
      );

      const message =
        strategy === "replace"
          ? `Replaced inventory with ${processedCount} items`
          : strategy === "skip"
            ? `Imported ${processedCount} new items, skipped ${skippedCount} existing`
            : strategy === "merge"
              ? `Merged ${processedCount} items (kept existing values)`
              : `Updated ${processedCount} items`;

      res.json({
        success: true,
        count: processedCount,
        skipped: skippedCount,
        errors: errorCount,
        message,
      });
    });
  } catch (err: any) {
    console.error("Bulk ingredients import error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: err.message || "Unknown error occurred" });
  }
});

router.post("/bulk-drinks", async (req: Request, res: Response) => {
  const { drinks } = req.body;

  if (!Array.isArray(drinks)) {
    res.status(400).json({ error: "Invalid input: drinks must be an array" });
    return;
  }

  // Validate all rows first and collect errors
  const validationErrors: { row: number; errors: string[] }[] = [];
  const validRows: any[] = [];

  for (let i = 0; i < drinks.length; i++) {
    const result = DrinkRowSchema.safeParse(drinks[i]);
    if (!result.success) {
      validationErrors.push({
        row: i + 1,
        errors: result.error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        ),
      });
    } else {
      validRows.push({ index: i, data: result.data });
    }
  }

  if (validationErrors.length > 0) {
    res.status(400).json({
      error: "Validation failed",
      validationErrors,
      summary: `${validationErrors.length} of ${drinks.length} rows failed validation`,
    });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      for (const { data: item } of validRows) {
        const [existing] = await tx
          .select()
          .from(drinksTable)
          .where(eq(drinksTable.name, item.name));

        let drink;
        if (existing) {
          [drink] = await tx
            .update(drinksTable)
            .set({
              name: item.name,
              nameEs: item.nameEs || null,
              description: item.description || null,
              descriptionEs: item.descriptionEs || null,
              category: item.category || "cocktail",
              actualPrice: item.actualPrice
                ? Number(item.actualPrice)
                : undefined,
              sourceType: item.sourceType || "standard",
              updatedAt: new Date(),
            })
            .where(eq(drinksTable.id, existing.id))
            .returning();
        } else {
          [drink] = await tx
            .insert(drinksTable)
            .values({
              name: item.name,
              nameEs: item.nameEs || null,
              description: item.description || null,
              descriptionEs: item.descriptionEs || null,
              category: item.category || "cocktail",
              markupFactor: Number(item.markupFactor) || 3.0,
              actualPrice: item.actualPrice
                ? Number(item.actualPrice)
                : undefined,
              sourceType: item.sourceType || "standard",
            } as typeof drinksTable.$inferInsert)
            .returning();
        }

        if (drink && Array.isArray(item.recipe) && item.recipe.length > 0) {
          await tx
            .delete(recipeIngredientsTable)
            .where(eq(recipeIngredientsTable.drinkId, drink.id));

          for (const r of item.recipe) {
            let ingredientId = r.ingredientId;
            if (!ingredientId && r.ingredientName) {
              const [ing] = await tx
                .select()
                .from(inventoryItemsTable)
                .where(eq(inventoryItemsTable.name, r.ingredientName));
              if (ing) ingredientId = ing.id;
            }

            if (ingredientId) {
              const amountInBaseUnit = Number(r.amountInBaseUnit);
              await tx.insert(recipeIngredientsTable).values({
                drinkId: drink.id,
                ingredientId,
                amountInBaseUnit,
              } as typeof recipeIngredientsTable.$inferInsert);
            }
          }
        }
      }
    });

    res.json({
      success: true,
      count: validRows.length,
      message: `Successfully imported ${validRows.length} drinks`,
    });
  } catch (err: any) {
    console.error("Bulk drinks import error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
