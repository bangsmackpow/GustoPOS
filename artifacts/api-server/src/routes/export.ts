import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  tabsTable,
  ordersTable,
  inventoryItemsTable,
  periodsTable,
  cogsEntriesTable,
  eventLogsTable,
} from "@workspace/db";
import { eq, desc, sql, and, gte, lte, gt, lt } from "drizzle-orm";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

function arrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"') || value.includes("\n"))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

// GET /api/export/sales - Export sales data as CSV
router.get(
  "/sales",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      let filter = undefined;
      if (startDate && endDate) {
        const start = parseInt(startDate as string);
        const end = parseInt(endDate as string);
        filter = and(
          eq(tabsTable.status, "closed"),
          gte(tabsTable.closedAt as any, start),
          lte(tabsTable.closedAt as any, end),
        );
      } else if (startDate) {
        const start = parseInt(startDate as string);
        filter = and(
          eq(tabsTable.status, "closed"),
          gte(tabsTable.closedAt as any, start),
        );
      } else if (endDate) {
        const end = parseInt(endDate as string);
        filter = and(
          eq(tabsTable.status, "closed"),
          lte(tabsTable.closedAt as any, end),
        );
      } else {
        filter = eq(tabsTable.status, "closed");
      }

      const tabs = await db
        .select()
        .from(tabsTable)
        .where(filter)
        .orderBy(desc(tabsTable.closedAt));

      const tabIds = tabs.map((t) => t.id);

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

      const salesData = tabs.map((tab) => {
        const tabOrders = nonVoidedOrders.filter((o) => o.tabId === tab.id);
        const tabTotal = tabOrders.reduce(
          (sum, o) => sum + Number(o.unitPriceMxn || 0) * o.quantity,
          0,
        );
        return {
          tabId: tab.id,
          nickname: tab.nickname || "",
          staffUserId: tab.staffUserId || "",
          openedAt: tab.openedAt,
          closedAt: tab.closedAt || "",
          totalMxn: tab.totalMxn || 0,
          tipMxn: tab.tipMxn || 0,
          discountMxn: tab.discountMxn || 0,
          paymentMethod: tab.paymentMethod || "",
          orderCount: tabOrders.length,
          status: tab.status,
        };
      });

      const csv = arrayToCSV(salesData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales_${new Date().toISOString().split("T")[0]}.csv"`,
      );
      return res.send(csv);
    } catch (err: any) {
      console.error("[GET /export/sales] Error:", err.message);
      return res
        .status(500)
        .json({ error: err.message || "Failed to export sales" });
    }
  },
);

