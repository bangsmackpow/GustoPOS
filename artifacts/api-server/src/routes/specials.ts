import { Router, type IRouter, type Request, type Response } from "express";
import { db, specialsTable, drinksTable } from "@workspace/db";
import { eq, sql, desc, or, and, inArray } from "drizzle-orm";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

function isSpecialActive(special: typeof specialsTable.$inferSelect): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const nowUnix = Math.floor(now.getTime() / 1000);

  if (special.isActive !== 1) return false;

  if (special.daysOfWeek) {
    const days = special.daysOfWeek
      .split(",")
      .map((d) => parseInt(d.trim(), 10));
    if (!days.includes(dayOfWeek)) return false;
  }

  if (special.startHour !== null && special.startHour !== undefined) {
    if (hour < special.startHour) return false;
  }

  if (special.endHour !== null && special.endHour !== undefined) {
    if (hour > special.endHour) return false;
  }

  if (special.startDate && nowUnix < special.startDate) return false;

  if (special.endDate && nowUnix > special.endDate) return false;

  return true;
}

function calculateDiscount(
  basePrice: number,
  discountType: string,
  discountValue: number,
): number {
  if (discountType === "percentage") {
    return (basePrice * discountValue) / 100;
  }
  return discountValue;
}

/**
 * GET /api/specials/active
 * Get all currently active specials
 */
