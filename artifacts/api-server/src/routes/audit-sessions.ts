import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  db,
  inventoryItemsTable,
  inventoryAuditsTable,
  auditSessionsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

function getId(req: Request): string {
  return req.params.id as string;
}

// GET /api/inventory/audit-sessions - List all audit sessions
router.get("/", async (_req: Request, res: Response) => {
  try {
    const sessions = await db
      .select()
      .from(auditSessionsTable)
      .orderBy(sql`${auditSessionsTable.startedAt} desc`)
      .limit(50);
    return res.json(sessions);
  } catch (err: any) {
    console.error("[GET /audit-sessions] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to list audit sessions" });
  }
});

// POST /api/inventory/audit-sessions - Create new audit session
router.post("/", async (req: Request, res: Response) => {
  try {
    const { typeFilter, categoryFilter, startedByUserId } = req.body;
    const now = Math.floor(Date.now() / 1000);

    const allItems = await db
      .select({ id: inventoryItemsTable.id, type: inventoryItemsTable.type })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.isDeleted, 0));

    let itemCount = allItems.length;
    if (typeFilter && typeFilter !== "all") {
      itemCount = allItems.filter((i) => i.type === typeFilter).length;
    }

    const sessionId = crypto.randomUUID();
    const [session] = await db
      .insert(auditSessionsTable)
      .values({
        id: sessionId,
        status: "in_progress",
        typeFilter: typeFilter || null,
        categoryFilter: categoryFilter || null,
        startedByUserId: startedByUserId || "unknown",
        startedAt: now,
        itemCount: itemCount,
        completedCount: 0,
        createdAt: now,
      })
      .returning();

    return res.status(201).json(session);
  } catch (err: any) {
    console.error("[POST /audit-sessions] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create audit session" });
  }
});

// GET /api/inventory/audit-sessions/:id - Get session details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const [session] = await db
      .select()
      .from(auditSessionsTable)
      .where(eq(auditSessionsTable.id, id as string))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Audit session not found" });
    }

    return res.json(session);
  } catch (err: any) {
    console.error("[GET /audit-sessions/:id] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get audit session" });
  }
});

// GET /api/inventory/audit-sessions/:id/items - Get inventory items for session
router.get("/:id/items", async (req: Request, res: Response) => {
  try {
    const id = getId(req);

    const [session] = await db
      .select()
      .from(auditSessionsTable)
      .where(eq(auditSessionsTable.id, id as string))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Audit session not found" });
    }

    let items = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.isDeleted, 0))
      .orderBy(inventoryItemsTable.name);

    if (session.typeFilter && session.typeFilter !== "all") {
      items = items.filter((i) => i.type === session.typeFilter);
    }

    return res.json(items);
  } catch (err: any) {
    console.error("[GET /audit-sessions/:id/items] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get session items" });
  }
});

