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
  nameEs: z.string().optional().nullable(),
  type: z
    .string()
    .default("spirit")
    .pipe(z.string().transform((s) => s.toLowerCase())),
  subtype: z.string().optional().nullable(),
  baseUnit: z.string().default("ml"),
  baseUnitAmount: z.coerce.number().positive().default(750),
  bulkUnit: z.string().optional().nullable(),
  bulkSize: z.coerce.number().optional().nullable(),
  partialUnit: z.string().optional().nullable(),
  servingSize: z.coerce.number().positive().default(44.36),
  servingUnit: z.string().optional().nullable(),
  pourSize: z.coerce.number().optional().nullable(),
  bottleSizeMl: z.coerce.number().optional().nullable(),
  alcoholDensity: z.coerce.number().optional().nullable(),
  density: z.coerce.number().optional().nullable(),
  tareWeightG: z.coerce.number().optional().nullable(),
  glassWeightG: z.coerce.number().optional().nullable(),
  fullBottleWeightG: z.coerce.number().optional().nullable(),
  orderCost: z.coerce.number().nonnegative().default(0),
  markupFactor: z.coerce.number().positive().default(3.0),
  currentStock: z.coerce.number().nonnegative().default(0),
  currentBulk: z.coerce.number().nonnegative().default(0),
  currentPartial: z.coerce.number().nonnegative().default(0),
  lowStockMethod: z.string().optional().nullable(),
  lowStockManualThreshold: z.coerce.number().optional().nullable(),
  lowStockPercent: z.coerce.number().optional().nullable(),
  lowStockUsageDays: z.coerce.number().optional().nullable(),
  lowStockThreshold: z.coerce.number().nonnegative().default(1),
  unitsPerCase: z.coerce.number().positive().default(1),
  isOnMenu: z.boolean().optional().default(false),
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
        const pourSize = item.pourSize || null;
        const bottleSizeMl = item.bottleSizeMl || null;
        const alcoholDensity = item.alcoholDensity
          ? Number(item.alcoholDensity)
          : 0.955;
        const density = item.density ? Number(item.density) : 0.94;
        const tareWeightG = item.tareWeightG ? Number(item.tareWeightG) : null;
        const glassWeightG = item.glassWeightG
          ? Number(item.glassWeightG)
          : null;
        const fullBottleWeightG = item.fullBottleWeightG
          ? Number(item.fullBottleWeightG)
          : null;
        const currentStock = item.currentStock || item.stock || item.qty || 0;
        const currentBulk = item.currentBulk || 0;
        const currentPartial = item.currentPartial || 0;
        const orderCost = item.orderCost || item.cost || item.bulkCost || 0;
        const markupFactor = item.markupFactor || 3.0;
        const lowStockMethod = item.lowStockMethod || "manual";
        const lowStockManualThreshold = item.lowStockManualThreshold || null;
        const lowStockPercent = item.lowStockPercent || null;
        const lowStockUsageDays = item.lowStockUsageDays || null;
        const lowStockThreshold =
          item.lowStockManualThreshold ||
          item.lowStockThreshold ||
          item.min ||
          item.minimumStock ||
          1;
        const unitsPerCase = item.unitsPerCase || 1;
        const isOnMenu = item.isOnMenu ? 1 : 0;
        const bulkUnit = item.bulkUnit || null;
        const bulkSize = item.bulkSize ? Number(item.bulkSize) : null;
        const partialUnit = item.partialUnit || null;

        try {
          const [existing] = await tx
            .select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.name, name));

          if (existing) {
            if (strategy === "skip") {
              skippedCount++;
              continue;
            }

            if (strategy === "merge") {
              // Merge: only update empty/missing fields, keep existing values
              await tx
                .update(inventoryItemsTable)
                .set({
                  nameEs: item.nameEs || existing.nameEs,
                  type: existing.type,
                  subtype: subtype || existing.subtype,
                  baseUnit: existing.baseUnit,
                  baseUnitAmount: existing.baseUnitAmount,
                  bulkUnit: bulkUnit || existing.bulkUnit,
                  bulkSize: bulkSize || existing.bulkSize,
                  partialUnit: partialUnit || existing.partialUnit,
                  servingSize: existing.servingSize,
                  servingUnit: servingUnit || existing.servingUnit,
                  pourSize: pourSize || existing.pourSize,
                  bottleSizeMl: bottleSizeMl || existing.bottleSizeMl,
                  alcoholDensity: existing.alcoholDensity,
                  density: existing.density,
                  tareWeightG: existing.tareWeightG,
                  glassWeightG: glassWeightG || existing.glassWeightG,
                  fullBottleWeightG:
                    fullBottleWeightG || existing.fullBottleWeightG,
                  orderCost: existing.orderCost,
                  markupFactor: existing.markupFactor,
                  currentStock: existing.currentStock,
                  currentBulk: existing.currentBulk,
                  currentPartial: existing.currentPartial,
                  lowStockMethod: existing.lowStockMethod,
                  lowStockManualThreshold: existing.lowStockManualThreshold,
                  lowStockPercent: existing.lowStockPercent,
                  lowStockUsageDays: existing.lowStockUsageDays,
                  unitsPerCase: existing.unitsPerCase,
                  isOnMenu: existing.isOnMenu,
                  updatedAt: new Date(),
                })
                .where(eq(inventoryItemsTable.id, existing.id));
            } else {
              // Update (default): replace all values
              await tx
                .update(inventoryItemsTable)
                .set({
                  name,
                  nameEs: item.nameEs || existing.nameEs || null,
                  type,
                  subtype,
                  baseUnit,
                  baseUnitAmount,
                  bulkUnit,
                  bulkSize,
                  partialUnit,
                  servingSize,
                  servingUnit,
                  pourSize,
                  bottleSizeMl,
                  alcoholDensity,
                  density,
                  tareWeightG,
                  glassWeightG,
                  fullBottleWeightG,
                  orderCost,
                  markupFactor,
                  currentStock,
                  currentBulk,
                  currentPartial,
                  lowStockMethod,
                  lowStockManualThreshold,
                  lowStockPercent,
                  lowStockUsageDays,
                  lowStockThreshold,
                  unitsPerCase,
                  isOnMenu: !!isOnMenu,
                  updatedAt: new Date(),
                })
                .where(eq(inventoryItemsTable.id, existing.id));
            }
          } else {
            // Insert new item
            await tx.insert(inventoryItemsTable).values({
              name,
              nameEs: item.nameEs || null,
              type,
              subtype,
              baseUnit,
              baseUnitAmount,
              bulkUnit,
              bulkSize,
              partialUnit,
              servingSize,
              servingUnit,
              pourSize,
              bottleSizeMl,
              alcoholDensity,
              density,
              tareWeightG,
              glassWeightG,
              fullBottleWeightG,
              orderCost,
              markupFactor,
              currentStock,
              currentBulk,
              currentPartial,
              lowStockMethod,
              lowStockManualThreshold,
              lowStockPercent,
              lowStockUsageDays,
              lowStockThreshold,
              unitsPerCase,
              isOnMenu: !!isOnMenu,
              updatedAt: new Date(),
            });
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
              markupFactor: Number(item.markupFactor) || 3.0,
              actualPrice: item.actualPrice
                ? Number(item.actualPrice)
                : undefined,
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