router.get("/specials/active", async (_req: Request, res: Response) => {
  try {
    const allSpecials = await db.select().from(specialsTable);

    const activeSpecials = allSpecials.filter(isSpecialActive).map((s) => ({
      id: s.id,
      drinkId: s.drinkId,
      category: s.category,
      specialType: s.specialType,
      discountType: s.discountType,
      discountValue: s.discountValue,
      name: s.name,
    }));

    res.json(activeSpecials);
  } catch (err: any) {
    console.error("Error getting active specials:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/specials
 * List all specials (admin only)
 */
router.get(
  "/specials",
  requireRole("admin"),
  async (_req: Request, res: Response) => {
    try {
      const specials = await db
        .select()
        .from(specialsTable)
        .orderBy(desc(specialsTable.createdAt));

      const specialsWithDrinkNames = await Promise.all(
        specials.map(async (s) => {
          let drinkName = null;
          if (s.drinkId) {
            const [drink] = await db
              .select({ name: drinksTable.name })
              .from(drinksTable)
              .where(eq(drinksTable.id, s.drinkId));
            drinkName = drink?.name || null;
          }

          return {
            id: s.id,
            drinkId: s.drinkId,
            drinkName,
            category: s.category,
            specialType: s.specialType,
            discountType: s.discountType,
            discountValue: s.discountValue,
            daysOfWeek: s.daysOfWeek,
            startHour: s.startHour,
            endHour: s.endHour,
            startDate: s.startDate
              ? new Date(s.startDate * 1000).toISOString()
              : null,
            endDate: s.endDate
              ? new Date(s.endDate * 1000).toISOString()
              : null,
            isActive: s.isActive === 1,
            name: s.name,
            isCurrentlyActive: isSpecialActive(s),
            createdAt: new Date(s.createdAt * 1000).toISOString(),
          };
        }),
      );

      res.json(specialsWithDrinkNames);
    } catch (err: any) {
      console.error("Error listing specials:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * POST /api/specials
 * Create a new special (admin only)
 */
router.post(
  "/specials",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const {
      drinkId,
      category,
      specialType,
      discountType,
      discountValue,
      daysOfWeek,
      startHour,
      endHour,
      startDate,
      endDate,
      name,
    } = req.body;

    if (!discountType || !discountValue) {
      res
        .status(400)
        .json({ error: "discountType and discountValue are required" });
      return;
    }

    if (!["percentage", "fixed_amount"].includes(discountType)) {
      res
        .status(400)
        .json({ error: "discountType must be 'percentage' or 'fixed_amount'" });
      return;
    }

    const validTypes = ["manual", "happy_hour", "promotional", "bundle"];
    if (specialType && !validTypes.includes(specialType)) {
      res.status(400).json({
        error: `specialType must be one of: ${validTypes.join(", ")}`,
      });
      return;
    }

    try {
      const [special] = await db
        .insert(specialsTable)
        .values({
          drinkId: drinkId || null,
          category: category || null,
          specialType: specialType || "manual",
          discountType,
          discountValue: Number(discountValue),
          daysOfWeek: daysOfWeek || null,
          startHour: startHour !== undefined ? Number(startHour) : null,
          endHour: endHour !== undefined ? Number(endHour) : null,
          startDate: startDate
            ? Math.floor(new Date(startDate).getTime() / 1000)
            : null,
          endDate: endDate
            ? Math.floor(new Date(endDate).getTime() / 1000)
            : null,
          name: name || null,
          isActive: 1,
        })
        .returning();

      res.json({
        id: special.id,
        drinkId: special.drinkId,
        category: special.category,
        specialType: special.specialType,
        discountType: special.discountType,
        discountValue: special.discountValue,
        daysOfWeek: special.daysOfWeek,
        startHour: special.startHour,
        endHour: special.endHour,
        startDate: special.startDate
          ? new Date(special.startDate * 1000).toISOString()
          : null,
        endDate: special.endDate
          ? new Date(special.endDate * 1000).toISOString()
          : null,
        isActive: special.isActive === 1,
        name: special.name,
        createdAt: new Date(special.createdAt * 1000).toISOString(),
      });
    } catch (err: any) {
      console.error("Error creating special:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * PATCH /api/specials/:id
 * Update a special (admin only)
 */
router.patch(
  "/specials/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const {
      drinkId,
      category,
      specialType,
      discountType,
      discountValue,
      daysOfWeek,
      startHour,
      endHour,
      startDate,
      endDate,
      isActive,
      name,
    } = req.body;

    const [existing] = await db
      .select()
      .from(specialsTable)
      .where(eq(specialsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Special not found" });
      return;
    }

    try {
      const [updated] = await db
        .update(specialsTable)
        .set({
          drinkId: drinkId !== undefined ? drinkId || null : undefined,
          category: category !== undefined ? category || null : undefined,
          specialType: specialType || undefined,
          discountType: discountType || undefined,
          discountValue: discountValue ? Number(discountValue) : undefined,
          daysOfWeek: daysOfWeek !== undefined ? daysOfWeek : undefined,
          startHour:
            startHour !== undefined
              ? startHour !== null
                ? Number(startHour)
                : null
              : undefined,
          endHour:
            endHour !== undefined
              ? endHour !== null
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
          isActive: isActive !== undefined ? (isActive ? 1 : 0) : undefined,
          name: name !== undefined ? name : undefined,
        })
        .where(eq(specialsTable.id, id))
        .returning();

      res.json({
        id: updated.id,
        drinkId: updated.drinkId,
        category: updated.category,
        specialType: updated.specialType,
        discountType: updated.discountType,
        discountValue: updated.discountValue,
        daysOfWeek: updated.daysOfWeek,
        startHour: updated.startHour,
        endHour: updated.endHour,
        startDate: updated.startDate
          ? new Date(updated.startDate * 1000).toISOString()
          : null,
        endDate: updated.endDate
          ? new Date(updated.endDate * 1000).toISOString()
          : null,
        isActive: updated.isActive === 1,
        name: updated.name,
      });
    } catch (err: any) {
      console.error("Error updating special:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * DELETE /api/specials/:id
 * Delete a special (admin only)
 */
router.delete(
  "/specials/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const [existing] = await db
      .select()
      .from(specialsTable)
      .where(eq(specialsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Special not found" });
      return;
    }

    try {
      await db.delete(specialsTable).where(eq(specialsTable.id, id));
      res.json({ success: true, message: "Special deleted" });
    } catch (err: any) {
      console.error("Error deleting special:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
