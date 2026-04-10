import { Router, type IRouter, type Request, type Response } from "express";
import { db, rushesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
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
  const rushes = await db
    .select()
    .from(rushesTable)
    .orderBy(desc(rushesTable.startTime));
  res.json(rushes.map(formatRush));
});

router.post("/rushes", async (req: Request, res: Response) => {
  try {
    // Manually validate and parse the request body
    const { title, description, startTime, endTime, impact, type } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!startTime) {
      return res.status(400).json({ error: "Start time is required" });
    }
    if (!impact || !["low", "medium", "high"].includes(impact)) {
      return res
        .status(400)
        .json({ error: "Valid impact is required (low, medium, high)" });
    }
    if (!type || !["cruise", "festival", "music", "other"].includes(type)) {
      return res
        .status(400)
        .json({
          error: "Valid type is required (cruise, festival, music, other)",
        });
    }

    // Parse dates from strings (ISO format from datetime-local input)
    const parsedStartTime = new Date(startTime);
    if (isNaN(parsedStartTime.getTime())) {
      return res.status(400).json({ error: "Invalid start time format" });
    }

    const parsedEndTime = endTime ? new Date(endTime) : null;
    if (endTime && parsedEndTime && isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ error: "Invalid end time format" });
    }

    const [rush] = await db
      .insert(rushesTable)
      .values({
        title,
        description: description || null,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        impact: impact as any,
        type: type as any,
      } as typeof rushesTable.$inferInsert)
      .returning();

    return res.status(201).json(formatRush(rush));
  } catch (err: any) {
    console.error("[Rushes] Create error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

export default router;
