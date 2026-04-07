import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  inventoryAuditsTable,
  inventoryItemsTable,
  ordersTable,
  tabsTable,
  recipeIngredientsTable,
} from "@workspace/db";
import { eq, desc, sql, gte, lte, and } from "drizzle-orm";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

/**
 * GET /api/inventory-audits/history
 * Get audit history with optional filtering
 * Parameters:
 *   - itemId: Filter by specific item (optional)
 *   - days: Show audits from last N days (default 90)
 *   - includeVarianceOnly: Show only non-zero variance (optional)
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const itemId = req.query.itemId as string | undefined;
    const daysParam = Math.min(
      365,
      Math.max(7, parseInt(req.query.days as string) || 90),
    );
    const includeVarianceOnly = req.query.varianceOnly === "true";

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysParam);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    const conditions = [
      gte(inventoryAuditsTable.auditedAt, cutoffTimestamp as any),
    ];
    if (itemId) {
      conditions.push(eq(inventoryAuditsTable.itemId, itemId));
    }
    if (includeVarianceOnly) {
      conditions.push(sql`${inventoryAuditsTable.variance} != 0`);
    }

    const audits = await db
      .select({
        id: inventoryAuditsTable.id,
        itemId: inventoryAuditsTable.itemId,
        itemName: inventoryItemsTable.name,
        itemNameEs: inventoryItemsTable.nameEs,
        baseUnit: inventoryItemsTable.baseUnit,
        systemStock: inventoryAuditsTable.systemStock,
        physicalCount: inventoryAuditsTable.physicalCount,
        variance: inventoryAuditsTable.variance,
        variancePercent: inventoryAuditsTable.variancePercent,
        auditReason: inventoryAuditsTable.auditReason,
        notes: inventoryAuditsTable.notes,
        auditedByUserId: inventoryAuditsTable.auditedByUserId,
        auditedAt: inventoryAuditsTable.auditedAt,
      })
      .from(inventoryAuditsTable)
      .innerJoin(
        inventoryItemsTable,
        eq(inventoryAuditsTable.itemId, inventoryItemsTable.id),
      )
      .where(and(...conditions))
      .orderBy(desc(inventoryAuditsTable.auditedAt));

    res.json({
      period: {
        days: daysParam,
        startDate: cutoffDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      audits: audits.map((a) => ({
        ...a,
        systemStock: parseFloat(a.systemStock.toFixed(2)),
        physicalCount: parseFloat(a.physicalCount.toFixed(2)),
        variance: parseFloat(a.variance.toFixed(2)),
        variancePercent: parseFloat(a.variancePercent.toFixed(2)),
      })),
    });
  } catch (error) {
    console.error("Inventory audits history error:", error);
    res.status(500).json({ error: "Failed to fetch audit history" });
  }
});

/**
 * GET /api/inventory-audits/variance-summary
 * Analyze variance patterns to identify systematic issues
 * Returns: Items with highest variance, common issues, recommendations
 */
