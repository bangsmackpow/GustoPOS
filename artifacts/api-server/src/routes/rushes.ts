import { Router, type IRouter, type Request, type Response } from "express";
import { db, rushesTable } from "@workspace/db";
import { desc, and, gte, eq } from "drizzle-orm";

const router: IRouter = Router();

function formatRush(r: typeof rushesTable.$inferSelect) {
  return {
    ...r,
  };
}

function generateRecurringEvents(
  baseStartTime: number,
  baseEndTime: number | null,
  repeatEvent: number,
): { startTime: number; endTime: number | null }[] {
  const events: { startTime: number; endTime: number | null }[] = [];
  const start = baseStartTime;
  const end = baseEndTime;

  switch (repeatEvent) {
    case 1: // Weekly
      for (let i = 0; i < 52; i++) {
        events.push({
          startTime: start + i * 7 * 24 * 60 * 60,
          endTime: end ? end + i * 7 * 24 * 60 * 60 : null,
        });
      }
      break;
    case 2: // Monthly
      for (let i = 0; i < 12; i++) {
        const date = new Date(start * 1000);
        date.setMonth(date.getMonth() + i);
        events.push({
          startTime: Math.floor(date.getTime() / 1000),
          endTime: end
            ? (() => {
                const e = new Date(end * 1000);
                e.setMonth(e.getMonth() + i);
                return Math.floor(e.getTime() / 1000);
              })()
            : null,
        });
      }
      break;
    case 3: // Daily
      for (let i = 0; i < 30; i++) {
        events.push({
          startTime: start + i * 24 * 60 * 60,
          endTime: end ? end + i * 24 * 60 * 60 : null,
        });
      }
      break;
    default:
      events.push({ startTime: start, endTime: end });
  }

  return events;
}

router.get("/rushes", async (req: Request, res: Response) => {
  try {
    const includePast = req.query.includePast === "true";
    const days = Math.min(
      Math.max(parseInt(req.query.days as string) || 7, 1),
      365,
    );
    const now = Math.floor(Date.now() / 1000);
    const futureWindow = now + days * 24 * 60 * 60;

    let rushes;
    if (includePast) {
      // Show all past and future events when includePast is true
      rushes = await db
        .select()
        .from(rushesTable)
        .orderBy(desc(rushesTable.startTime));
    } else {
      // Default: show events in the next X days (default 7 days)
      rushes = await db
        .select()
        .from(rushesTable)
        .where(
          and(
            gte(rushesTable.startTime, now),
            gte(rushesTable.startTime, futureWindow),
          ),
        )
        .orderBy(desc(rushesTable.startTime));
    }

    res.json(rushes.map(formatRush));
  } catch (err: any) {
    console.error("[Rushes] List error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/rushes", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      repeatEvent = 0,
      impact,
      type,
    } = req.body;

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
      return res.status(400).json({
        error: "Valid type is required (cruise, festival, music, other)",
      });
    }
    if (![0, 1, 2, 3].includes(repeatEvent)) {
      return res.status(400).json({
        error:
          "Valid repeatEvent required (0=never, 1=weekly, 2=monthly, 3=daily)",
      });
    }

    let startTimeUnix: number;
    let endTimeUnix: number | null = null;

    if (typeof startTime === "string") {
      const parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ error: "Invalid start time format" });
      }
      startTimeUnix = Math.floor(parsedStartTime.getTime() / 1000);
    } else if (typeof startTime === "number") {
      startTimeUnix = startTime;
    } else {
      return res
        .status(400)
        .json({ error: "Start time must be string or integer" });
    }

    if (endTime) {
      if (typeof endTime === "string") {
        const parsedEndTime = new Date(endTime);
        if (isNaN(parsedEndTime.getTime())) {
          return res.status(400).json({ error: "Invalid end time format" });
        }
        endTimeUnix = Math.floor(parsedEndTime.getTime() / 1000);
      } else if (typeof endTime === "number") {
        endTimeUnix = endTime;
      }
    }

    const recurringEvents = generateRecurringEvents(
      startTimeUnix,
      endTimeUnix,
      repeatEvent,
    );

    const createdRushes = await db
      .insert(rushesTable)
      .values(
        recurringEvents.map((event) => ({
          title,
          description: description || null,
          startTime: event.startTime,
          endTime: event.endTime,
          repeatEvent,
          impact: impact as any,
          type: type as any,
        })),
      )
      .returning();

    return res.status(201).json(createdRushes.map(formatRush));
  } catch (err: any) {
    console.error("[Rushes] Create error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

router.delete("/rushes/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const deleted = await db
      .delete(rushesTable)
      .where(eq(rushesTable.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: "Rush event not found" });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[Rushes] Delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
