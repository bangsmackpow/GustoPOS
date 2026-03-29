import express from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Development starter data seed endpoint
export default function adminSeedRouter(): express.Router {
  const router = express.Router();
  
  router.post("/seed-admin", async (req: Request, res: Response) => {
    const enabled = (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
    if (!enabled) return res.status(403).json({ ok: false, error: "seed disabled" });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ ok: false, error: "ADMIN_EMAIL not configured" });

    try {
      const { usersTable } = await import("@workspace/db");
      const { eq } = await import("drizzle-orm");
      const adminPin = process.env.ADMIN_PIN || "0000";
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
      
      if (existing.length === 0) {
        await db.insert(usersTable).values({
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          language: "en",
          pin: adminPin,
          isActive: true,
        });
        return res.json({ ok: true, message: `Admin user created: ${adminEmail}` });
      } else {
        await db.update(usersTable).set({ pin: adminPin, role: "admin", isActive: true }).where(eq(usersTable.email, adminEmail));
        return res.json({ ok: true, message: `Admin user updated: ${adminEmail}` });
      }
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: String(e?.message ?? e) });
    }
  });

  router.post("/seed-starter", async (req: Request, res: Response) => {
    const enabled = (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
    if (!enabled) return res.status(403).json({ ok: false, error: "seed disabled" });

    try {
      const sqlPath = process.env.NODE_ENV === 'production'
        ? "/app/db/seeds/puerto-vallarta-starter.sql"
        : path.resolve(__dirname, "../../../../db/seeds/puerto-vallarta-starter.sql");
      
      console.log(`Loading seed from: ${sqlPath}`);
      const rawSql = fs.readFileSync(sqlPath, "utf8");
      
      // Split by semicolon and filter out empty strings to run each statement individually
      // This is more reliable for raw SQL execution in some drivers
      const statements = rawSql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await db.run(sql.raw(statement));
      }
      
      return res.json({ ok: true, message: "Starter data seeded successfully" });
    } catch (e: any) {
      console.error("Seed error:", e);
      return res.status(500).json({ ok: false, error: String(e?.message ?? e) });
    }
  });

  return router;
}
