import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  staffPerformanceTable,
  usersTable,
  tabsTable,
  ordersTable,
} from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import * as zod from "zod";
import { GetStaffPerformanceResponse } from "@workspace/api-zod";
import { customHeaders } from "../lib/headers";

const router = Router();

/**
 * GET /api/staff-performance/:shiftId
 * Get performance metrics for all staff members in a shift
 */
router.get("/:shiftId", async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId as string;

    // Verify shift exists
    const shift = await db.query.shiftsTable.findFirst({
      where: (table) => eq(table.id, shiftId),
    });

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    // Get performance metrics
    const metrics = await db
      .select({
        id: staffPerformanceTable.id,
        staffUserId: staffPerformanceTable.staffUserId,
        staffName: sql<string>`${usersTable.firstName} || ' ' || COALESCE(${usersTable.lastName}, '')`,
        staffRole: usersTable.role,
        totalOrders: staffPerformanceTable.totalOrders,
        totalRevenue: staffPerformanceTable.totalRevenue,
        totalTips: staffPerformanceTable.totalTips,
        totalTabs: staffPerformanceTable.totalTabs,
        avgOrderValue: staffPerformanceTable.avgOrderValue,
        avgTabValue: staffPerformanceTable.avgTabValue,
        tipPercentage: staffPerformanceTable.tipPercentage,
        customerCount: staffPerformanceTable.customerCount,
        ordersPerHour: staffPerformanceTable.ordersPerHour,
        revenuePerHour: staffPerformanceTable.revenuePerHour,
      })
      .from(staffPerformanceTable)
      .innerJoin(
        usersTable,
        eq(staffPerformanceTable.staffUserId, usersTable.id),
      )
      .where(eq(staffPerformanceTable.shiftId, shiftId));

    // Sort by revenue (highest first)
    metrics.sort((a, b) => (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0));

    // Calculate shift summary
    const _totalRevenue = metrics.reduce(
      (sum, m) => sum + (m.totalRevenue ?? 0),
      0,
    );
    const _totalTips = metrics.reduce((sum, m) => sum + (m.totalTips ?? 0), 0);
    const _topPerformer = metrics[0];

    const response: zod.infer<typeof GetStaffPerformanceResponse> = metrics.map(
      (m) => ({
        staffUserId: m.staffUserId,
        staffName: m.staffName.trim(),
        staffRole: m.staffRole ?? undefined,
        totalOrders: m.totalOrders ?? 0,
        totalRevenueMxn: m.totalRevenue ?? 0,
        totalTipsMxn: m.totalTips ?? 0,
        tabsOpened: m.totalTabs ?? 0,
        tabsClosed: m.totalTabs ?? 0,
        drinksServed: m.totalOrders ?? 0,
      }),
    );

    return res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[staff-performance] GET/:shiftId error:", error);
    return res.status(500).json({ error: "Failed to fetch staff performance" });
  }
});

/**
 * POST /api/staff-performance/recalculate/:shiftId
 * Recalculate performance metrics for all staff in a shift
 * Called when shift ends or manually triggered
 */
router.post("/recalculate/:shiftId", async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId as string;

    // Verify shift exists
    const shift = await db.query.shiftsTable.findFirst({
      where: (table) => eq(table.id, shiftId),
    });

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    // Delete existing performance records for this shift
    await db
      .delete(staffPerformanceTable)
      .where(eq(staffPerformanceTable.shiftId, shiftId));

    // Get all closed tabs for this shift
    const tabs = await db
      .select()
      .from(tabsTable)
      .where(eq(tabsTable.shiftId, shiftId));

    const closedTabs = tabs.filter((t) => t.status === "closed");

    // Get all orders for these tabs
    const tabIds = closedTabs.map((t) => t.id);
    const allOrders =
      tabIds.length > 0
        ? await db
            .select()
            .from(ordersTable)
            .where(inArray(ordersTable.tabId, tabIds))
        : [];

    // Calculate shift duration in hours
    const startedAt = shift.startedAt
      ? new Date(shift.startedAt).getTime()
      : Date.now();
    const endedAt = shift.closedAt
      ? new Date(shift.closedAt).getTime()
      : Date.now();
    const shiftHours = Math.max((endedAt - startedAt) / (1000 * 60 * 60), 0.01);

    // Group tabs and orders by staff member
    const staffData = new Map<
      string,
      {
        tabs: (typeof tabsTable.$inferSelect)[];
        orders: (typeof ordersTable.$inferSelect)[];
        totalRevenue: number;
        totalTips: number;
      }
    >();

    for (const tab of closedTabs) {
      if (!staffData.has(tab.staffUserId)) {
        staffData.set(tab.staffUserId, {
          tabs: [],
          orders: [],
          totalRevenue: 0,
          totalTips: 0,
        });
      }
      const entry = staffData.get(tab.staffUserId)!;
      entry.tabs.push(tab);
      entry.totalRevenue += Number(tab.totalMxn);
      entry.totalTips += Number(tab.tipMxn || 0);
    }

    for (const order of allOrders) {
      const tab = tabs.find((t) => t.id === order.tabId);
      if (tab && staffData.has(tab.staffUserId)) {
        staffData.get(tab.staffUserId)!.orders.push(order);
      }
    }

    // Insert performance records for each staff member
    for (const [staffUserId, data] of staffData.entries()) {
      const totalOrders = data.orders.reduce((sum, o) => sum + o.quantity, 0);
      const totalTabs = data.tabs.length;
      const avgOrderValue =
        totalOrders > 0 ? data.totalRevenue / totalOrders : 0;
      const avgTabValue = totalTabs > 0 ? data.totalRevenue / totalTabs : 0;
      const tipPercentage =
        data.totalRevenue > 0 ? (data.totalTips / data.totalRevenue) * 100 : 0;
      const ordersPerHour = totalOrders / shiftHours;
      const revenuePerHour = data.totalRevenue / shiftHours;

      await db.insert(staffPerformanceTable).values({
        staffUserId,
        shiftId,
        totalOrders,
        totalRevenue: data.totalRevenue,
        totalTips: data.totalTips,
        totalTabs,
        avgOrderValue,
        avgTabValue,
        tipPercentage,
        customerCount: totalTabs,
        ordersPerHour,
        revenuePerHour,
      });
    }

    const response = {
      success: true,
      message: "Performance metrics recalculated",
      shiftId,
      staffCount: staffData.size,
    };

    return res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[staff-performance] POST /recalculate error:", error);
    return res
      .status(500)
      .json({ error: "Failed to recalculate performance metrics" });
  }
});

export default router;
