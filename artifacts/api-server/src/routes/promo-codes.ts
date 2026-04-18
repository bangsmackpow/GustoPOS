import { Router, type IRouter, type Request, type Response } from "express";
import { db, promoCodesTable, tabsTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";
import {
  GetPromoCodeByCodeParams,
  GetPromoCodeByCodeResponse,
  ApplyPromoCodeToTabParams,
  ApplyPromoCodeToTabBody,
  ApplyPromoCodeToTabResponse,
} from "@workspace/api-zod";
import { logEvent } from "../lib/auditLog";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

/**
 * POST /api/promo-codes
 * Create a new promo code (admin only)
 */
router.post(
  "/promo-codes",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      expiresAt,
      daysOfWeek,
      startHour,
      endHour,
      startDate,
      endDate,
    } = req.body;

    if (!code || !discountType || !discountValue) {
      res
        .status(400)
        .json({ error: "Code, discountType, and discountValue are required" });
      return;
    }

    if (!["percentage", "fixed_amount"].includes(discountType)) {
      res
        .status(400)
        .json({ error: "discountType must be 'percentage' or 'fixed_amount'" });
      return;
    }

    // Check for duplicate code
    const [existing] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.code, code.toUpperCase()));

    if (existing) {
      res.status(400).json({ error: "Promo code already exists" });
      return;
    }

    try {
      const [promo] = await db
        .insert(promoCodesTable)
        .values({
          code: code.toUpperCase(),
          description: description || null,
          discountType,
          discountValue: Number(discountValue),
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt
            ? Math.floor(new Date(expiresAt).getTime() / 1000)
            : null,
          isActive: 1,
          daysOfWeek: daysOfWeek || null,
          startHour: startHour ? Number(startHour) : null,
          endHour: endHour ? Number(endHour) : null,
          startDate: startDate
            ? Math.floor(new Date(startDate).getTime() / 1000)
            : null,
          endDate: endDate
            ? Math.floor(new Date(endDate).getTime() / 1000)
            : null,
        })
        .returning();

      res.json({
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxUses: promo.maxUses,
        currentUses: promo.currentUses,
        expiresAt: promo.expiresAt
          ? new Date(promo.expiresAt * 1000).toISOString()
          : null,
        isActive: promo.isActive === 1,
        daysOfWeek: promo.daysOfWeek,
        startHour: promo.startHour,
        endHour: promo.endHour,
        startDate: promo.startDate
          ? new Date(promo.startDate * 1000).toISOString()
          : null,
        endDate: promo.endDate
          ? new Date(promo.endDate * 1000).toISOString()
          : null,
      });
    } catch (err: any) {
      console.error("Error creating promo code:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * GET /api/promo-codes
 * List all promo codes (admin only)
 */
router.get(
  "/promo-codes",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const promos = await db
        .select()
        .from(promoCodesTable)
        .orderBy(desc(promoCodesTable.createdAt));

      res.json(
        promos.map((p) => ({
          id: p.id,
          code: p.code,
          description: p.description,
          discountType: p.discountType,
          discountValue: p.discountValue,
          maxUses: p.maxUses,
          currentUses: p.currentUses,
          expiresAt: p.expiresAt
            ? new Date(p.expiresAt * 1000).toISOString()
            : null,
          isActive: p.isActive === 1,
          createdAt: new Date(p.createdAt * 1000).toISOString(),
        })),
      );
    } catch (err: any) {
      console.error("Error listing promo codes:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * PATCH /api/promo-codes/:id
 * Update a promo code (admin only)
 */
router.patch(
  "/promo-codes/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      expiresAt,
      isActive,
      daysOfWeek,
      startHour,
      endHour,
      startDate,
      endDate,
    } = req.body;

    const [existing] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Promo code not found" });
      return;
    }

    // Check for duplicate code if changing
    if (code && code.toUpperCase() !== existing.code) {
      const [duplicate] = await db
        .select()
        .from(promoCodesTable)
        .where(eq(promoCodesTable.code, code.toUpperCase()));
      if (duplicate) {
        res.status(400).json({ error: "Promo code already exists" });
        return;
      }
    }

    try {
      const [updated] = await db
        .update(promoCodesTable)
        .set({
          code: code ? code.toUpperCase() : undefined,
          description: description !== undefined ? description : undefined,
          discountType: discountType || undefined,
          discountValue: discountValue ? Number(discountValue) : undefined,
          maxUses:
            maxUses !== undefined
              ? maxUses
                ? Number(maxUses)
                : null
              : undefined,
          expiresAt:
            expiresAt !== undefined
              ? expiresAt
                ? Math.floor(new Date(expiresAt).getTime() / 1000)
                : null
              : undefined,
          isActive: isActive !== undefined ? (isActive ? 1 : 0) : undefined,
          daysOfWeek: daysOfWeek !== undefined ? daysOfWeek : undefined,
          startHour:
            startHour !== undefined
              ? startHour
                ? Number(startHour)
                : null
              : undefined,
          endHour:
            endHour !== undefined
              ? endHour
                ? Number(endHour)
                : null
              : undefined,
          startDate:
            startDate !== undefined
              ? startDate
                ? Math.floor(new Date(startDate).getTime() / 1000)
                : null
              : undefined,
          endDate:
            endDate !== undefined
              ? endDate
                ? Math.floor(new Date(endDate).getTime() / 1000)
                : null
              : undefined,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(promoCodesTable.id, id))
        .returning();

      res.json({
        id: updated.id,
        code: updated.code,
        description: updated.description,
        discountType: updated.discountType,
        discountValue: updated.discountValue,
        maxUses: updated.maxUses,
        currentUses: updated.currentUses,
        expiresAt: updated.expiresAt
          ? new Date(updated.expiresAt * 1000).toISOString()
          : null,
        isActive: updated.isActive === 1,
        daysOfWeek: updated.daysOfWeek,
        startHour: updated.startHour,
        endHour: updated.endHour,
        startDate: updated.startDate
          ? new Date(updated.startDate * 1000).toISOString()
          : null,
        endDate: updated.endDate
          ? new Date(updated.endDate * 1000).toISOString()
          : null,
      });
    } catch (err: any) {
      console.error("Error updating promo code:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * DELETE /api/promo-codes/:id
 * Delete a promo code (admin only)
 */
router.delete(
  "/promo-codes/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const [existing] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Promo code not found" });
      return;
    }

    try {
      await db.delete(promoCodesTable).where(eq(promoCodesTable.id, id));
      res.json({ success: true, message: "Promo code deleted" });
    } catch (err: any) {
      console.error("Error deleting promo code:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * GET /api/promo-codes/:code
 * Validate and get promo code details
 */
router.get("/promo-codes/:code", async (req: Request, res: Response) => {
  const parsed = GetPromoCodeByCodeParams.safeParse({ code: req.params.code });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid code" });
    return;
  }

  const [promo] = await db
    .select()
    .from(promoCodesTable)
    .where(eq(promoCodesTable.code, req.params.code as string));

  if (!promo) {
    res.status(404).json({ error: "Promo code not found" });
    return;
  }

  // Check if code is active
  if (!promo.isActive) {
    res.status(400).json({ error: "Promo code is inactive" });
    return;
  }

  // Check if code has expired
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    res.status(400).json({ error: "Promo code has expired" });
    return;
  }

  // Check if code has reached max uses
  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    res.status(400).json({ error: "Promo code has reached max uses" });
    return;
  }

  const response = GetPromoCodeByCodeResponse.parse({
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    maxUses: promo.maxUses,
    currentUses: promo.currentUses,
    expiresAt: promo.expiresAt ? new Date(promo.expiresAt) : null,
  });

  res.json(response);
});

/**
 * PATCH /api/tabs/:id/apply-code
 * Apply a promo code to a tab
 */
router.patch("/tabs/:id/apply-code", async (req: Request, res: Response) => {
  const paramsCheck = ApplyPromoCodeToTabParams.safeParse({
    id: req.params.id,
  });
  if (!paramsCheck.success) {
    res.status(400).json({ error: "Invalid tab ID" });
    return;
  }

  const bodyCheck = ApplyPromoCodeToTabBody.safeParse(req.body);
  if (!bodyCheck.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { promoCode } = bodyCheck.data;

  // Get tab
  const [tab] = await db
    .select()
    .from(tabsTable)
    .where(eq(tabsTable.id, req.params.id as string));

  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }

  // Get promo code
  const [promo] = await db
    .select()
    .from(promoCodesTable)
    .where(eq(promoCodesTable.code, promoCode));

  if (!promo) {
    res.status(404).json({ error: "Promo code not found" });
    return;
  }

  // Validate promo code
  if (!promo.isActive) {
    res.status(400).json({ error: "Promo code is inactive" });
    return;
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    res.status(400).json({ error: "Promo code has expired" });
    return;
  }

  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    res.status(400).json({ error: "Promo code has reached max uses" });
    return;
  }

  // Calculate discount
  let discountMxn = 0;
  if (promo.discountType === "percentage") {
    discountMxn = (tab.totalMxn * promo.discountValue) / 100;
  } else if (promo.discountType === "fixed_amount") {
    discountMxn = promo.discountValue;
  }

  // Ensure discount doesn't exceed tab total
  if (discountMxn > tab.totalMxn) {
    discountMxn = tab.totalMxn;
  }

  // Update tab and promo code in transaction
  const result = await db.transaction(async (tx) => {
    // Update tab with discount
    await tx
      .update(tabsTable)
      .set({
        discountMxn,
        promoCodeId: promo.id,
      })
      .where(eq(tabsTable.id, tab.id));

    // Increment promo code usage
    await tx
      .update(promoCodesTable)
      .set({
        currentUses: sql`${promoCodesTable.currentUses} + 1`,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(promoCodesTable.id, promo.id));

    // Log event
    await logEvent({
      userId: tab.staffUserId,
      entityType: "tab",
      entityId: tab.id,
      action: "apply_promo_code",
      newValue: {
        promoCode,
        discountMxn,
      },
    });

    return { discountMxn, promoCodeId: promo.id };
  });

  const response = ApplyPromoCodeToTabResponse.parse({
    id: tab.id,
    discountMxn: result.discountMxn,
    promoCodeId: result.promoCodeId,
  });

  res.json(response);
});

export default router;
