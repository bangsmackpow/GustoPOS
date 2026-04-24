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
    .transform((val) => (isNaN(val) ? 59.15 : Math.max(0, val)))
    .default(59.15),
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
  // Add case size aliases for beer import
  caseSize: z.coerce.number().optional(),
  caseCount: z.coerce.number().optional(),
  caseUnits: z.coerce.number().optional(),
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
  menuPricePerServing: z.coerce.number().optional().nullable(),
  productPrice: z.coerce.number().optional().nullable(),
  unitSize: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  bulkCost: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  qty: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  minimumStock: z.coerce.number().optional(),
  alcoholDensity: z.coerce.number().optional(),
  markupFactor: z.coerce.number().optional(),
  isHouseDefault: z
    .union([z.boolean(), z.number()])
    .optional()
    .default(false)
    .transform((val) => (val ? 1 : 0)),
  isHouse: z
    .union([z.boolean(), z.number()])
    .optional()
    .default(false)
    .transform((val) => (val ? 1 : 0)),
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

      // No auto-pooling - all items created as independent parents
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
        // Weight failsafe: IF fullBottleWeightG > 0, use it. Else: use liquid + 500g bottle estimate
        const density = item.density || 0.94;
        const bottleSizeForCalc =
          item.bottleSizeMl || item.baseUnitAmount || 750;
        const liquidWeightG = bottleSizeForCalc * density;
        const fullBottleWeightGInput = item.fullBottleWeightG || 0;
        
        // IF fullBottleWeightG > 0, use it. Else: use liquid + 500g bottle estimate
        const fullBottleWeightG = fullBottleWeightGInput > 0
          ? fullBottleWeightGInput
          : liquidWeightG + 500;
        
        // Container weight = full weight - liquid weight
        const containerWeightG = fullBottleWeightG - liquidWeightG; // auto-calculated
        
        const currentStock = item.currentStock || item.stock || item.qty || 0;
        const currentBulk = item.currentBulk || 0;
        const currentPartial = item.currentPartial || 0;
        const orderCost = item.orderCost || item.cost || item.bulkCost || 0;
        const lowStockThreshold =
          item.lowStockThreshold || item.min || item.minimumStock || 1;
        // Handle case size aliases for beer: caseSize, caseCount, caseUnits, OR unitsPerCase
        const unitsPerCase =
          item.unitsPerCase ||
          item.caseCount ||
          item.caseSize ||
          item.caseUnits ||
          1;

        // Determine trackingMode - check type FIRST before container size
        // This ensures beer/merch/misc gets collection mode regardless of size
        let trackingMode = item.trackingMode || "auto";
        const containerSize = item.bottleSizeMl || item.baseUnitAmount || 0;

        // Normalize type for comparison (handle "spirits" -> "spirit", "tequila" -> "spirit", etc.)
        const normalizedType = (type || "").toLowerCase().replace(/s$/, "");

        if (trackingMode === "auto") {
          // FIRST: Override based on type for known categories (takes priority)
          if (
            normalizedType === "beer" ||
            normalizedType === "merch" ||
            normalizedType === "misc" ||
            (normalizedType === "ingredient" &&
              (subtype || "").toLowerCase() === "weighted")
          ) {
            trackingMode = "collection";
          } else if (
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
          }
          // FALLBACK: Use container size only if type didn't determine it
          else if (containerSize >= 100) {
            trackingMode = "pool";
          } else if (containerSize > 0) {
            trackingMode = "collection";
          }
        }

        const isOnMenu = item.isOnMenu ? 1 : 0;
        // Support both isHouseDefault and isHouse column aliases
        const isHouseDefault = (item.isHouseDefault || item.isHouse) ? 1 : 0;
        const singleServingPrice = item.singleServingPrice || null;
        const menuPricePerServing = item.menuPricePerServing || item.productPrice || null;
        const productPrice = item.productPrice || item.menuPricePerServing || null;
        const markupFactor = item.markupFactor || 3.0;
        const sellSingleServing =
          singleServingPrice && singleServingPrice > 0 ? 1 : 0;
        const bulkUnit = item.bulkUnit || null;

        try {
          // No auto-grouping - all items are created as independent parent items
          // Users can manually link items via "Link to Parent" in the UI
          const parentItemId: string | null = null;

          // Generate unique ID from name + bottleSizeMl (e.g., "tiahuani750")
          const itemId = (name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "") + (bottleSizeMl || 750);

          // Search by unique ID instead of name
          const [existing] = await tx
            .select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, itemId))
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
                  type: type || existing.type,
                  subtype:
                    subtype && subtype.trim() !== ""
                      ? subtype
                      : existing.subtype,
                  baseUnit: existing.baseUnit,
                  baseUnitAmount: existing.baseUnitAmount,
                  bulkUnit: bulkUnit || existing.bulkUnit,
                  servingSize: servingSize || existing.servingSize,
                  servingUnit: servingUnit || existing.servingUnit,
                  bottleSizeMl: bottleSizeMl || existing.bottleSizeMl,
                  fullBottleWeightG:
                    fullBottleWeightG || existing.fullBottleWeightG,
                  containerWeightG: containerWeightG || existing.containerWeightG,
                  density: density || existing.density,
                  orderCost: orderCost !== undefined ? orderCost : existing.orderCost,
                  currentStock: currentStock !== undefined ? currentStock : existing.currentStock,
                  currentBulk: currentBulk !== undefined ? currentBulk : existing.currentBulk,
                  currentPartial: currentPartial !== undefined ? currentPartial : existing.currentPartial,
                  lowStockThreshold: lowStockThreshold || existing.lowStockThreshold,
                  unitsPerCase: unitsPerCase || existing.unitsPerCase,
                  trackingMode: trackingMode || existing.trackingMode,
                  isOnMenu: isOnMenu !== undefined ? isOnMenu : existing.isOnMenu,
                  sellSingleServing: existing.sellSingleServing ? 1 : 0,
                  singleServingPrice: existing.singleServingPrice,
                  parentItemId: existing.parentItemId,
                  isHouseDefault: isHouseDefault !== undefined ? isHouseDefault : existing.isHouseDefault,
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
                  // containerWeightG is calculated automatically from fullBottleWeightG
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
                  isHouseDefault: isHouseDefault ? 1 : 0,
                  updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(inventoryItemsTable.id, existing.id));
            }

          } else {
            // Insert new item
            const [inserted] = await tx
              .insert(inventoryItemsTable)
              .values({
                id: itemId,
                name,
                nameEs: null,
                type,
                subtype,
                baseUnit,
                baseUnitAmount,
                bulkUnit,
                servingSize,
                servingUnit,
                pourSize: servingSize,
                bottleSizeMl,
                fullBottleWeightG,
                // containerWeightG is calculated automatically from fullBottleWeightG
                density,
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
                menuPricePerServing: menuPricePerServing,
                productPrice: productPrice,
                markupFactor: markupFactor || 3.0,
                isHouseDefault: isHouseDefault ? 1 : 0,
                parentItemId,
                createdAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000),
              } as any)
              .returning();

            console.log(`[Bulk Import] Inserted: "${name}" id=${inserted.id} bottleSizeMl=${bottleSizeMl} currentBulk=${currentBulk} currentPartial=${currentPartial}`);
          }
          // Handle isHouseDefault toggle - create recipe link to shot drink
          if (isHouseDefault) {
             const subtypeToShot: Record<string, string> = {
               tequila: "shot-tequila",
               mezcal: "shot-mezcal",
               vodka: "shot-vodka",
               gin: "shot-gin",
               whiskey: "shot-whiskey",
               rum: "shot-rum",
               misc: "shot-misc",
             };
             const subtypeToCocktail: Record<string, string> = {
               tequila: "cocktail-tonic",
               mezcal: "cocktail-soda",
               vodka: "cocktail-soft",
               gin: "cocktail-juice",
             };
             const shotId = subtype ? subtypeToShot[subtype.toLowerCase()] : null;
             const cocktailId = subtype ? subtypeToCocktail[subtype.toLowerCase()] : null;
             
             if (shotId) {
               // First, clear any existing default recipe for this shot
               await tx
                 .delete(recipeIngredientsTable)
                 .where(eq(recipeIngredientsTable.drinkId, shotId));
       
               // Insert new recipe with this ingredient as default
               await tx.insert(recipeIngredientsTable).values({
                 drinkId: shotId,
                 ingredientId: itemId,
                 amountInBaseUnit: servingSize || 44.36,
                 isDefault: 1,
                 defaultCost: Number(orderCost) || 0,
                 productPrice: Number(menuPricePerServing) || 0,
               });
       
               // Update the shot drink's actualPrice from the house default
               await tx
                 .update(drinksTable)
                 .set({
                   actualPrice: Number(menuPricePerServing) || 0,
                   menuPrice: Number(menuPricePerServing) || 0,
                   updatedAt: Math.floor(Date.now() / 1000),
                 })
                 .where(eq(drinksTable.id, shotId));
             }
             
             if (cocktailId) {
               // We only update the spirit portion here. Mixer price requires lookup which is complex during bulk import.
               // At minimum, we'll ensure cocktail has a base price of the spirit.
               await tx
                 .update(drinksTable)
                 .set({
                   basePriceOverride: Number(menuPricePerServing) || 0,
                   updatedAt: Math.floor(Date.now() / 1000),
                 })
                 .where(eq(drinksTable.id, cocktailId));
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
