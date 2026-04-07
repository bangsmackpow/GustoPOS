import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/ready", async (_req: Request, res: Response) => {
  try {
    await db.run(sql`SELECT 1`);
    res.json({ status: "ok", database: "connected" });
  } catch (err: any) {
    res
      .status(503)
      .json({ status: "error", database: "disconnected", error: err.message });
  }
});

export default router;
