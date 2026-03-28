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
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;
  await ensureSettings();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.usdToMxnRate != null) updateData.usdToMxnRate = String(data.usdToMxnRate);
  if (data.cadToMxnRate != null) updateData.cadToMxnRate = String(data.cadToMxnRate);
  if (data.defaultMarkupFactor != null) updateData.defaultMarkupFactor = String(data.defaultMarkupFactor);
  if (data.barName != null) updateData.barName = data.barName;

  const [settings] = await db.update(settingsTable).set(updateData).where(eq(settingsTable.id, "default")).returning();
  res.json(formatSettings(settings));
});

export default router;
