import express from "express";
import type { Request, Response } from "express";
// pg is loaded lazily at runtime to avoid bundling it in CI builds
import fs from "fs";
import path from "path";

// Development admin seed endpoint
export default function adminSeedRouter(): express.Router {
  const router = express.Router();
  router.post("/seed-admin", async (req: Request, res: Response) => {
    const enabled =
      (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
    if (!enabled) {
      return res.status(403).json({ ok: false, error: "seed disabled" });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res
        .status(500)
        .json({ ok: false, error: "DATABASE_URL not configured" });
    }
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString });
    try {
      const seedSqlPath = path.resolve(
        __dirname,
        "../../../../db/seeds/insert-admin.sql",
      );
      const sql = fs.readFileSync(seedSqlPath, "utf8");
      await pool.query(sql);
      res.json({ ok: true, message: "admin seeded" });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message ?? e) });
    } finally {
      await pool.end();
    }
  });
  return router;
}
