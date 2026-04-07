import { Router, type IRouter, type Request, type Response } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    baseCurrency: "MXN" as const,
    usdToMxnRate: Number(s.usdToMxnRate),
    cadToMxnRate: Number(s.cadToMxnRate),
    defaultMarkupFactor: Number(s.defaultMarkupFactor),
    barName: s.barName,
    barIcon: s.barIcon,
    inventoryAlertEmail: s.inventoryAlertEmail ?? null,
    enableLitestream: s.enableLitestream,
    enableUsbBackup: s.enableUsbBackup,
    pinLockTimeoutMin: s.pinLockTimeoutMin ?? 5,
  };
}

async function ensureSettings() {
  const [existing] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, "default"));
  if (existing) return existing;
  const [created] = await db
    .insert(settingsTable)
    .values({ id: "default" })
    .returning();
  return created;
}

router.get("/", async (req: Request, res: Response) => {
  const settings = await ensureSettings();
  res.json(formatSettings(settings));
});

// PATCH requires admin role
router.patch("/", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const parsed = UpdateSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      console.warn("Settings validation failed:", parsed.error.format());
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.format(),
      });
    }
    const data = parsed.data;
    await ensureSettings();
    const updateData: Partial<typeof settingsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.usdToMxnRate != null)
      updateData.usdToMxnRate = Number(data.usdToMxnRate);
    if (data.cadToMxnRate != null)
      updateData.cadToMxnRate = Number(data.cadToMxnRate);
    if (data.defaultMarkupFactor != null)
      updateData.defaultMarkupFactor = Number(data.defaultMarkupFactor);
    if (data.barName != null) updateData.barName = data.barName;
    if (data.barIcon != null) updateData.barIcon = data.barIcon;

    if (data.inventoryAlertEmail !== undefined)
      updateData.inventoryAlertEmail = data.inventoryAlertEmail || null;

    if (data.enableLitestream !== undefined)
      updateData.enableLitestream = data.enableLitestream ?? false;
    if (data.enableUsbBackup !== undefined)
      updateData.enableUsbBackup = data.enableUsbBackup ?? false;
    if (data.pinLockTimeoutMin !== undefined)
      updateData.pinLockTimeoutMin = Number(data.pinLockTimeoutMin) || 5;

    const [settings] = await db
      .update(settingsTable)
      .set(updateData)
      .where(eq(settingsTable.id, "default"))
      .returning();
    return res.json(formatSettings(settings));
  } catch (err: any) {
    console.error("Failed to update settings:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

export default router;
