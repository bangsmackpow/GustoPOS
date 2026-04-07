import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  inventoryItemsTable,
  inventoryCountsTable,
  drinksTable,
  eventLogsTable,
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
router.get("/items", async (_req: Request, res: Response) => {
  try {
    const items = await db
      .select()
      .from(inventoryItemsTable)
      .orderBy(inventoryItemsTable.name);

    res.json(items.filter((i) => !i.isDeleted));
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

    const [item] = await db
      .insert(inventoryItemsTable)
      .values({
        name: data.name,
        nameEs: data.nameEs ?? null,
        type: data.type ?? "spirit",
        subtype: data.subtype ?? null,
        baseUnit: data.baseUnit ?? "ml",
        baseUnitAmount: Number(data.baseUnitAmount) || 750,
        servingSize: Number(data.servingSize) || 44.36,
        pourSize: Number(data.pourSize) || 1.5,
        bottleSizeMl: data.bottleSizeMl ? Number(data.bottleSizeMl) : null,
        glassWeightG: data.glassWeightG ? Number(data.glassWeightG) : null,
        density: Number(data.density) || 0.94,
        tareWeightG: data.tareWeightG ? Number(data.tareWeightG) : null,
        fullBottleWeightG: data.fullBottleWeightG
          ? Number(data.fullBottleWeightG)
          : null,
        currentStock: Number(data.currentStock) || 0,
        orderCost: Number(data.orderCost) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 1,
        unitsPerCase: Number(data.unitsPerCase) || 1,
        isOnMenu: !!data.isOnMenu,
      })
      .returning();

    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/inventory/items/:id
router.patch("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const data = req.body;

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

    // Full update — strip timestamps
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...cleanData } = data;

    const [existingItem] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1);

    const [item] = await db
      .update(inventoryItemsTable)
      .set({
        ...cleanData,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItemsTable.id, id))
      .returning();

    if (!item) return res.status(404).json({ error: "Item not found" });

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
    const [deleted] = await db
      .update(inventoryItemsTable)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(inventoryItemsTable.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ error: "Item not found" });
    return res.json({ ok: true });
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