router.get("/variance-summary", async (req: Request, res: Response) => {
  try {
    const daysParam = Math.min(
      365,
      Math.max(7, parseInt(req.query.days as string) || 90),
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysParam);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    // Get all audits in the period
    const allAudits = await db
      .select({
        id: inventoryAuditsTable.id,
        itemId: inventoryAuditsTable.itemId,
        itemName: inventoryItemsTable.name,
        itemNameEs: inventoryItemsTable.nameEs,
        variance: inventoryAuditsTable.variance,
        variancePercent: inventoryAuditsTable.variancePercent,
        auditReason: inventoryAuditsTable.auditReason,
      })
      .from(inventoryAuditsTable)
      .innerJoin(
        inventoryItemsTable,
        eq(inventoryAuditsTable.itemId, inventoryItemsTable.id),
      )
      .where(gte(inventoryAuditsTable.auditedAt, cutoffTimestamp as any));

    // Aggregate by item
    const itemVariances: Record<
      string,
      {
        itemId: string;
        itemName: string;
        itemNameEs?: string;
        auditCount: number;
        totalVariance: number;
        avgVariancePercent: number;
        maxVariance: number;
        minVariance: number;
        negativeCount: number;
        positiveCount: number;
        lastVariancePercent: number;
      }
    > = {};

    allAudits.forEach((audit) => {
      if (!itemVariances[audit.itemId]) {
        itemVariances[audit.itemId] = {
          itemId: audit.itemId,
          itemName: audit.itemName,
          itemNameEs: audit.itemNameEs ?? undefined,
          auditCount: 0,
          totalVariance: 0,
          avgVariancePercent: 0,
          maxVariance: Math.abs(audit.variance),
          minVariance: Math.abs(audit.variance),
          negativeCount: 0,
          positiveCount: 0,
          lastVariancePercent: audit.variancePercent,
        };
      }

      const item = itemVariances[audit.itemId];
      item.auditCount += 1;
      item.totalVariance += audit.variance;
      item.avgVariancePercent =
        (item.avgVariancePercent * (item.auditCount - 1) +
          audit.variancePercent) /
        item.auditCount;
      item.maxVariance = Math.max(item.maxVariance, Math.abs(audit.variance));
      item.minVariance = Math.min(item.minVariance, Math.abs(audit.variance));
      item.negativeCount += audit.variance < 0 ? 1 : 0;
      item.positiveCount += audit.variance > 0 ? 1 : 0;
      item.lastVariancePercent = audit.variancePercent;
    });

    // Convert to array and sort by total variance
    const itemSummaries = Object.values(itemVariances).sort(
      (a, b) => Math.abs(b.totalVariance) - Math.abs(a.totalVariance),
    );

    // Generate recommendations
    const recommendations: Array<{
      itemId: string;
      itemName: string;
      issue: string;
      severity: "critical" | "high" | "medium" | "low";
      recommendation: string;
    }> = [];

    itemSummaries.forEach((item) => {
      // Consistent underage (shrinkage/spillage)
      if (
        item.negativeCount > item.auditCount * 0.5 &&
        Math.abs(item.avgVariancePercent) > 5
      ) {
        recommendations.push({
          itemId: item.itemId,
          itemName: item.itemName,
          issue: "Consistent Underage",
          severity:
            Math.abs(item.avgVariancePercent) > 15 ? "critical" : "high",
          recommendation:
            "Investigate possible shrinkage, spillage, or measurement errors. Check storage conditions and pour accuracy.",
        });
      }

      // Consistent overage (measurement, free pours)
      if (
        item.positiveCount > item.auditCount * 0.5 &&
        item.avgVariancePercent > 5
      ) {
        recommendations.push({
          itemId: item.itemId,
          itemName: item.itemName,
          issue: "Consistent Overage",
          severity: item.avgVariancePercent > 15 ? "high" : "medium",
          recommendation:
            "Staff may be overpouring. Review pour system and staff training on proper measurements.",
        });
      }

      // High volatility
      if (item.maxVariance - item.minVariance > 50 && item.auditCount >= 3) {
        recommendations.push({
          itemId: item.itemId,
          itemName: item.itemName,
          issue: "High Volatility",
          severity: "medium",
          recommendation:
            "Large variance swings. Standardize counting procedures and staff training.",
        });
      }

      // Recent significant variance
      if (Math.abs(item.lastVariancePercent) > 10) {
        recommendations.push({
          itemId: item.itemId,
          itemName: item.itemName,
          issue: "Recent Significant Variance",
          severity: "medium",
          recommendation:
            "Latest count shows significant variance. Verify stock levels and repeat count if necessary.",
        });
      }
    });

    res.json({
      period: {
        days: daysParam,
        startDate: cutoffDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      summary: {
        totalAudits: allAudits.length,
        itemsAudited: itemSummaries.length,
        itemsWithVariance: itemSummaries.filter((i) => i.totalVariance !== 0)
          .length,
      },
      itemVariances: itemSummaries.map((item) => ({
        ...item,
        totalVariance: parseFloat(item.totalVariance.toFixed(2)),
        avgVariancePercent: parseFloat(item.avgVariancePercent.toFixed(2)),
        maxVariance: parseFloat(item.maxVariance.toFixed(2)),
        minVariance: parseFloat(item.minVariance.toFixed(2)),
        lastVariancePercent: parseFloat(item.lastVariancePercent.toFixed(2)),
      })),
      recommendations: recommendations.sort((a, b) => {
        const severityMap = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityMap[a.severity] - severityMap[b.severity];
      }),
    });
  } catch (error) {
    console.error("Variance summary error:", error);
    res.status(500).json({ error: "Failed to calculate variance summary" });
  }
});

/**
 * POST /api/inventory-audits
 * Record a new inventory audit (physical count vs system count)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { itemId, physicalCount, auditReason, notes, auditedByUserId } =
      req.body;

    if (!itemId || physicalCount === undefined || !auditedByUserId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get current system stock
    const item = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, itemId));

    if (!item.length) {
      return res.status(404).json({ error: "Item not found" });
    }

    const systemStock = item[0].currentStock;
    const variance = physicalCount - systemStock;
    const variancePercent =
      systemStock > 0 ? (variance / systemStock) * 100 : 0;

    // Record the audit
    const audit = await db.insert(inventoryAuditsTable).values({
      itemId,
      systemStock,
      physicalCount,
      variance,
      variancePercent,
      auditReason: auditReason || "manual",
      notes,
      auditedByUserId,
    });

    // Log audit event
    await logEvent({
      userId: auditedByUserId,
      entityType: "inventory",
      entityId: itemId,
      action: "audit",
      oldValue: { systemStock },
      newValue: { physicalCount, variance, variancePercent, notes },
    });

    return res.json({
      success: true,
      audit: {
        itemId,
        systemStock,
        physicalCount,
        variance,
        variancePercent,
      },
    });
  } catch (error: any) {
    console.error("Audit creation error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to record audit" });
  }
});

export default router;
