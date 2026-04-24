import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  db,
  inventoryItemsTable,
  inventoryCountsTable,
  inventoryAuditsTable,
  auditSessionsTable,
  drinksTable,
  recipeIngredientsTable,
} from "@workspace/db";
import { eq, desc, lt, and, sql } from "drizzle-orm";
import { logEvent } from "../lib/auditLog";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateFromWeight(
  item: typeof inventoryItemsTable.$inferSelect,
  weightG: number,
) {
  if (!item.containerWeightG || !item.fullBottleWeightG) {
    return { remainingBaseUnits: 0 };
  }
  const liquidWeight = weightG - item.containerWeightG;
  const fullLiquidWeight = item.fullBottleWeightG - item.containerWeightG;
  const remainingBaseUnits =
    fullLiquidWeight > 0
      ? (liquidWeight / fullLiquidWeight) * item.baseUnitAmount
      : 0;
  return { remainingBaseUnits: Math.max(0, remainingBaseUnits) };
}

function getId(req: Request): string {
  return req.params.id as string;
}

// ─── Item Routes ─────────────────────────────────────────────────────────────

// GET /api/inventory/items
router.get("/items", async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";
    const items = await db
      .select()
      .from(inventoryItemsTable)
      .orderBy(inventoryItemsTable.name);

    if (includeDeleted) {
      res.json(items);
    } else {
      res.json(items.filter((i) => !i.isDeleted));
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/ingredients/by-type/:type - Get ingredients filtered by type and subtype
router.get("/ingredients/by-type/:type", async (req: Request, res: Response) => {
  try {
    const typeParam = req.params.type as string;
    const subtype = req.query.subtype as string | undefined;
    const isOnMenuOnly = req.query.isOnMenu === "true";

    const query = db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.type, typeParam))
      .orderBy(inventoryItemsTable.name);

    let items = await query;

    // Filter out deleted
    items = items.filter((i) => !i.isDeleted);

    // Apply subtype filter
    if (subtype) {
      items = items.filter((i) => i.subtype === subtype);
    }

    // Apply isOnMenu filter
    if (isOnMenuOnly) {
      items = items.filter((i) => i.isOnMenu === 1);
    }

    // Sort by menu price (cheapest first)
    items.sort((a, b) => {
      const priceA = Number(a.menuPricePerServing || 0);
      const priceB = Number(b.menuPricePerServing || 0);
      return priceA - priceB;
    });

    // Return with price info
    const result = items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      subtype: item.subtype,
      isOnMenu: item.isOnMenu === 1,
      isHouseDefault: item.isHouseDefault === 1,
      baseUnitAmount: item.baseUnitAmount,
      menuPricePerServing: item.menuPricePerServing
        ? Number(item.menuPricePerServing)
        : null,
      currentStock: item.currentStock,
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/low-stock
router.get("/low-stock", async (_req: Request, res: Response) => {
  try {
    const items = await db
      .select()
      .from(inventoryItemsTable)
      .where(
        lt(
          inventoryItemsTable.currentStock,
          inventoryItemsTable.lowStockThreshold,
        ),
      )
      .orderBy(inventoryItemsTable.name);

    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/items/:id
router.get("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const [item] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1);

    if (!item) return res.status(404).json({ error: "Item not found" });

    return res.json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/items
router.post("/items", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log("[POST /items] Received data:", JSON.stringify(data));

    const baseUnitAmount = Number(data.baseUnitAmount) || 750;
    const currentBulk = Number(data.currentBulk) || 0;
    const currentPartial = Number(data.currentPartial) || 0;
    const currentStock = currentBulk * baseUnitAmount + currentPartial;

    console.log("[POST /items] Calculated stock:", {
      baseUnitAmount,
      currentBulk,
      currentPartial,
      currentStock,
    });

    // Build only the fields that exist in the database
    const insertValues: any = {
      name: data.name,
      type: data.type ?? "spirit",
      currentStock: currentStock,
    };

    // Only add optional fields if they have values (safer for migration compatibility)

    if (data.subtype) insertValues.subtype = data.subtype;
    if (data.baseUnit) insertValues.baseUnit = data.baseUnit;
    if (data.baseUnitAmount) insertValues.baseUnitAmount = baseUnitAmount;
    if (data.servingSize) insertValues.servingSize = Number(data.servingSize);
    if (data.pourSize) insertValues.pourSize = Number(data.pourSize);
    if (data.bottleSizeMl)
      insertValues.bottleSizeMl = Number(data.bottleSizeMl);
    if (data.containerWeightG)
      insertValues.containerWeightG = Number(data.containerWeightG);
    if (data.density) insertValues.density = Number(data.density);
    if (data.fullBottleWeightG)
      insertValues.fullBottleWeightG = Number(data.fullBottleWeightG);
    if (data.currentBulk !== undefined) insertValues.currentBulk = currentBulk;
    if (data.currentPartial !== undefined)
      insertValues.currentPartial = currentPartial;
    if (data.orderCost !== undefined)
      insertValues.orderCost = Number(data.orderCost);
    if (data.lowStockThreshold !== undefined)
      insertValues.lowStockThreshold = Number(data.lowStockThreshold);
    if (data.unitsPerCase)
      insertValues.unitsPerCase = Number(data.unitsPerCase);
    if (data.trackingMode !== undefined)
      insertValues.trackingMode = data.trackingMode;
    if (data.isOnMenu !== undefined)
      insertValues.isOnMenu = data.isOnMenu ? 1 : 0;
    if (data.productPrice !== undefined)
      insertValues.productPrice = Number(data.productPrice);
    if (data.menuPricePerServing !== undefined)
      insertValues.menuPricePerServing = Number(data.menuPricePerServing);
    if (data.parentItemId) insertValues.parentItemId = data.parentItemId;
    if (data.alcoholDensity !== undefined)
      insertValues.alcoholDensity = Number(data.alcoholDensity);

    console.log("[POST /items] Insert values:", JSON.stringify(insertValues));

    const [item] = await db
      .insert(inventoryItemsTable)
      .values(insertValues)
      .returning();

    console.log("[POST /items] Successfully created item:", item.id);

    // Map inventory type to drink category
    const getCategoryForType = (itemType: string, itemName: string): string => {
      const nameLower = itemName.toLowerCase();
      if (itemType === "spirit") {
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

    // Always create drink from inventory if on menu (replaces sellSingleServing)
    if (item.isOnMenu) {
      const drinkCategory = getCategoryForType(item.type, item.name);
      const drinkData = {
        name: item.name,
        category: drinkCategory,
        actualPrice: item.menuPricePerServing || 0,
        menuPrice: item.menuPricePerServing || 0,
        priceSource: "auto",
        sourceType: "inventory_single",
        isAvailable: 1,
        isOnMenu: 1,
      };
      await db.insert(drinksTable).values({ id: item.id, ...drinkData });
      await db.insert(recipeIngredientsTable).values({
        drinkId: item.id,
        ingredientId: item.id,
        amountInBaseUnit: item.servingSize || 44.36,
        productPrice: item.menuPricePerServing || 0,
      });
    }

    res.json(item);
  } catch (err: any) {
    console.error("[POST /items] Error:", err.message);
    console.error("[POST /items] Stack:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/inventory/items/:id
router.patch("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const data = req.body;
    console.log("[PATCH /items/:id] Received data:", JSON.stringify(data));

    // Handle isOnMenu toggle — minimal update
    if (Object.keys(data).length === 1 && data.isOnMenu !== undefined) {
      const [item] = await db
        .update(inventoryItemsTable)
        .set({
          isOnMenu: data.isOnMenu ? 1 : 0,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(inventoryItemsTable.id, id))
        .returning();

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Map inventory type to drink category
      const getCategoryForType = (itemType: string, itemName: string): string => {
        const nameLower = itemName.toLowerCase();
        if (itemType === "spirit") {
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

      // Create or update linked drink
      if (data.isOnMenu) {
        const [existingDrink] = await db
          .select()
          .from(drinksTable)
          .where(eq(drinksTable.id, id))
          .limit(1);

        const drinkCategory = getCategoryForType(item.type, item.name);
        const priceToUse = item.menuPricePerServing || 0;
        const drinkData = {
          name: item.name,
          category: drinkCategory,
          actualPrice: priceToUse,
          menuPrice: priceToUse,
          priceSource: "auto",
          sourceType: "inventory_single",
          isAvailable: 1,
          isOnMenu: 1,
        };

        if (existingDrink) {
          await db
            .update(drinksTable)
            .set({ ...drinkData, updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(drinksTable.id, existingDrink.id));
        } else {
          await db.insert(drinksTable).values({ id, ...drinkData });
        }

        // Also update recipe ingredient product price
        await db
          .update(recipeIngredientsTable)
          .set({ productPrice: priceToUse })
          .where(eq(recipeIngredientsTable.ingredientId, id));
      } else {
        await db.delete(drinksTable).where(eq(drinksTable.id, id));
      }

      return res.json(item);
    }

    // Get existing item for stock calculation
    const [existingItem] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1);

    if (!existingItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Handle currentBulk and currentPartial updates - recalculate currentStock
    let currentBulk = existingItem.currentBulk ?? 0;
    let currentPartial = existingItem.currentPartial ?? 0;

    if (data.currentBulk !== undefined) {
      currentBulk = Number(data.currentBulk) || 0;
    }
    if (data.currentPartial !== undefined) {
      currentPartial = Number(data.currentPartial) || 0;
    }

    // Recalculate currentStock if bulk or partial was provided
    if (data.currentBulk !== undefined || data.currentPartial !== undefined) {
      const baseUnitAmount =
        Number(data.baseUnitAmount) || existingItem.baseUnitAmount || 750;
      const newStock = currentBulk * baseUnitAmount + currentPartial;
      data.currentStock = newStock;
      data.currentBulk = currentBulk;
      data.currentPartial = currentPartial;
    }

    // Full update - only include known fields that exist in DB
    const updateData: any = { updatedAt: new Date() };

    // Map known fields
    if (data.name !== undefined) updateData.name = data.name;

    if (data.type !== undefined) updateData.type = data.type;
    if (data.subtype !== undefined) updateData.subtype = data.subtype || null;
    if (data.baseUnit !== undefined) updateData.baseUnit = data.baseUnit;
    if (data.baseUnitAmount !== undefined)
      updateData.baseUnitAmount = Number(data.baseUnitAmount);
    if (data.servingSize !== undefined)
      updateData.servingSize = Number(data.servingSize);
    if (data.pourSize !== undefined)
      updateData.pourSize = Number(data.pourSize);
    if (data.bottleSizeMl !== undefined)
      updateData.bottleSizeMl = data.bottleSizeMl
        ? Number(data.bottleSizeMl)
        : null;
    if (data.containerWeightG !== undefined)
      updateData.containerWeightG = data.containerWeightG
        ? Number(data.containerWeightG)
        : null;
    if (data.density !== undefined) updateData.density = Number(data.density);
    if (data.fullBottleWeightG !== undefined)
      updateData.fullBottleWeightG = data.fullBottleWeightG
        ? Number(data.fullBottleWeightG)
        : null;
    if (data.currentStock !== undefined)
      updateData.currentStock = Number(data.currentStock);
    if (data.currentBulk !== undefined) updateData.currentBulk = currentBulk;
    if (data.currentPartial !== undefined)
      updateData.currentPartial = currentPartial;
    if (data.orderCost !== undefined)
      updateData.orderCost = Number(data.orderCost);
    if (data.lowStockThreshold !== undefined)
      updateData.lowStockThreshold = Number(data.lowStockThreshold);
    if (data.unitsPerCase !== undefined)
      updateData.unitsPerCase = Number(data.unitsPerCase);
    if (data.trackingMode !== undefined)
      updateData.trackingMode = data.trackingMode;
    if (data.isOnMenu !== undefined)
      updateData.isOnMenu = data.isOnMenu ? 1 : 0;
    if (data.productPrice !== undefined)
      updateData.productPrice = data.productPrice
        ? Number(data.productPrice)
        : null;
    if (data.menuPricePerServing !== undefined)
      updateData.menuPricePerServing = data.menuPricePerServing
        ? Number(data.menuPricePerServing)
        : null;
    if (data.parentItemId !== undefined)
      updateData.parentItemId = data.parentItemId || null;
    if (data.alcoholDensity !== undefined)
      updateData.alcoholDensity = Number(data.alcoholDensity);
    if (data.isHouseDefault !== undefined)
      updateData.isHouseDefault = data.isHouseDefault ? 1 : 0;

    console.log(
      "[PATCH /items/:id] Final update data:",
      JSON.stringify(updateData),
    );

    const [item] = await db
      .update(inventoryItemsTable)
      .set(updateData)
      .where(eq(inventoryItemsTable.id, id))
      .returning();

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    console.log("[PATCH /items/:id] Successfully updated item:", item.id);

    await logEvent({
      userId: (req as any).user?.id || "system",
      action: "inventory_update",
      entityType: "inventory_item",
      entityId: id,
      oldValue: existingItem
        ? {
            name: existingItem.name,
            currentStock: existingItem.currentStock,
            orderCost: existingItem.orderCost,
          }
        : null,
      newValue: {
        name: item.name,
        currentStock: item.currentStock,
        orderCost: item.orderCost,
      },
    });

    // Handle isHouseDefault toggle - create/remove recipe link to shot drink
    if (data.isHouseDefault !== undefined) {
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
      const shotId = item.subtype ? subtypeToShot[item.subtype.toLowerCase()] : null;
      const cocktailId = item.subtype ? subtypeToCocktail[item.subtype.toLowerCase()] : null;

      if (data.isHouseDefault) {
        if (shotId) {
          // Enable: Create recipe link to shot drink
          console.log(`[PATCH /items/:id] Linking ${item.name} as house default for ${shotId}`);

          // First, clear any existing default recipe for this shot
          await db
            .delete(recipeIngredientsTable)
            .where(eq(recipeIngredientsTable.drinkId, shotId));

          // Insert new recipe with this ingredient as default
          await db.insert(recipeIngredientsTable).values({
            drinkId: shotId,
            ingredientId: item.id,
            amountInBaseUnit: item.servingSize || 44.36,
            isDefault: 1,
            defaultCost: Number(item.orderCost) || 0,
            productPrice: Number(item.menuPricePerServing) || 0,
          });

          // Update the shot drink's actualPrice from the house default
          await db
            .update(drinksTable)
            .set({
              actualPrice: Number(item.menuPricePerServing) || 0,
              menuPrice: Number(item.menuPricePerServing) || 0,
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(drinksTable.id, shotId));

          console.log(`[PATCH /items/:id] ✓ Created recipe link: ${shotId} → ${item.id}`);
        }

        // Also update cocktail if applicable (spirit + mixer price)
        if (cocktailId) {
          console.log(`[PATCH /items/:id] Updating cocktail ${cocktailId} from house spirit ${item.name}`);

          // Find the mixer for this cocktail type
          const cocktailDrink = await db
            .select()
            .from(drinksTable)
            .where(eq(drinksTable.id, cocktailId))
            .limit(1);

          const mixerSubtype = cocktailDrink[0]?.drinkMixerSubtype;
          let mixerPrice = 0;

          if (mixerSubtype) {
            // Find first available mixer of this subtype
            const mixer = await db
              .select()
              .from(inventoryItemsTable)
              .where(and(
                eq(inventoryItemsTable.type, "mixer"),
                eq(inventoryItemsTable.subtype, mixerSubtype),
                eq(inventoryItemsTable.isOnMenu, 1)
              ))
              .limit(1);

            mixerPrice = Number(mixer[0]?.menuPricePerServing) || 0;
          }

          // Update cocktail base price = spirit price + mixer price
          const basePrice = (Number(item.menuPricePerServing) || 0) + mixerPrice;
          await db
            .update(drinksTable)
            .set({
              basePriceOverride: basePrice,
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(drinksTable.id, cocktailId));

          console.log(`[PATCH /items/:id] ✓ Updated cocktail base price: MX$${basePrice.toFixed(2)}`);
        }
      } else {
        // Disable: Remove recipe link
        if (shotId) {
          console.log(`[PATCH /items/:id] Removing house default link for ${shotId}`);
          await db
            .delete(recipeIngredientsTable)
            .where(eq(recipeIngredientsTable.drinkId, shotId));
          console.log(`[PATCH /items/:id] ✓ Removed recipe link for ${shotId}`);
        }
        if (cocktailId) {
          console.log(`[PATCH /items/:id] Clearing cocktail base price for ${cocktailId}`);
          await db
            .update(drinksTable)
            .set({
              basePriceOverride: null,
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(drinksTable.id, cocktailId));
        }
      }
    }

    // Handle isOnMenu toggle - NO LONGER creates drinks
    // On Menu just marks inventory item as available in dropdowns, not as a separate menu item
    // The 11 default drinks (7 shots + 4 classics) handle the menu instead
    // (The actual isOnMenu update is handled in updateData above)

    // Handle productPrice changes - DEPRECATED
    // Since we no longer create drinks from inventory, this code is now dead
    if (data.productPrice !== undefined && item.isOnMenu) {
      console.log(`[PATCH /items/:id] productPrice changed but no linked drink to update`);
    }

    res.json(item);
    return;
  } catch (err: any) {
    console.error("[PATCH /items/:id] Error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/inventory/items/:id
router.delete("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    console.log("[DELETE] Attempting to delete item:", id);

    const [deleted] = await db
      .update(inventoryItemsTable)
      .set({ isDeleted: 1, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(inventoryItemsTable.id, id))
      .returning();

    console.log("[DELETE] Result:", deleted);

    if (!deleted)
      return res.status(404).json({ error: "Item not found", ok: false });
    return res.json({ ok: true, message: "Item moved to trash" });
  } catch (err: any) {
    console.error("[DELETE] Error:", err);
    return res.status(500).json({ error: err.message, ok: false });
  }
});

// DELETE /api/inventory/trash/clear
router.delete(
  "/trash/clear",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      console.log("[DELETE /trash/clear] Starting...");
      const result = await db
        .delete(inventoryItemsTable)
        .where(eq(inventoryItemsTable.isDeleted, 1))
        .returning();

      console.log("[DELETE /trash/clear] Deleted count:", result.length);
      return res.json({ success: true, deletedCount: result.length });
    } catch (err: any) {
      console.error("[DELETE /trash/clear] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  },
);

// GET /api/inventory/trash/count
router.get("/trash/count", async (_req: Request, res: Response) => {
  try {
    const items = await db
      .select({ id: inventoryItemsTable.id })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.isDeleted, 1));

    return res.json({ count: items.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/items/:id/weigh
router.post("/items/:id/weigh", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const { weightG, countedByUserId } = req.body;

    if (weightG == null || !countedByUserId) {
      return res
        .status(400)
        .json({ error: "weightG and countedByUserId are required" });
    }

    const [item] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1);

    if (!item) return res.status(404).json({ error: "Item not found" });

    const { remainingBaseUnits } = calculateFromWeight(item, weightG);

    await db.insert(inventoryCountsTable).values({
      itemId: item.id,
      weightG,
      calculatedBaseUnits: remainingBaseUnits,
      countedByUserId,
    });

    const [updated] = await db
      .update(inventoryItemsTable)
      .set({
        currentStock: remainingBaseUnits,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(inventoryItemsTable.id, item.id))
      .returning();

    return res.json({
      ok: true,
      item: updated,
      remainingBaseUnits,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/inventory/items/:id/counts
router.get("/items/:id/counts", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const counts = await db
      .select()
      .from(inventoryCountsTable)
      .where(eq(inventoryCountsTable.itemId, id))
      .orderBy(desc(inventoryCountsTable.countedAt))
      .limit(50);

    res.json(counts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/items/:id/audit
// @ts-expect-error - TypeScript incorrectly thinks this route handler doesn't return
router.post("/items/:id/audit", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const {
      auditEntryMethod,
      reportedBulk,
      reportedPartial,
      reportedTotal: clientReportedTotal,
      varianceReason,
      notes,
      auditedByUserId,
    } = req.body;

    const [item] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const now = Math.floor(Date.now() / 1000);
    const baseUnitAmount = Number(item.baseUnitAmount) || 750;

    // Calculate expected total (system stock before audit)
    const expectedTotal = Number(item.currentStock) || 0;

    // Calculate reported total from bulk + partial
    // If client provides reportedTotal, use it; otherwise calculate from bulk/partial
    let reportedTotal: number;
    if (clientReportedTotal !== undefined && clientReportedTotal !== null) {
      reportedTotal = Number(clientReportedTotal);
    } else {
      const bulk = Number(reportedBulk) || 0;
      const partial = Number(reportedPartial) || 0;
      reportedTotal = bulk * baseUnitAmount + partial;
    }

    // Calculate variance
    const variance = reportedTotal - expectedTotal;

    // Calculate variance percentage (avoid division by zero)
    const variancePercent =
      expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;

    // AUDIT_PROTOCOL Section 5: Require variance reason when |variance%| > 5%
    const SIGNIFICANT_VARIANCE_THRESHOLD = 5;
    if (
      Math.abs(variancePercent) > SIGNIFICANT_VARIANCE_THRESHOLD &&
      !varianceReason
    ) {
      return res.status(400).json({
        error: `Variance of ${variancePercent.toFixed(2)}% exceeds significant threshold (${SIGNIFICANT_VARIANCE_THRESHOLD}%). Please provide a variance reason.`,
        code: "VARIANCE_REASON_REQUIRED",
        variancePercent,
        threshold: SIGNIFICANT_VARIANCE_THRESHOLD,
        requiredReasons: [
          "spillage",
          "wastage",
          "counting_error",
          "demo_free_pour",
          "in_transit",
          "unknown",
        ],
      });
    }

    // Store previous total for reference
    const previousTotal = expectedTotal;

    const auditValues: any = {
      itemId: id,
      auditDate: now,
      auditEntryMethod: auditEntryMethod || "bulk_partial",
      reportedTotal,
      previousTotal: expectedTotal,
      expectedTotal,
      systemStock: expectedTotal,
      physicalCount: reportedTotal,
      variance,
      variancePercent,
      auditReason: varianceReason || "manual",
      notes: notes ?? null,
      auditedByUserId: auditedByUserId || "unknown",
      auditedAt: now,
      countedAt: now,
      createdAt: now,
    };

    if (reportedBulk !== undefined) {
      auditValues.reportedBulk = Number(reportedBulk);
    }
    if (reportedPartial !== undefined) {
      auditValues.reportedPartial = Number(reportedPartial);
    }

    console.log("[AUDIT] Final values:", JSON.stringify(auditValues, null, 2));

    // Use raw SQL insert to work around Drizzle parameter mapping issues
    await db.run(sql`
      INSERT INTO inventory_audits (
        id, item_id, audit_date, audit_entry_method, 
        reported_bulk, reported_partial, reported_total, 
        previous_total, expected_total, system_stock, 
        physical_count, variance, variance_percent, 
        audit_reason, audited_by_user_id, audited_at, 
        counted_at, created_at
      ) VALUES (
        ${crypto.randomUUID()}, 
        ${auditValues.itemId}, 
        ${now}, 
        'bulk_partial', 
        ${auditValues.reportedBulk ?? null}, 
        ${auditValues.reportedPartial ?? null}, 
        ${auditValues.reportedTotal ?? null}, 
        ${auditValues.previousTotal ?? null}, 
        ${auditValues.expectedTotal ?? null}, 
        ${auditValues.systemStock}, 
        ${auditValues.physicalCount}, 
        ${auditValues.variance}, 
        ${auditValues.variancePercent}, 
        ${auditValues.auditReason || "manual"}, 
        ${auditValues.auditedByUserId ?? null}, 
        ${now}, 
        ${now}, 
        ${now}
      )
    `);

    // Get the inserted audit using raw SQL
    const result = await db
      .select({
        id: inventoryAuditsTable.id,
        itemId: inventoryAuditsTable.itemId,
        systemStock: inventoryAuditsTable.systemStock,
        physicalCount: inventoryAuditsTable.physicalCount,
        variance: inventoryAuditsTable.variance,
        variancePercent: inventoryAuditsTable.variancePercent,
      })
      .from(inventoryAuditsTable)
      .where(sql`${inventoryAuditsTable.itemId} = ${id}`)
      .limit(1);

    const audit = result[0];

    // Calculate serving-based variance
    const servingSize = Number(item.servingSize) || 44.36;
    const varianceInServings = Math.abs(variance) / servingSize;

    // Update inventory item with reported values
    // If bulk/partial provided, recalculate stock; otherwise use reportedTotal
    let newBulk = Number(item.currentBulk) || 0;
    let newPartial = Number(item.currentPartial) || 0;
    let newStock = Number(item.currentStock) || 0;

    if (reportedBulk !== undefined) {
      newBulk = Number(reportedBulk);
    }
    if (reportedPartial !== undefined) {
      newPartial = Number(reportedPartial);
    }
    // Recalculate stock from bulk/partial if both provided, otherwise use reportedTotal
    if (reportedBulk !== undefined && reportedPartial !== undefined) {
      newStock = newBulk * baseUnitAmount + newPartial;
    } else if (clientReportedTotal !== undefined) {
      newStock = Number(clientReportedTotal);
    }

    await db
      .update(inventoryItemsTable)
      .set({
        currentBulk: newBulk,
        currentPartial: newPartial,
        currentStock: newStock,
        lastAuditedAt: now,
        lastAuditedByUserId: auditedByUserId || "unknown",
        updatedAt: now,
      })
      .where(eq(inventoryItemsTable.id, id));

    await logEvent({
      userId: auditedByUserId || "unknown",
      action: "audit",
      entityType: "inventory",
      entityId: id,
      newValue: { itemName: item.name, variance, variancePercent },
    });

    res.status(201).json({
      ...audit,
      varianceInServings: parseFloat(varianceInServings.toFixed(2)),
    });
  } catch (err: any) {
    console.error("[POST /items/:id/audit] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to record audit" });
  }
});

router.get("/items/audit-age-stats", async (req: Request, res: Response) => {
  try {
    const daysThreshold = Math.max(1, parseInt(req.query.days as string) || 4);
    const now = Math.floor(Date.now() / 1000);
    const thresholdTimestamp = now - daysThreshold * 24 * 60 * 60;

    const items = await db
      .select({
        id: inventoryItemsTable.id,
        name: inventoryItemsTable.name,
        type: inventoryItemsTable.type,
        lastAuditedAt: inventoryItemsTable.lastAuditedAt,
      })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.isDeleted, 0));

    const itemsNeverAudited = items.filter(
      (i) => !i.lastAuditedAt || i.lastAuditedAt === 0,
    );
    const itemsOverdue = items.filter(
      (i) => i.lastAuditedAt && i.lastAuditedAt < thresholdTimestamp,
    );
    const itemsRecentlyAudited = items.filter(
      (i) => i.lastAuditedAt && i.lastAuditedAt >= thresholdTimestamp,
    );

    const oldestAudit = items
      .filter((i) => i.lastAuditedAt && i.lastAuditedAt > 0)
      .sort((a, b) => (a.lastAuditedAt || 0) - (b.lastAuditedAt || 0))[0];

    const oldestDays = oldestAudit?.lastAuditedAt
      ? Math.floor((now - oldestAudit.lastAuditedAt) / (24 * 60 * 60))
      : null;

    return res.json({
      totalItems: items.length,
      itemsNeverAuditedCount: itemsNeverAudited.length,
      itemsOverdueCount: itemsOverdue.length,
      itemsRecentlyAuditedCount: itemsRecentlyAudited.length,
      oldestAuditDays: oldestDays,
      alertThreshold: daysThreshold,
      shouldAlert: itemsOverdue.length > 0 || itemsNeverAudited.length > 0,
    });
  } catch (err: any) {
    console.error("Failed to get audit age stats:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

// Manual cleanup endpoint - DELETE drinks with sourceType='inventory_single' directly from database
// This is a simple pass-through since we can't do admin check easily here
// Run this SQL manually in db: DELETE FROM drinks WHERE source_type = 'inventory_single'

export default router;
