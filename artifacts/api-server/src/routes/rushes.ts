import { Router, type IRouter, type Request, type Response } from "express";
import { db, rushesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { PostRushesBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatRush(r: typeof rushesTable.$inferSelect) {
  return {
    ...r,
    startTime: r.startTime.toISOString(),
    endTime: r.endTime?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/rushes", async (req: Request, res: Response) => {
  const rushes = await db.select().from(rushesTable).orderBy(desc(rushesTable.startTime));
  res.json(rushes.map(formatRush));
});

router.post("/rushes", async (req: Request, res: Response) => {
  const parsed = PostRushesBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
  }

  try {
    const [rush] = await db.insert(rushesTable).values({
      title: parsed.data.title,
      description: parsed.data.description,
      startTime: new Date(parsed.data.startTime),
      endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null,
      impact: parsed.data.impact as any,
      type: parsed.data.type as any,
    } as typeof rushesTable.$inferInsert).returning();

    return res.status(201).json(formatRush(rush));
  } catch (err: any) {
    console.error("Failed to create rush:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/rushes/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(rushesTable).where(eq(rushesTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
