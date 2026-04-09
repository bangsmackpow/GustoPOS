import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  inventoryItemsTable,
  inventoryCountsTable,
  drinksTable,
} from "@workspace/db";
import { eq, desc, lt } from "drizzle-orm";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateFromWeight(
  item: typeof inventoryItemsTable.$inferSelect,
  weightG: number,
) {
  if (!item.tareWeightG || !item.fullBottleWeightG) {
    return { remainingBaseUnits: 0 };
  }
  const liquidWeight = weightG - item.tareWeightG;
  const fullLiquidWeight = item.fullBottleWeightG - item.tareWeightG;
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
    if (data.nameEs) insertValues.nameEs = data.nameEs;
    if (data.subtype) insertValues.subtype = data.subtype;
    if (data.baseUnit) insertValues.baseUnit = data.baseUnit;
    if (data.baseUnitAmount) insertValues.baseUnitAmount = baseUnitAmount;
    if (data.servingSize) insertValues.servingSize = Number(data.servingSize);
    if (data.pourSize) insertValues.pourSize = Number(data.pourSize);
    if (data.bottleSizeMl)
      insertValues.bottleSizeMl = Number(data.bottleSizeMl);
    if (data.glassWeightG)
      insertValues.glassWeightG = Number(data.glassWeightG);
    if (data.density) insertValues.density = Number(data.density);
    if (data.tareWeightG) insertValues.tareWeightG = Number(data.tareWeightG);
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
    if (data.isOnMenu !== undefined) insertValues.isOnMenu = !!data.isOnMenu;
    if (data.parentItemId) insertValues.parentItemId = data.parentItemId;
    if (data.alcoholDensity !== undefined)
      insertValues.alcoholDensity = Number(data.alcoholDensity);

    console.log("[POST /items] Insert values:", JSON.stringify(insertValues));

    const [item] = await db
      .insert(inventoryItemsTable)
      .values(insertValues)
      .returning();

    console.log("[POST /items] Successfully created item:", item.id);
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
        .set({ isOnMenu: data.isOnMenu, updatedAt: new Date() })
        .where(eq(inventoryItemsTable.id, id))
        .returning();

      if (!item) return res.status(404).json({ error: "Item not found" });

      // Create or update linked drink
      if (data.isOnMenu) {
        const [existingDrink] = await db
          .select()
          .from(drinksTable)
          .where(eq(drinksTable.id, id))
          .limit(1);

        const drinkData = {
          name: item.nameEs || item.name,
          nameEs: item.nameEs ?? null,
          category: item.type,
          actualPrice: 0,
          isAvailable: true,
          isOnMenu: true,
        };

        if (existingDrink) {
          await db
            .update(drinksTable)
            .set({ ...drinkData, updatedAt: new Date() })
            .where(eq(drinksTable.id, existingDrink.id));
        } else {
          await db.insert(drinksTable).values({ id, ...drinkData });
        }
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
    if (data.nameEs !== undefined) updateData.nameEs = data.nameEs || null;
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
    if (data.glassWeightG !== undefined)
      updateData.glassWeightG = data.glassWeightG
        ? Number(data.glassWeightG)
        : null;
    if (data.density !== undefined) updateData.density = Number(data.density);
    if (data.tareWeightG !== undefined)
      updateData.tareWeightG = data.tareWeightG
        ? Number(data.tareWeightG)
        : null;
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
    if (data.isOnMenu !== undefined) updateData.isOnMenu = !!data.isOnMenu;
    if (data.parentItemId !== undefined)
      updateData.parentItemId = data.parentItemId || null;
    if (data.alcoholDensity !== undefined)
      updateData.alcoholDensity = Number(data.alcoholDensity);

    console.log(
      "[PATCH /items/:id] Final update data:",
      JSON.stringify(updateData),
    );

    const [item] = await db
      .update(inventoryItemsTable)
      .set(updateData)
      .where(eq(inventoryItemsTable.id, id))
      .returning();

    if (!item) return res.status(404).json({ error: "Item not found" });

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

    // Handle isOnMenu toggle in full update
    if (data.isOnMenu !== undefined) {
      if (data.isOnMenu) {
        const [existingDrink] = await db
          .select()
          .from(drinksTable)
          .where(eq(drinksTable.id, item.id))
          .limit(1);

        const drinkData = {
          name: item.nameEs || item.name,
          nameEs: item.nameEs ?? null,
          category: item.type,
          actualPrice: 0,
          isAvailable: true,
          isOnMenu: true,
        };

        if (existingDrink) {
          await db
            .update(drinksTable)
            .set({ ...drinkData, updatedAt: new Date() })
            .where(eq(drinksTable.id, existingDrink.id));
        } else {
          await db.insert(drinksTable).values({ id: item.id, ...drinkData });
        }
      } else {
        await db.delete(drinksTable).where(eq(drinksTable.id, item.id));
      }
    }

    return res.json(item);
  } catch (err: any) {
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
      .set({ isDeleted: true, updatedAt: new Date() })
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
router.delete("/trash/clear", async (req: Request, res: Response) => {
  try {
    console.log("[DELETE /trash/clear] Starting...");
    const result = await db
      .delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.isDeleted, true))
      .returning();

    console.log("[DELETE /trash/clear] Deleted count:", result.length);
    return res.json({ ok: true, deletedCount: result.length });
  } catch (err: any) {
    console.error("[DELETE /trash/clear] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/trash/count
router.get("/trash/count", async (_req: Request, res: Response) => {
  try {
    const items = await db
      .select({ id: inventoryItemsTable.id })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.isDeleted, true));

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
        updatedAt: new Date(),
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

export default router;
