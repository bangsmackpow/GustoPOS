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
  baseUnitAmount: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 750 : Math.max(0, val)))
    .default(750),
  bulkUnit: z.string().optional().nullable(),
  servingSize: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 44.36 : Math.max(0, val)))
    .default(44.36),
  servingUnit: z.string().optional().nullable(),
  bottleSizeMl: z.coerce.number().optional().nullable(),
  fullBottleWeightG: z.coerce.number().optional().nullable(),
  density: z.coerce
    .number()
    .transform((val) => (isNaN(val) || val === 0 ? 0.94 : val))
    .default(0.94),
  orderCost: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 0 : Math.max(0, val)))
    .default(0),
  currentStock: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 0 : Math.max(0, val)))
    .default(0),
  currentBulk: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 0 : Math.max(0, val)))
    .default(0),
  currentPartial: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 0 : Math.max(0, val)))
    .default(0),
  lowStockThreshold: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 1 : Math.max(0, val)))
    .default(1),
  unitsPerCase: z.coerce
    .number()
    .transform((val) => (isNaN(val) ? 1 : Math.max(0, val)))
    .default(1),
  trackingMode: z.string().optional().default("auto"),
  isOnMenu: z
    .union([z.boolean(), z.number()])
    .optional()
    .default(false)
    .transform((val) => (val ? 1 : 0)),
  sellSingleServing: z
    .union([z.boolean(), z.number()])
    .optional()
    .default(false)
    .transform((val) => (val ? 1 : 0)),
  singleServingPrice: z.coerce.number().optional().nullable(),
  unitSize: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  bulkCost: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  qty: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  minimumStock: z.coerce.number().optional(),
  alcoholDensity: z.coerce.number().optional(),
});

const DrinkRowSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional().nullable(),
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
    const row = ingredients[i];

    // Skip completely empty rows
    const hasContent =
      row &&
      Object.values(row).some((v) => v !== "" && v !== null && v !== undefined);
    if (!hasContent) {
      continue;
    }

    // Sanitize row - convert empty strings to undefined for optional fields
    // Also handle numbers with commas (e.g., "1,000" -> 1000)
    const sanitizedRow: Record<string, any> = {};
    for (const [key, value] of Object.entries(row || {})) {
      if (value === "" || value === null || value === undefined) {
        sanitizedRow[key] = undefined;
      } else if (typeof value === "string") {
        // Remove commas and trim for number parsing
        const cleanedValue = value.replace(/,/g, "").trim();
        if (!isNaN(Number(cleanedValue))) {
          sanitizedRow[key] = Number(cleanedValue);
        } else {
          sanitizedRow[key] = value.trim();
        }
      } else {
        sanitizedRow[key] = value;
      }
    }

    const result = IngredientRowSchema.safeParse(sanitizedRow);
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
    console.log(
      `[Bulk Import] ${validationErrors.length} rows failed validation, proceeding with ${validRows.length} valid rows`,
    );
  }

  if (validRows.length === 0) {
    res.status(400).json({
      error: "No valid rows to import",
      failedRows: validationErrors,
      summary: `All ${ingredients.length} rows failed validation`,
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
        // Calculate containerWeightG from fullBottleWeightG if provided
        // Container Weight = Full Weight - (Bottle Size in ml × Density)
        const density = item.density || 0.94;
        const bottleSizeForCalc =
          item.bottleSizeMl || item.baseUnitAmount || 750;
        const containerWeightG = fullBottleWeightG
          ? fullBottleWeightG - bottleSizeForCalc * density
          : null;
        const currentStock = item.currentStock || item.stock || item.qty || 0;
        const currentBulk = item.currentBulk || 0;
        const currentPartial = item.currentPartial || 0;
        const orderCost = item.orderCost || item.cost || item.bulkCost || 0;
        const lowStockThreshold =
          item.lowStockThreshold || item.min || item.minimumStock || 1;
        const unitsPerCase = item.unitsPerCase || 1;

        // Determine trackingMode based on container size (failsafe)
        // >=100 = ml (pool), <100 = units (collection)
        let trackingMode = item.trackingMode || "auto";
        const containerSize = item.bottleSizeMl || item.baseUnitAmount || 0;

        // Normalize type for comparison (handle "spirits" -> "spirit", "tequila" -> "spirit", etc.)
        const normalizedType = (type || "").toLowerCase().replace(/s$/, "");

        if (trackingMode === "auto") {
          if (containerSize >= 100) {
            trackingMode = "pool";
          } else if (containerSize > 0) {
            trackingMode = "collection";
          }

          // Override based on type for known categories
          if (
            normalizedType === "spirit" ||
            normalizedType === "tequila" ||
            normalizedType === "mezcal" ||
            normalizedType === "whiskey" ||
            normalizedType === "vodka" ||
            normalizedType === "gin" ||
            normalizedType === "rum" ||
            normalizedType === "vino" ||
            normalizedType === "mixer" ||
            (normalizedType === "ingredient" &&
              (subtype || "").toLowerCase() === "liquid")
          ) {
            trackingMode = "pool";
          } else if (
            normalizedType === "beer" ||
            normalizedType === "merch" ||
            normalizedType === "misc" ||
            (normalizedType === "ingredient" &&
              (subtype || "").toLowerCase() === "weighted")
          ) {
            trackingMode = "collection";
          }
        }

        const isOnMenu = item.isOnMenu ? 1 : 0;
        const singleServingPrice = item.singleServingPrice || null;
        const sellSingleServing =
          singleServingPrice && singleServingPrice > 0 ? 1 : 0;
        const bulkUnit = item.bulkUnit || null;

        try {
          // AUTO-POOLING logic: ONLY for Spirits and Mixers
          let parentItemId: string | null = null;
          const normalizedType = (type || "").toLowerCase().replace(/s$/, "");
          const isPooledType =
            normalizedType === "spirit" ||
            normalizedType === "tequila" ||
            normalizedType === "mezcal" ||
            normalizedType === "whiskey" ||
            normalizedType === "vodka" ||
            normalizedType === "gin" ||
            normalizedType === "rum" ||
            normalizedType === "vino" ||
            normalizedType === "mixer";

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
                  subtype:
                    subtype && subtype.trim() !== ""
                      ? subtype
                      : existing.subtype,
                  baseUnit: existing.baseUnit,
                  baseUnitAmount: existing.baseUnitAmount,
                  bulkUnit: bulkUnit || existing.bulkUnit,
                  servingSize: existing.servingSize,
                  servingUnit: servingUnit || existing.servingUnit,
                  bottleSizeMl: bottleSizeMl || existing.bottleSizeMl,
                  fullBottleWeightG:
                    fullBottleWeightG || existing.fullBottleWeightG,
                  containerWeightG:
                    containerWeightG || existing.containerWeightG,
                  orderCost: existing.orderCost,
                  currentStock: existing.currentStock,
                  currentBulk: currentBulk || existing.currentBulk,
                  currentPartial: existing.currentPartial,
                  lowStockThreshold: existing.lowStockThreshold,
                  unitsPerCase: existing.unitsPerCase,
                  trackingMode: trackingMode || existing.trackingMode,
                  isOnMenu: existing.isOnMenu,
                  sellSingleServing: existing.sellSingleServing ? 1 : 0,
                  singleServingPrice: existing.singleServingPrice,
                  parentItemId: existing.parentItemId,
                  updatedAt: Math.floor(Date.now() / 1000),
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
                  containerWeightG,
                  orderCost,
                  currentStock,
                  currentBulk,
                  currentPartial,
                  lowStockThreshold,
                  unitsPerCase,
                  trackingMode,
                  isOnMenu: isOnMenu ? 1 : 0,
                  sellSingleServing: sellSingleServing ? 1 : 0,
                  singleServingPrice,
                  parentItemId: parentItemId || existing.parentItemId,
                  updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(inventoryItemsTable.id, existing.id));
            }

            // Sync drinks for existing item update
            if (isOnMenu) {
              const drinkData = {
                name: name,
                category: type,
                actualPrice: 0,
                isAvailable: 1,
                isOnMenu: 1,
                sourceType: "inventory_single",
                updatedAt: Math.floor(Date.now() / 1000),
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
                isAvailable: 1,
                isOnMenu: 1,
                sourceType: "inventory_single",
                updatedAt: Math.floor(Date.now() / 1000),
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
                containerWeightG,
                orderCost,
                currentStock,
                currentBulk,
                currentPartial,
                lowStockThreshold,
                unitsPerCase,
                trackingMode,
                isOnMenu: isOnMenu ? 1 : 0,
                sellSingleServing: sellSingleServing ? 1 : 0,
                singleServingPrice,
                parentItemId,
                updatedAt: Math.floor(Date.now() / 1000),
              } as any)
              .returning();

            // Map inventory type to drink category
            const getCategoryForType = (itemType: string, itemName: string): string => {
              const nameLower = itemName.toLowerCase();
              if (itemType === "spirit") {
                // Vino/sparkling wine gets wine category
                if (nameLower.includes("vino") || nameLower.includes("wine") || nameLower.includes("champagne") || nameLower.includes("espumoso")) {
                  return "wine";
                }
                return "shot";
              }
              if (itemType === "mixer") return "beverage";
              if (itemType === "beer") return "beer";
              if (itemType === "merch") return "other";
              return "other";
            };

            // Create drinks for new item
            if (isOnMenu) {
              const drinkCategory = getCategoryForType(type, name);
              await tx.insert(drinksTable).values({
                id: inserted.id,
                name: name,
                category: drinkCategory,
                actualPrice: 0,
                menuPrice: 0,
                priceSource: "auto",
                sourceType: "inventory_single",
                isAvailable: 1,
                isOnMenu: 1,
              });

              // Auto-create recipe: add 1 serving of the item to itself
              await tx.insert(recipeIngredientsTable).values({
                drinkId: inserted.id,
                ingredientId: inserted.id,
                amountInBaseUnit: servingSize || 44.36,
              });
            }

            if (sellSingleServing) {
              const shotCategory = getCategoryForType(type, name);
              await tx.insert(drinksTable).values({
                id: `${inserted.id}-single`,
                name: `${name} (Shot)`,
                category: shotCategory,
                actualPrice: singleServingPrice || 0,
                menuPrice: singleServingPrice || 0,
                priceSource: "auto",
                sourceType: "inventory_single",
                isAvailable: 1,
                isOnMenu: 1,
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
        failedRows: validationErrors,
        message,
      });
    });
  } catch (err: any) {
    console.error("Bulk ingredients import error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error: err.message || "Unknown error occurred",
      failedRows: validationErrors,
    });
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
              description: item.description || null,
              category: item.category || "cocktail",
              actualPrice: item.actualPrice
                ? Number(item.actualPrice)
                : undefined,
              sourceType: item.sourceType || "standard",
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(drinksTable.id, existing.id))
            .returning();
        } else {
          [drink] = await tx
            .insert(drinksTable)
            .values({
              name: item.name,
              description: item.description || null,
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
