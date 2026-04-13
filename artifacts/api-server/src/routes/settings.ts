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
    defaultMarkupFactor: s.defaultMarkupFactor ?? 3.0,
    barName: s.barName,
    barIcon: s.barIcon,
    inventoryAlertEmail: s.inventoryAlertEmail ?? null,
    smtpHost: s.smtpHost ?? "",
    smtpPort: s.smtpPort ?? 587,
    smtpUser: s.smtpUser ?? "",
    smtpPassword: s.smtpPassword ?? "",
    smtpFromEmail: s.smtpFromEmail ?? "",
    enableLitestream: Boolean(s.enableLitestream),
    enableUsbBackup: Boolean(s.enableUsbBackup),
    pinLockTimeoutMin: s.pinLockTimeoutMin ?? 5,
    autoBackupEnabled: Boolean(s.autoBackupEnabled),
    autoBackupIntervalMin: s.autoBackupIntervalMin ?? 15,
    maxAutoBackups: s.maxAutoBackups ?? 5,
    lastAutoBackup: s.lastAutoBackup
      ? new Date(s.lastAutoBackup * 1000).toISOString()
      : null,
    lastDailyBackup: s.lastDailyBackup
      ? new Date(s.lastDailyBackup * 1000).toISOString()
      : null,
    lastWeeklyBackup: s.lastWeeklyBackup
      ? new Date(s.lastWeeklyBackup * 1000).toISOString()
      : null,
    defaultAlcoholDensity: s.defaultAlcoholDensity ?? 0.94,
    defaultServingSizeMl: s.defaultServingSizeMl ?? 44.36,
    defaultBottleSizeMl: s.defaultBottleSizeMl ?? 750,
    defaultUnitsPerCase: s.defaultUnitsPerCase ?? 1,
    defaultLowStockThreshold: s.defaultLowStockThreshold ?? 0,
    defaultTrackingMode: s.defaultTrackingMode ?? "auto",
    defaultAuditMethod: s.defaultAuditMethod ?? "auto",
    varianceWarningThreshold: s.varianceWarningThreshold ?? 5.0,
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
      updatedAt: Math.floor(Date.now() / 1000),
    };

    if (data.usdToMxnRate != null)
      updateData.usdToMxnRate = Number(data.usdToMxnRate);
    if (data.cadToMxnRate != null)
      updateData.cadToMxnRate = Number(data.cadToMxnRate);
    if (data.barName != null) updateData.barName = data.barName;
    if (data.barIcon != null) updateData.barIcon = data.barIcon;

    if (data.inventoryAlertEmail !== undefined)
      updateData.inventoryAlertEmail = data.inventoryAlertEmail || null;

    if (data.enableLitestream !== undefined)
      updateData.enableLitestream = data.enableLitestream ? 1 : 0;
    if (data.enableUsbBackup !== undefined)
      updateData.enableUsbBackup = data.enableUsbBackup ? 1 : 0;
    if (data.pinLockTimeoutMin !== undefined)
      updateData.pinLockTimeoutMin = Number(data.pinLockTimeoutMin) || 5;
    if (data.autoBackupEnabled !== undefined)
      updateData.autoBackupEnabled = data.autoBackupEnabled ? 1 : 0;
    if (data.autoBackupIntervalMin !== undefined)
      updateData.autoBackupIntervalMin =
        Number(data.autoBackupIntervalMin) || 15;
    if (data.maxAutoBackups !== undefined)
      updateData.maxAutoBackups = Number(data.maxAutoBackups) || 5;

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

router.get("/settings/defaults", async (req: Request, res: Response) => {
  try {
    const settings = await ensureSettings();
    return res.json({
      defaultAlcoholDensity: settings.defaultAlcoholDensity ?? 0.94,
      defaultServingSizeMl: settings.defaultServingSizeMl ?? 44.36,
      defaultBottleSizeMl: settings.defaultBottleSizeMl ?? 750,
      defaultUnitsPerCase: settings.defaultUnitsPerCase ?? 1,
      defaultLowStockThreshold: settings.defaultLowStockThreshold ?? 0,
      defaultTrackingMode: settings.defaultTrackingMode ?? "auto",
      defaultAuditMethod: settings.defaultAuditMethod ?? "auto",
      varianceWarningThreshold: settings.varianceWarningThreshold ?? 5.0,
    });
  } catch (err: any) {
    console.error("Failed to get system defaults:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

router.patch(
  "/settings/defaults",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const updateData: Partial<typeof settingsTable.$inferInsert> = {};

      if (data.defaultAlcoholDensity !== undefined)
        updateData.defaultAlcoholDensity =
          Number(data.defaultAlcoholDensity) || 0.94;
      if (data.defaultServingSizeMl !== undefined)
        updateData.defaultServingSizeMl =
          Number(data.defaultServingSizeMl) || 44.36;
      if (data.defaultBottleSizeMl !== undefined)
        updateData.defaultBottleSizeMl =
          Number(data.defaultBottleSizeMl) || 750;
      if (data.defaultUnitsPerCase !== undefined)
        updateData.defaultUnitsPerCase = Number(data.defaultUnitsPerCase) || 1;
      if (data.defaultLowStockThreshold !== undefined)
        updateData.defaultLowStockThreshold =
          Number(data.defaultLowStockThreshold) || 0;
      if (data.defaultTrackingMode !== undefined)
        updateData.defaultTrackingMode = data.defaultTrackingMode;
      if (data.defaultAuditMethod !== undefined)
        updateData.defaultAuditMethod = data.defaultAuditMethod;
      if (data.varianceWarningThreshold !== undefined)
        updateData.varianceWarningThreshold =
          Number(data.varianceWarningThreshold) || 5.0;

      const [settings] = await db
        .update(settingsTable)
        .set(updateData)
        .where(eq(settingsTable.id, "default"))
        .returning();

      return res.json({
        defaultAlcoholDensity: settings.defaultAlcoholDensity ?? 0.94,
        defaultServingSizeMl: settings.defaultServingSizeMl ?? 44.36,
        defaultBottleSizeMl: settings.defaultBottleSizeMl ?? 750,
        defaultUnitsPerCase: settings.defaultUnitsPerCase ?? 1,
        defaultLowStockThreshold: settings.defaultLowStockThreshold ?? 0,
        defaultTrackingMode: settings.defaultTrackingMode ?? "auto",
        defaultAuditMethod: settings.defaultAuditMethod ?? "auto",
        varianceWarningThreshold: settings.varianceWarningThreshold ?? 5.0,
      });
    } catch (err: any) {
      console.error("Failed to update system defaults:", err);
      return res
        .status(500)
        .json({ error: "Internal server error", message: err.message });
    }
  },
);

export default router;
