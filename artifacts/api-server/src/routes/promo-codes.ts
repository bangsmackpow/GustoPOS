import { Router, type IRouter, type Request, type Response } from "express";
import { db, promoCodesTable, tabsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  GetPromoCodesCodeParams,
  GetPromoCodesCodeResponse,
  PatchTabsIdApplyCodeParams,
  PatchTabsIdApplyCodeBody,
  PatchTabsIdApplyCodeResponse,
} from "@workspace/api-zod";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

/**
 * GET /api/promo-codes/:code
 * Validate and get promo code details
 */
router.get("/promo-codes/:code", async (req: Request, res: Response) => {
  const parsed = GetPromoCodesCodeParams.safeParse({ code: req.params.code });
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

  const response = GetPromoCodesCodeResponse.parse({
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
  const paramsCheck = PatchTabsIdApplyCodeParams.safeParse({
    id: req.params.id,
  });
  if (!paramsCheck.success) {
    res.status(400).json({ error: "Invalid tab ID" });
    return;
  }

  const bodyCheck = PatchTabsIdApplyCodeBody.safeParse(req.body);
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
        updatedAt: new Date(),
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

  const response = PatchTabsIdApplyCodeResponse.parse({
    id: tab.id,
    discountMxn: result.discountMxn,
    promoCodeId: result.promoCodeId,
  });

  res.json(response);
});

export default router;
