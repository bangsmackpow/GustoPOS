import { Router, type IRouter, type Request, type Response } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    baseCurrency: "MXN" as const,
    usdToMxnRate: Number(s.usdToMxnRate),
    cadToMxnRate: Number(s.cadToMxnRate),
    defaultMarkupFactor: Number(s.defaultMarkupFactor),
    barName: s.barName,
    barIcon: s.barIcon,
    smtpHost: s.smtpHost ?? null,
    smtpPort: s.smtpPort ?? null,
    smtpUser: s.smtpUser ?? null,
    smtpPassword: s.smtpPassword ?? null,
    smtpFromEmail: s.smtpFromEmail ?? null,
    inventoryAlertEmail: s.inventoryAlertEmail ?? null,
    enableLitestream: s.enableLitestream,
    enableUsbBackup: s.enableUsbBackup,
  };
}

async function ensureSettings() {
  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.id, "default"));
  if (existing) return existing;
  const [created] = await db.insert(settingsTable).values({ id: "default" }).returning();
  return created;
}

router.get("/settings", async (req: Request, res: Response) => {
  const settings = await ensureSettings();
  res.json(formatSettings(settings));
});

router.patch("/settings", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      console.warn("Settings validation failed:", parsed.error.format());
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    }
    const data = parsed.data;
    await ensureSettings();
    const updateData: Partial<typeof settingsTable.$inferInsert> = { updatedAt: new Date() };
    
    if (data.usdToMxnRate != null) updateData.usdToMxnRate = Number(data.usdToMxnRate);
    if (data.cadToMxnRate != null) updateData.cadToMxnRate = Number(data.cadToMxnRate);
    if (data.defaultMarkupFactor != null) updateData.defaultMarkupFactor = Number(data.defaultMarkupFactor);
    if (data.barName != null) updateData.barName = data.barName;
    if (data.barIcon != null) updateData.barIcon = data.barIcon;
    
    // Handle empty strings as null for optional SMTP fields
    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost || null;
    if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort || null;
    if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser || null;
    if (data.smtpPassword !== undefined) updateData.smtpPassword = data.smtpPassword || null;
    if (data.smtpFromEmail !== undefined) updateData.smtpFromEmail = data.smtpFromEmail || null;
    if (data.inventoryAlertEmail !== undefined) updateData.inventoryAlertEmail = data.inventoryAlertEmail || null;

    if (data.enableLitestream !== undefined) updateData.enableLitestream = data.enableLitestream ?? false;
    if (data.enableUsbBackup !== undefined) updateData.enableUsbBackup = data.enableUsbBackup ?? false;

    const [settings] = await db.update(settingsTable).set(updateData).where(eq(settingsTable.id, "default")).returning();
    return res.json(formatSettings(settings));
  } catch (err: any) {
    console.error("Failed to update settings:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
});

export default router;
