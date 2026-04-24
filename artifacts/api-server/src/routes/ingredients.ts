import { Router, type IRouter, type Request, type Response } from "express";
import { db, inventoryItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateIngredientBody, UpdateIngredientBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatInventoryItem(item: typeof inventoryItemsTable.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    
    type: item.type,
    subtype: item.subtype,
    baseUnit: item.baseUnit,
    baseUnitAmount: Number(item.baseUnitAmount),
    servingSize: Number(item.servingSize),
    currentStock: Number(item.currentStock),
    lowStockThreshold: Number(item.lowStockThreshold),
    orderCost: Number(item.orderCost),
    unitsPerCase: Number(item.unitsPerCase),
    trackingMode: item.trackingMode,
    isOnMenu: item.isOnMenu,
    isDeleted: item.isDeleted,
    bottleSizeMl: item.bottleSizeMl ? Number(item.bottleSizeMl) : null,
    fullBottleWeightG: item.fullBottleWeightG
      ? Number(item.fullBottleWeightG)
      : null,
    containerWeightG: item.containerWeightG
      ? Number(item.containerWeightG)
      : null,
    isHouseDefault: item.isHouseDefault === 1,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
  };
}

router.get("/ingredients", async (req: Request, res: Response) => {
  try {
    const items = await db
      .select()
      .from(inventoryItemsTable)
      .orderBy(inventoryItemsTable.name);

    res.json(items.map(formatInventoryItem));
  } catch (err: any) {
    console.error("Error fetching ingredients:", err);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

router.post("/ingredients", async (req: Request, res: Response) => {
  try {
    const parsed = CreateIngredientBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error });
      return;
    }

    const [item] = await db
      .insert(inventoryItemsTable)
      .values({
        name: parsed.data.name,
        
        type: parsed.data.type ?? "spirit",
        subtype: parsed.data.subtype ?? null,
        baseUnit: parsed.data.baseUnit,
        baseUnitAmount: parsed.data.baseUnitAmount,
        servingSize: parsed.data.servingSize,
        currentStock: parsed.data.currentStock,
        orderCost: parsed.data.orderCost ?? 0,
        lowStockThreshold: parsed.data.lowStockThreshold ?? 1,
        unitsPerCase: parsed.data.unitsPerCase ?? 1,
        trackingMode: parsed.data.trackingMode ?? "auto",
        isOnMenu: (parsed.data.isOnMenu ?? false) ? 1 : 0,
        fullBottleWeightG: parsed.data.fullBottleWeightG ?? null,
      })
      .returning();

    res.status(201).json(formatInventoryItem(item));
  } catch (err: any) {
    console.error("Error creating ingredient:", err);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
});

router.get("/ingredients/:id", async (req: Request, res: Response) => {
  try {
    const [item] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, req.params.id as string))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }

    res.json(formatInventoryItem(item));
  } catch (err: any) {
    console.error("Error fetching ingredient:", err);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

router.patch("/ingredients/:id", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateIngredientBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const data = parsed.data;
    const updateData: Partial<typeof inventoryItemsTable.$inferInsert> = {};
    if (data.name != null) updateData.name = data.name;
    
    if (data.type != null) updateData.type = data.type;
    if (data.subtype != null) updateData.subtype = data.subtype;
    if (data.baseUnit != null) updateData.baseUnit = data.baseUnit;
    if (data.baseUnitAmount != null)
      updateData.baseUnitAmount = Number(data.baseUnitAmount);
    if (data.servingSize != null)
      updateData.servingSize = Number(data.servingSize);
    if (data.currentStock != null)
      updateData.currentStock = Number(data.currentStock);
    if (data.orderCost != null) updateData.orderCost = Number(data.orderCost);
    if (data.lowStockThreshold != null)
      updateData.lowStockThreshold = Number(data.lowStockThreshold);
    if (data.unitsPerCase != null)
      updateData.unitsPerCase = Number(data.unitsPerCase);
    if (data.trackingMode != null) updateData.trackingMode = data.trackingMode;
    if (data.isOnMenu != null) updateData.isOnMenu = data.isOnMenu ? 1 : 0;
    if (data.fullBottleWeightG != null)
      updateData.fullBottleWeightG = data.fullBottleWeightG;

    const [item] = await db
      .update(inventoryItemsTable)
      .set(updateData)
      .where(eq(inventoryItemsTable.id, req.params.id as string))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }

    res.json(formatInventoryItem(item));
  } catch (err: any) {
    console.error("Error updating ingredient:", err);
    res.status(500).json({ error: "Failed to update ingredient" });
  }
});

router.delete("/ingredients/:id", async (req: Request, res: Response) => {
  try {
    await db
      .delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, req.params.id as string));
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting ingredient:", err);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

export default router;
