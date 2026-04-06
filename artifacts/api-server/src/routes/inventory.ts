import { Router, Request, Response } from 'express';
import { db, inventoryItemsTable, inventoryCountsTable, inventoryAdjustmentsTable } from '@workspace/db';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/inventory/items
 * Get all inventory items with optional filters
 */
router.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(inventoryItemsTable);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

/**
 * GET /api/inventory/items/:id
 * Get single inventory item with recent audits
 */
router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const item = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get recent audits
    const audits = await db
      .select()
      .from(inventoryCountsTable)
      .where(eq(inventoryCountsTable.itemId, id))
      .orderBy(desc(inventoryCountsTable.auditDate))
      .limit(10);

    return res.json({
      ...item,
      recentAudits: audits,
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

/**
 * POST /api/inventory/items/:id/audit
 * Record a new audit for an inventory item
 */
router.post('/items/:id/audit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      auditEntryMethod,
      reportedBulk,
      reportedPartial,
      reportedTotal,
      previousTotal,
      expectedTotal,
      variance,
      variancePercent,
      varianceReason,
      notes,
    } = req.body;

    // Get staff ID from auth (assume it's in req.user.id)
    const staffId = (req as any).user?.id || 'unknown';

    // Get current item to update
    const item = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Insert audit record
    const auditId = crypto.randomUUID();
    const now = new Date();

    await db.insert(inventoryCountsTable).values({
      id: auditId,
      itemId: id,
      auditDate: now,
      auditedByUserId: staffId,
      auditEntryMethod,
      reportedBulk,
      reportedPartial,
      reportedTotal,
      previousTotal,
      expectedTotal,
      variance,
      variancePercent,
      varianceReason,
      notes,
    });

    // Update item's current stock and last audit
    await db
      .update(inventoryItemsTable)
      .set({
        currentBulk: auditEntryMethod === 'bulk_partial' ? reportedBulk : 0,
        currentPartial: reportedPartial,
        lastAuditedAt: now,
        lastAuditedByUserId: staffId,
        updatedAt: now,
      })
      .where(eq(inventoryItemsTable.id, id));

    return res.json({
      success: true,
      auditId,
      message: 'Audit recorded successfully',
    });
  } catch (error) {
    console.error('Error recording audit:', error);
    return res.status(500).json({ error: 'Failed to record audit' });
  }
});

/**
 * POST /api/inventory/items/:id/adjust
 * Manual adjustment to inventory (received, damaged, etc.)
 */
router.post('/items/:id/adjust', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { adjustmentBulk, adjustmentPartial, reason } = req.body;

    const staffId = (req as any).user?.id || 'unknown';

    // Get current item
    const item = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Insert adjustment record
    const adjustmentId = crypto.randomUUID();
    const now = new Date();

    await db.insert(inventoryAdjustmentsTable).values({
      id: adjustmentId,
      itemId: id,
      adjustmentBulk,
      adjustmentPartial,
      reason,
      adjustedByUserId: staffId,
      createdAt: now,
    });

    // Update item stock
    const newBulk = item.currentBulk + adjustmentBulk;
    const newPartial = item.currentPartial + adjustmentPartial;

    await db
      .update(inventoryItemsTable)
      .set({
        currentBulk: Math.max(0, newBulk),
        currentPartial: Math.max(0, newPartial),
        updatedAt: now,
      })
      .where(eq(inventoryItemsTable.id, id));

    return res.json({
      success: true,
      adjustmentId,
      newBulk: Math.max(0, newBulk),
      newPartial: Math.max(0, newPartial),
      message: 'Adjustment recorded successfully',
    });
  } catch (error) {
    console.error('Error recording adjustment:', error);
    return res.status(500).json({ error: 'Failed to record adjustment' });
  }
});

/**
 * PUT /api/inventory/items/:id/config
 * Update low stock alert configuration
 */
router.put('/items/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      lowStockMethod,
      lowStockManualThreshold,
      lowStockPercent,
      lowStockPercentBase,
      lowStockUsageDays,
    } = req.body;

    const now = new Date();

    await db
      .update(inventoryItemsTable)
      .set({
        lowStockMethod,
        lowStockManualThreshold,
        lowStockPercent,
        lowStockPercentBase,
        lowStockUsageDays,
        updatedAt: now,
      })
      .where(eq(inventoryItemsTable.id, id));

    return res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * GET /api/inventory/items/:id/counts
 * Get audit history for an item
 */
router.get('/items/:id/counts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const limit = parseInt(req.query.limit as string) || 50;

    const audits = await db
      .select()
      .from(inventoryCountsTable)
      .where(eq(inventoryCountsTable.itemId, id))
      .orderBy(desc(inventoryCountsTable.auditDate))
      .limit(limit);

    return res.json(audits);
  } catch (error) {
    console.error('Error fetching audit history:', error);
    return res.status(500).json({ error: 'Failed to fetch audit history' });
  }
});

/**
 * GET /api/inventory/low-stock
 * Get all items that are currently low on stock
 */
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(inventoryItemsTable);

    const lowStockItems = items.filter((item) => {
      if (item.currentBulk === null || item.bulkSize === null || item.currentPartial === null) {
        return false;
      }
      
      const current = item.currentBulk * item.bulkSize + item.currentPartial;

      if (item.lowStockMethod?.includes('manual')) {
        if (item.lowStockManualThreshold && current < item.lowStockManualThreshold) return true;
      }

      if (item.lowStockMethod?.includes('percentage')) {
        if (item.lowStockPercentBase && item.lowStockPercent) {
          const pct = (current / item.lowStockPercentBase) * 100;
          if (pct < item.lowStockPercent) return true;
        }
      }

      return false;
    });

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

export default router;