// GET /api/export/inventory - Export inventory as CSV
router.get(
  "/inventory",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const items = await db
        .select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.isDeleted, 0))
        .orderBy(inventoryItemsTable.name);

      const inventoryData = items.map((item) => ({
        id: item.id,
        name: item.name,

        type: item.type || "",
        subtype: item.subtype || "",
        baseUnitAmount: item.baseUnitAmount || 750,
        currentBulk: item.currentBulk || 0,
        currentPartial: item.currentPartial || 0,
        currentStock: item.currentStock || 0,
        reservedStock: item.reservedStock || 0,
        orderCost: item.orderCost || 0,
        servingSize: item.servingSize || 44.36,
        density: item.density || 0.94,
        containerWeightG: item.containerWeightG || 0,
        fullBottleWeightG: item.fullBottleWeightG || 0,
        trackingMode: item.trackingMode || "auto",
        lowStockThreshold: item.lowStockThreshold || 0,
        lastAuditedAt: item.lastAuditedAt || "",
        isOnMenu: item.isOnMenu ? "Yes" : "No",
        productPrice: item.productPrice || 0,
      }));

      const csv = arrayToCSV(inventoryData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="inventory_${new Date().toISOString().split("T")[0]}.csv"`,
      );
      return res.send(csv);
    } catch (err: any) {
      console.error("[GET /export/inventory] Error:", err.message);
      return res
        .status(500)
        .json({ error: err.message || "Failed to export inventory" });
    }
  },
);

// GET /api/export/cogs - Export COGS data as CSV
router.get(
  "/cogs",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { periodId } = req.query;

      let entries;
      if (periodId) {
        entries = await db
          .select()
          .from(cogsEntriesTable)
          .where(eq(cogsEntriesTable.periodId, periodId as string))
          .orderBy(cogsEntriesTable.itemName);
      } else {
        const periods = await db
          .select()
          .from(periodsTable)
          .where(eq(periodsTable.status, "closed"))
          .orderBy(desc(periodsTable.startDate))
          .limit(1);

        if (periods.length === 0) {
          return res.status(404).json({ error: "No closed periods found" });
        }

        entries = await db
          .select()
          .from(cogsEntriesTable)
          .where(eq(cogsEntriesTable.periodId, periods[0].id))
          .orderBy(cogsEntriesTable.itemName);
      }

      const cogsData = entries.map((entry) => ({
        periodId: entry.periodId,
        itemId: entry.itemId,
        itemName: entry.itemName,
        quantityUsed: entry.quantityUsed,
        unitCost: entry.unitCost,
        totalCost: entry.totalCost,
        category: entry.category || "",
      }));

      const csv = arrayToCSV(cogsData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="cogs_${new Date().toISOString().split("T")[0]}.csv"`,
      );
      return res.send(csv);
    } catch (err: any) {
      console.error("[GET /export/cogs] Error:", err.message);
      return res
        .status(500)
        .json({ error: err.message || "Failed to export COGS" });
    }
  },
);

// GET /api/export/audit-logs - Export audit logs as CSV
router.get(
  "/audit-logs",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, limit = 1000 } = req.query;

      let filter = undefined;
      if (startDate && endDate) {
        const start = parseInt(startDate as string);
        const end = parseInt(endDate as string);
        filter = and(
          gte(eventLogsTable.createdAt, start),
          lte(eventLogsTable.createdAt, end),
        );
      } else if (startDate) {
        filter = gte(eventLogsTable.createdAt, parseInt(startDate as string));
      } else if (endDate) {
        filter = lte(eventLogsTable.createdAt, parseInt(endDate as string));
      }

      const logs = await db
        .select()
        .from(eventLogsTable)
        .where(filter)
        .orderBy(desc(eventLogsTable.createdAt))
        .limit(parseInt(limit as string) || 1000);

      const logData = logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValue: log.oldValue || "",
        newValue: log.newValue || "",
        reason: log.reason || "",
        createdAt: log.createdAt,
      }));

      const csv = arrayToCSV(logData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit_logs_${new Date().toISOString().split("T")[0]}.csv"`,
      );
      return res.send(csv);
    } catch (err: any) {
      console.error("[GET /export/audit-logs] Error:", err.message);
      return res
        .status(500)
        .json({ error: err.message || "Failed to export audit logs" });
    }
  },
);

// GET /api/export/periods - Export periods as CSV
router.get(
  "/periods",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const periods = await db
        .select()
        .from(periodsTable)
        .orderBy(desc(periodsTable.startDate));

      const periodData = periods.map((period) => ({
        id: period.id,
        name: period.name,
        periodType: period.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        closedAt: period.closedAt || "",
        closedByUserId: period.closedByUserId || "",
        totalSalesMxn: period.totalSalesMxn || 0,
        totalCostMxn: period.totalCostMxn || 0,
        totalTipsMxn: period.totalTipsMxn || 0,
        totalDiscountsMxn: period.totalDiscountsMxn || 0,
        totalVoidsMxn: period.totalVoidsMxn || 0,
        cogsMxn: period.cogsMxn || 0,
        profitMxn: (period.totalSalesMxn || 0) - (period.cogsMxn || 0),
      }));

      const csv = arrayToCSV(periodData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="periods_${new Date().toISOString().split("T")[0]}.csv"`,
      );
      return res.send(csv);
    } catch (err: any) {
      console.error("[GET /export/periods] Error:", err.message);
      return res
        .status(500)
        .json({ error: err.message || "Failed to export periods" });
    }
  },
);

export default router;
