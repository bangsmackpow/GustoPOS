import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  periodsTable,
  cogsEntriesTable,
  tabsTable,
  ordersTable,
  inventoryItemsTable,
  recipeIngredientsTable,
  shiftsTable,
} from "@workspace/db";
import { eq, desc, and, sql, gt, lt, gte, lte } from "drizzle-orm";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

function getId(req: Request): string {
  return req.params.id as string;
}

function getPeriodId(req: Request): string {
  return req.params.periodId as string;
}

// GET /api/periods - List all periods
router.get("/", async (req: Request, res: Response) => {
  try {
    const periods = await db
      .select()
      .from(periodsTable)
      .orderBy(desc(periodsTable.startDate));
    return res.json(periods);
  } catch (err: any) {
    console.error("[GET /periods] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get periods" });
  }
});

// GET /api/periods/open - Get current open period
router.get("/open", async (req: Request, res: Response) => {
  try {
    const [period] = await db
      .select()
      .from(periodsTable)
      .where(eq(periodsTable.status, "open"))
      .orderBy(desc(periodsTable.startDate))
      .limit(1);

    if (!period) {
      return res.status(404).json({ error: "No open period found" });
    }

    return res.json(period);
  } catch (err: any) {
    console.error("[GET /periods/open] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get open period" });
  }
});

// POST /api/periods - Create new period
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, periodType, startDate, endDate } = req.body;
    const now = Math.floor(Date.now() / 1000);

    const [period] = await db
      .insert(periodsTable)
      .values({
        name: name || `Period ${new Date().toISOString().split("T")[0]}`,
        periodType: periodType || "daily",
        startDate: startDate || now,
        endDate: endDate || now + 86400,
        status: "open",
        createdAt: now,
      })
      .returning();

    return res.status(201).json(period);
  } catch (err: any) {
    console.error("[POST /periods] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create period" });
  }
});

// GET /api/periods/:id - Get period details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const [period] = await db
      .select()
      .from(periodsTable)
      .where(eq(periodsTable.id, id))
      .limit(1);

    if (!period) {
      return res.status(404).json({ error: "Period not found" });
    }

    return res.json(period);
  } catch (err: any) {
    console.error("[GET /periods/:id] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get period" });
  }
});

// POST /api/periods/:id/close - Close period and calculate totals
router.post("/:id/close", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const { closedByUserId } = req.body;

    const [period] = await db
      .select()
      .from(periodsTable)
      .where(eq(periodsTable.id, id))
      .limit(1);

    if (!period) {
      return res.status(404).json({ error: "Period not found" });
    }

    if (period.status === "closed") {
      return res.status(400).json({ error: "Period already closed" });
    }

    const now = Math.floor(Date.now() / 1000);

    const closedTabs = await db
      .select()
      .from(tabsTable)
      .where(
        and(
          eq(tabsTable.status, "closed"),
          gte(tabsTable.closedAt as any, period.startDate),
          lte(tabsTable.closedAt as any, period.endDate),
        ),
      );

    let totalSales = 0;
    let totalTips = 0;
    let totalDiscounts = 0;
    let totalVoids = 0;
    const totalComps = 0;

    const tabIds = closedTabs.map((t) => t.id);
    const allOrders =
      tabIds.length > 0
        ? await db
            .select()
            .from(ordersTable)
            .where(
              sql`${ordersTable.tabId} IN (${sql.raw(tabIds.map((id) => `'${id}'`).join(","))})`,
            )
        : [];

    const nonVoidedOrders = allOrders.filter((o) => !o.voided);

    for (const tab of closedTabs) {
      totalSales += Number(tab.totalMxn || 0);
      totalTips += Number(tab.tipMxn || 0);
      totalDiscounts += Number(tab.discountMxn || 0);
    }

    for (const order of allOrders) {
      if (order.voided) {
        totalVoids += Number(order.unitPriceMxn || 0) * order.quantity;
      }
    }

    const inventoryUsedMap = new Map<
      string,
      { name: string; amount: number; cost: number; category: string }
    >();

    for (const order of nonVoidedOrders) {
      const recipe = await db
        .select()
        .from(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

      for (const r of recipe) {
        if (!r.ingredientId) continue;
        const [item] = await db
          .select()
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, r.ingredientId));

        if (!item) continue;

        const targetId = item.parentItemId || item.id;
        const [targetItem] = await db
          .select()
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, targetId));

        if (!targetItem) continue;

        const amount = Number(r.amountInBaseUnit) * order.quantity;
        const unitCost =
          Number(targetItem.orderCost || 0) /
          (Number(targetItem.baseUnitAmount) || 750);
        const cost = amount * unitCost;

        if (!inventoryUsedMap.has(targetId)) {
          inventoryUsedMap.set(targetId, {
            name: targetItem.name,
            amount: 0,
            cost: 0,
            category: targetItem.type || "misc",
          });
        }

        const entry = inventoryUsedMap.get(targetId)!;
        entry.amount += amount;
        entry.cost += cost;
      }
    }

    let totalCogs = 0;
    for (const [, entry] of inventoryUsedMap) {
      totalCogs += entry.cost;
    }

    const [updatedPeriod] = await db
      .update(periodsTable)
      .set({
        status: "closed",
        closedAt: now,
        closedByUserId: closedByUserId || "unknown",
        totalSalesMxn: totalSales,
        totalCostMxn: totalCogs,
        totalTipsMxn: totalTips,
        totalDiscountsMxn: totalDiscounts,
        totalVoidsMxn: totalVoids,
        cogsMxn: totalCogs,
      })
      .where(eq(periodsTable.id, id))
      .returning();

    return res.json({
      ...updatedPeriod,
      tabsClosed: closedTabs.length,
      ordersProcessed: nonVoidedOrders.length,
      inventoryItemsUsed: inventoryUsedMap.size,
    });
  } catch (err: any) {
    console.error("[POST /periods/:id/close] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to close period" });
  }
});

// GET /api/periods/:id/cogs - Get COGS entries for period
router.get("/:id/cogs", async (req: Request, res: Response) => {
  try {
    const periodId = getPeriodId(req);

    const entries = await db
      .select()
      .from(cogsEntriesTable)
      .where(eq(cogsEntriesTable.periodId, periodId))
      .orderBy(cogsEntriesTable.itemName);

    return res.json(entries);
  } catch (err: any) {
    console.error("[GET /periods/:id/cogs] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get COGS entries" });
  }
});
export default router;
