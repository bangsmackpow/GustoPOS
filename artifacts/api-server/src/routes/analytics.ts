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

router.get("/analytics/sales", async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? Math.floor(new Date(req.query.startDate as string).getTime() / 1000)
      : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const endDate = req.query.endDate
      ? Math.floor(new Date(req.query.endDate as string).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

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
        startDate: new Date(startDate * 1000).toISOString(),
        endDate: new Date(endDate * 1000).toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  "/analytics/inventory/forecast",
  async (req: Request, res: Response) => {
    try {
      const daysParam = Math.min(
        30,
        Math.max(7, parseInt(req.query.days as string) || 14),
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysParam);
      const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

      const forecasts = await db
        .select({
          itemId: inventoryItemsTable.id,
          itemName: inventoryItemsTable.name,
          itemNameEs: inventoryItemsTable.nameEs,
          baseUnit: inventoryItemsTable.baseUnit,
          currentStock: inventoryItemsTable.currentStock,
          servingSize: inventoryItemsTable.servingSize,
          lowStockThreshold: inventoryItemsTable.lowStockThreshold,
          consumedAmount: sql<number>`
          COALESCE(
            SUM(
              CAST(${ordersTable.quantity} AS REAL) *
              ${recipeIngredientsTable.amountInBaseUnit}
            ),
            0
          )
        `,
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

      const predictions = forecasts.map((item) => {
        const consumedAmount = Number(item.consumedAmount) || 0;
        const currentStock = item.currentStock || 0;
        const servingSize = item.servingSize || 1;
        const lowThreshold = item.lowStockThreshold || 1;

        const dailyVelocity = consumedAmount / daysParam;

        let daysUntilStockout = Infinity;
        if (dailyVelocity > 0) {
          daysUntilStockout = currentStock / dailyVelocity;
        }

        const suggestedReorderPoint = dailyVelocity * 3 + servingSize * 2;

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

router.get("/analytics/voids", async (req: Request, res: Response) => {
  try {
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;

    const startDate = startDateParam
      ? Math.floor(new Date(startDateParam).getTime() / 1000)
      : Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const endDate = endDateParam
      ? Math.floor(new Date(endDateParam).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const voidedOrders = await db
      .select({
        id: ordersTable.id,
        drinkId: ordersTable.drinkId,
        drinkName: ordersTable.drinkName,
        drinkNameEs: ordersTable.drinkNameEs,
        quantity: ordersTable.quantity,
        unitPriceMxn: ordersTable.unitPriceMxn,
        voidReason: ordersTable.voidReason,
        voidedByUserId: ordersTable.voidedByUserId,
        voidedAt: ordersTable.voidedAt,
      })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.voided, 1),
          gte(ordersTable.voidedAt || 0, startDate),
          lte(ordersTable.voidedAt || 0, endDate),
        ),
      );

    const byReason: Record<string, { count: number; totalValue: number }> = {};
    let totalVoidValue = 0;

    for (const order of voidedOrders) {
      const reason = order.voidReason || "other";
      const orderTotal = Number(order.unitPriceMxn) * Number(order.quantity);
      if (!byReason[reason]) {
        byReason[reason] = { count: 0, totalValue: 0 };
      }
      byReason[reason].count += 1;
      byReason[reason].totalValue += orderTotal;
      totalVoidValue += orderTotal;
    }

    const byStaff: Record<
      string,
      { count: number; totalValue: number; reasons: Record<string, number> }
    > = {};

    for (const order of voidedOrders) {
      const staffId = order.voidedByUserId || "unknown";
      const orderTotal = Number(order.unitPriceMxn) * Number(order.quantity);
      if (!byStaff[staffId]) {
        byStaff[staffId] = { count: 0, totalValue: 0, reasons: {} };
      }
      byStaff[staffId].count += 1;
      byStaff[staffId].totalValue += orderTotal;
      const reason = order.voidReason || "other";
      byStaff[staffId].reasons[reason] =
        (byStaff[staffId].reasons[reason] || 0) + 1;
    }

    const staffIds = Object.keys(byStaff);
    const staffDetails: Record<string, any> = {};

    if (staffIds.length > 0) {
      const users = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
        })
        .from(usersTable)
        .where(
          sql`${usersTable.id} IN (${sql.join(
            staffIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );

      for (const user of users) {
        const userId = user.id as string;
        if (byStaff[userId]) {
          staffDetails[userId] = {
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() || userId,
            ...byStaff[userId],
          };
        }
      }
    }

    const byDrink: Record<string, { count: number; totalValue: number }> = {};
    for (const order of voidedOrders) {
      const drinkKey = order.drinkName || "Unknown";
      const orderTotal = Number(order.unitPriceMxn) * Number(order.quantity);
      if (!byDrink[drinkKey]) {
        byDrink[drinkKey] = { count: 0, totalValue: 0 };
      }
      byDrink[drinkKey].count += 1;
      byDrink[drinkKey].totalValue += orderTotal;
    }

    const allOrdersInRange = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ordersTable)
      .innerJoin(tabsTable, eq(ordersTable.tabId, tabsTable.id))
      .where(
        and(
          gte(tabsTable.closedAt, startDate),
          lte(tabsTable.closedAt, endDate),
          eq(tabsTable.status, "closed"),
        ),
      );

    const totalOrders = Number(allOrdersInRange[0]?.count) || 0;
    const voidRate =
      totalOrders > 0 ? (voidedOrders.length / totalOrders) * 100 : 0;

    res.json({
      period: { startDate, endDate },
      summary: {
        totalVoids: voidedOrders.length,
        totalVoidValue: parseFloat(totalVoidValue.toFixed(2)),
        voidRate: parseFloat(voidRate.toFixed(2)),
        totalOrders,
      },
      byReason: Object.entries(byReason).map(([reason, data]) => ({
        reason,
        count: data.count,
        totalValue: parseFloat(data.totalValue.toFixed(2)),
        percentage:
          voidedOrders.length > 0
            ? parseFloat(((data.count / voidedOrders.length) * 100).toFixed(1))
            : 0,
      })),
      byStaff: Object.entries(staffDetails).map(
        ([staffId, data]: [string, any]) => ({
          staffId,
          ...data,
          totalValue: parseFloat(data.totalValue.toFixed(2)),
        }),
      ),
      byDrink: Object.entries(byDrink)
        .map(([drinkName, data]) => ({
          drinkName,
          count: data.count,
          totalValue: parseFloat(data.totalValue.toFixed(2)),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
