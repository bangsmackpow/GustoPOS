import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  tabsTable,
  ordersTable,
  usersTable,
  inventoryItemsTable,
  recipeIngredientsTable,
} from "@workspace/db";
import { eq, desc, sql, gte, lte, and } from "drizzle-orm";

const router: IRouter = Router();

/**
 * GET /api/analytics/sales
 * Get sales analytics for a date range
 */
router.get("/analytics/sales", async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    // 1. Total sales by drink
    const salesByDrink = await db
      .select({
        drinkId: ordersTable.drinkId,
        drinkName: ordersTable.drinkName,
        drinkNameEs: ordersTable.drinkNameEs,
        unitsPriced: sql<number>`COUNT(${ordersTable.id})`,
        totalRevenue: sql<number>`SUM(${ordersTable.quantity} * ${ordersTable.unitPriceMxn})`,
        averagePrice: sql<number>`AVG(${ordersTable.unitPriceMxn})`,
      })
      .from(ordersTable)
      .innerJoin(tabsTable, eq(ordersTable.tabId, tabsTable.id))
      .where(
        and(
          gte(tabsTable.closedAt, startDate),
          lte(tabsTable.closedAt, endDate),
          eq(tabsTable.status, "closed"),
        ),
      )
      .groupBy(
        ordersTable.drinkId,
        ordersTable.drinkName,
        ordersTable.drinkNameEs,
      )
      .orderBy(
        desc(
          sql<number>`SUM(${ordersTable.quantity} * ${ordersTable.unitPriceMxn})`,
        ),
      );

    // 2. Total sales by staff
    const salesByStaff = await db
      .select({
        userId: tabsTable.staffUserId,
        totalRevenue: sql<number>`SUM(${tabsTable.totalMxn})`,
        tabsCount: sql<number>`COUNT(DISTINCT ${tabsTable.id})`,
        avgTicket: sql<number>`AVG(${tabsTable.totalMxn})`,
        tipsTotal: sql<number>`SUM(${tabsTable.tipMxn})`,
      })
      .from(tabsTable)
      .where(
        and(
          gte(tabsTable.closedAt, startDate),
          lte(tabsTable.closedAt, endDate),
          eq(tabsTable.status, "closed"),
        ),
      )
      .groupBy(tabsTable.staffUserId)
      .orderBy(desc(sql<number>`SUM(${tabsTable.totalMxn})`));

    // Get user details for staff sales
    const userIds = salesByStaff.map((s) => s.userId);
    const users =
      userIds.length > 0
        ? await db
            .select({
              id: usersTable.id,
              firstName: usersTable.firstName,
              lastName: usersTable.lastName,
            })
            .from(usersTable)
            .where(
              sql`${usersTable.id} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
        : [];

    const userMap = new Map(
      users.map((u) => [
        u.id,
        `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      ]),
    );

    // 3. Hourly sales breakdown
    const hourlySales = await db
      .select({
        hour: sql<number>`CAST(strftime('%H', datetime(${tabsTable.closedAt}, 'unixepoch')) AS INTEGER)`,
        totalRevenue: sql<number>`SUM(${tabsTable.totalMxn})`,
        tabsCount: sql<number>`COUNT(${tabsTable.id})`,
      })
      .from(tabsTable)
      .where(
        and(
          gte(tabsTable.closedAt, startDate),
          lte(tabsTable.closedAt, endDate),
          eq(tabsTable.status, "closed"),
        ),
      )
      .groupBy(
        sql`CAST(strftime('%H', datetime(${tabsTable.closedAt}, 'unixepoch')) AS INTEGER)`,
      )
      .orderBy(
        sql`CAST(strftime('%H', datetime(${tabsTable.closedAt}, 'unixepoch')) AS INTEGER)`,
      );

    // 4. Summary totals
    const summary = await db
      .select({
        totalRevenue: sql<number>`SUM(${tabsTable.totalMxn})`,
        totalTips: sql<number>`SUM(${tabsTable.tipMxn})`,
        totalDiscount: sql<number>`SUM(${tabsTable.discountMxn})`,
        tabsCount: sql<number>`COUNT(${tabsTable.id})`,
        ordersCount: sql<number>`SUM((SELECT COUNT(*) FROM ${ordersTable} WHERE ${ordersTable.tabId} = ${tabsTable.id}))`,
      })
      .from(tabsTable)
      .where(
        and(
          gte(tabsTable.closedAt, startDate),
          lte(tabsTable.closedAt, endDate),
          eq(tabsTable.status, "closed"),
        ),
      );

    res.json({
      summary: summary[0] || {
        totalRevenue: 0,
        totalTips: 0,
        totalDiscount: 0,
        tabsCount: 0,
        ordersCount: 0,
      },
      salesByDrink: salesByDrink.map((d) => ({
        ...d,
        totalRevenue: Number(d.totalRevenue) || 0,
        unitsPriced: Number(d.unitsPriced) || 0,
        averagePrice: Number(d.averagePrice) || 0,
      })),
      salesByStaff: salesByStaff.map((s) => ({
        userId: s.userId,
        userName: userMap.get(s.userId) || s.userId,
        totalRevenue: Number(s.totalRevenue) || 0,
        tabsCount: Number(s.tabsCount) || 0,
        avgTicket: Number(s.avgTicket) || 0,
        tipsTotal: Number(s.tipsTotal) || 0,
      })),
      hourlySales: hourlySales.map((h) => ({
        hour: h.hour,
        totalRevenue: Number(h.totalRevenue) || 0,
        tabsCount: Number(h.tabsCount) || 0,
      })),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/inventory/forecast
 * Calculate inventory consumption velocity and predict days-until-stockout for each ingredient.
 * Parameters:
 *   - days: Analysis period in days (7, 14, or 30; default 14)
 */
router.get(
  "/analytics/inventory/forecast",
  async (req: Request, res: Response) => {
    try {
      const daysParam = Math.min(
        30,
        Math.max(7, parseInt(req.query.days as string) || 14),
      );

      // Calculate cutoff date (days ago from now)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysParam);
      const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

      // Query: For each inventory item, calculate consumption velocity
      // Sum all ingredient consumption across all closed tabs in the period
      const forecasts = await db
        .select({
          itemId: inventoryItemsTable.id,
          itemName: inventoryItemsTable.name,
          itemNameEs: inventoryItemsTable.nameEs,
          baseUnit: inventoryItemsTable.baseUnit,
          currentStock: inventoryItemsTable.currentStock,
          servingSize: inventoryItemsTable.servingSize,
          lowStockThreshold: inventoryItemsTable.lowStockThreshold,
          // Consumption in the period (sum of all ingredient usage)
          consumedAmount: sql<number>`
          COALESCE(
            SUM(
              CAST(${ordersTable.quantity} AS REAL) *
              ${recipeIngredientsTable.amountInBaseUnit}
            ),
            0
          )
        `,
          // Count of orders that consumed this ingredient
          orderCount: sql<number>`COALESCE(COUNT(${ordersTable.id}), 0)`,
        })
        .from(inventoryItemsTable)
        .leftJoin(
          recipeIngredientsTable,
          sql`${recipeIngredientsTable.ingredientId} = ${inventoryItemsTable.id}`,
        )
        .leftJoin(
          ordersTable,
          sql`${ordersTable.drinkId} = ${recipeIngredientsTable.drinkId} AND ${ordersTable.createdAt} >= ${cutoffTimestamp}`,
        )
        .leftJoin(tabsTable, sql`${ordersTable.tabId} = ${tabsTable.id}`)
        .groupBy(inventoryItemsTable.id)
        .orderBy(inventoryItemsTable.name);

      // Process results to calculate velocity and predictions
      const predictions = forecasts.map((item) => {
        const consumedAmount = Number(item.consumedAmount) || 0;
        const currentStock = item.currentStock || 0;
        const servingSize = item.servingSize || 1;
        const lowThreshold = item.lowStockThreshold || 1;

        // Daily velocity = consumed in period / days
        const dailyVelocity = consumedAmount / daysParam;

        // Days until stockout = current stock / daily velocity
        let daysUntilStockout = Infinity;
        if (dailyVelocity > 0) {
          daysUntilStockout = currentStock / dailyVelocity;
        }

        // Calculate suggested reorder point: 3 days worth at current velocity + 1 buffer
        const suggestedReorderPoint = dailyVelocity * 3 + servingSize * 2;

        // Determine alert level
        let alertLevel: "critical" | "low" | "ok" = "ok";
        let alertDays = 0;
        if (daysUntilStockout <= 2) {
          alertLevel = "critical";
          alertDays = Math.ceil(daysUntilStockout);
        } else if (daysUntilStockout <= 5) {
          alertLevel = "low";
          alertDays = Math.ceil(daysUntilStockout);
        } else {
          alertDays = Math.floor(daysUntilStockout);
        }

        return {
          itemId: item.itemId,
          itemName: item.itemName,
          itemNameEs: item.itemNameEs || item.itemName,
          baseUnit: item.baseUnit,
          currentStock: parseFloat(currentStock.toFixed(2)),
          dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
          daysUntilStockout:
            daysUntilStockout === Infinity
              ? -1
              : parseFloat(daysUntilStockout.toFixed(1)),
          suggestedReorderPoint: parseFloat(suggestedReorderPoint.toFixed(2)),
          lowThreshold,
          alertLevel,
          alertDays,
          consumedInPeriod: parseFloat(consumedAmount.toFixed(2)),
          ordersInPeriod: item.orderCount || 0,
        };
      });

      // Sort by alert level criticality, then by days until stockout
      const prioritized = predictions.sort((a, b) => {
        const levelPriority = { critical: 0, low: 1, ok: 2 };
        const aPriority = levelPriority[a.alertLevel];
        const bPriority = levelPriority[b.alertLevel];
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (
          (a.daysUntilStockout === -1 ? Infinity : a.daysUntilStockout) -
          (b.daysUntilStockout === -1 ? Infinity : b.daysUntilStockout)
        );
      });

      res.json({
        period: {
          days: daysParam,
          startDate: cutoffDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        summary: {
          critical: prioritized.filter((p) => p.alertLevel === "critical")
            .length,
          low: prioritized.filter((p) => p.alertLevel === "low").length,
          ok: prioritized.filter((p) => p.alertLevel === "ok").length,
        },
        forecasts: prioritized,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