// POST /api/inventory/audit-sessions/:id/submit - Submit batch audit
router.post("/:id/submit", async (req: Request, res: Response) => {
  try {
    const id = getId(req);
    const { items, completedByUserId } = req.body;

    const [session] = await db
      .select()
      .from(auditSessionsTable)
      .where(eq(auditSessionsTable.id, id as string))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Audit session not found" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ error: "Session already completed" });
    }

    const now = Math.floor(Date.now() / 1000);
    const auditsCreated: any[] = [];
    const errors: string[] = [];

    for (const itemData of items) {
      const { itemId, reportedBulk, reportedPartial } = itemData;

      const [item] = await db
        .select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .limit(1);

      if (!item) {
        errors.push("Item " + itemId + " not found");
        continue;
      }

      const baseUnitAmount = Number(item.baseUnitAmount) || 750;
      const expectedTotal = Number(item.currentStock) || 0;
      const reportedTotal =
        (Number(reportedBulk) || 0) * baseUnitAmount +
        (Number(reportedPartial) || 0);
      const variance = reportedTotal - expectedTotal;
      const variancePercent =
        expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;

      const [audit] = await db
        .insert(inventoryAuditsTable)
        .values({
          itemId: itemId,
          sessionId: id,
          auditDate: now,
          auditEntryMethod: "bulk_partial",
          reportedBulk: Number(reportedBulk) || 0,
          reportedPartial: Number(reportedPartial) || 0,
          reportedTotal,
          previousTotal: expectedTotal,
          systemStock: expectedTotal,
          physicalCount: reportedTotal,
          variance,
          variancePercent,
          auditReason: "batch_audit",
          auditedByUserId: completedByUserId || "unknown",
          auditedAt: now,
          countedAt: now,
          createdAt: now,
        })
        .returning();

      auditsCreated.push(audit);

      await db
        .update(inventoryItemsTable)
        .set({
          currentBulk: Number(reportedBulk) || 0,
          currentPartial: Number(reportedPartial) || 0,
          currentStock: reportedTotal,
          lastAuditedAt: now,
          lastAuditedByUserId: completedByUserId || "unknown",
          updatedAt: now,
        })
        .where(eq(inventoryItemsTable.id, itemId));
    }

    await db
      .update(auditSessionsTable)
      .set({
        status: "completed",
        completedByUserId: completedByUserId || "unknown",
        completedAt: now,
        completedCount: items.length,
      })
      .where(eq(auditSessionsTable.id, id as string));

    await logEvent({
      userId: completedByUserId || "unknown",
      action: "batch_audit",
      entityType: "inventory",
      entityId: id,
      newValue: {
        itemCount: items.length,
        typeFilter: session.typeFilter,
        sessionId: id,
      },
    });

    return res.json({
      success: true,
      sessionId: id,
      auditsCreated: auditsCreated.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("[POST /audit-sessions/:id/submit] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to submit batch audit" });
  }
});

// GET /api/inventory/audit-sessions/:id/report - Get audit report for completed session
router.get("/:id/report", async (req: Request, res: Response) => {
  try {
    const id = getId(req);

    const [session] = await db
      .select()
      .from(auditSessionsTable)
      .where(eq(auditSessionsTable.id, id as string))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Audit session not found" });
    }

    // Get all audits for this session
    const audits = await db
      .select({
        audit: inventoryAuditsTable,
        item: inventoryItemsTable,
      })
      .from(inventoryAuditsTable)
      .leftJoin(
        inventoryItemsTable,
        eq(inventoryAuditsTable.itemId, inventoryItemsTable.id),
      )
      .where(eq(inventoryAuditsTable.sessionId, id));

    // Calculate summary
    let totalItems = 0;
    let totalVariance = 0;
    let overages = 0;
    let shortages = 0;
    let onTarget = 0;

    const auditResults = audits.map((a: any) => {
      const v = Number(a.audit?.variance || 0);
      totalItems++;
      totalVariance += v;
      if (v > 0) overages++;
      else if (v < 0) shortages++;
      else onTarget++;

      return {
        id: a.audit?.id,
        itemId: a.audit?.itemId,
        itemName: a.item?.name || "Unknown",
        itemType: a.item?.type || "unknown",
        previousTotal: Number(a.audit?.previousTotal || 0),
        reportedTotal: Number(a.audit?.reportedTotal || 0),
        variance: v,
        variancePercent: Number(a.audit?.variancePercent || 0),
        auditReason: a.audit?.auditReason,
      };
    });

    res.json({
      session: {
        id: session.id,
        status: session.status,
        typeFilter: session.typeFilter,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        completedByUserId: session.completedByUserId,
        itemCount: session.itemCount,
        completedCount: session.completedCount,
      },
      summary: {
        totalItems,
        totalVariance,
        overages,
        shortages,
        onTarget,
      },
      results: auditResults,
    });
  } catch (err: any) {
    console.error("[GET /audit-sessions/:id/report] Error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Failed to get audit report" });
  }
  
  return res.json({ session: {}, summary: {}, results: [] });
});

export default router;
