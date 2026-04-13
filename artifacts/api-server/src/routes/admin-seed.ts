import express from "express";
import type { Request, Response } from "express";
import { sensitiveLimiter } from "../lib/rateLimiter";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Development starter data seed endpoint
export default function adminSeedRouter(): express.Router {
  const router = express.Router();

  router.post(
    "/seed-admin",
    sensitiveLimiter,
    async (req: Request, res: Response) => {
      const enabled =
        (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
      if (!enabled)
        return res.status(403).json({ ok: false, error: "seed disabled" });

      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail)
        return res
          .status(500)
          .json({ ok: false, error: "ADMIN_EMAIL not configured" });

      try {
        const { usersTable } = await import("@workspace/db");
        const { eq } = await import("drizzle-orm");
        const adminPin = process.env.ADMIN_PIN || "0000";
        const existing = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, adminEmail));

        if (existing.length === 0) {
          await db.insert(usersTable).values({
            username: adminEmail.split("@")[0],
            email: adminEmail,
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            language: "en",
            pin: adminPin,
            isActive: 1,
          });
          return res.json({
            ok: true,
            message: `Admin user created: ${adminEmail}`,
          });
        } else {
          await db
            .update(usersTable)
            .set({ pin: adminPin, role: "admin", isActive: 1 })
            .where(eq(usersTable.email, adminEmail));
          return res.json({
            ok: true,
            message: `Admin user updated: ${adminEmail}`,
          });
        }
      } catch (e: any) {
        return res
          .status(500)
          .json({ ok: false, error: String(e?.message ?? e) });
      }
    },
  );

  router.post("/seed-starter", async (req: Request, res: Response) => {
    try {
      const sqlPath = process.env.SEEDS_PATH
        ? path.join(process.env.SEEDS_PATH, "puerto-vallarta-starter.sql")
        : process.env.NODE_ENV === "production"
          ? "/app/db/seeds/puerto-vallarta-starter.sql"
          : path.resolve(
              __dirname,
              "../../../../db/seeds/puerto-vallarta-starter.sql",
            );

      console.log(`Loading seed from: ${sqlPath}`);

      if (!fs.existsSync(sqlPath)) {
        return res.status(500).json({
          ok: false,
          error: `Seed file not found: ${sqlPath}`,
        });
      }

      const rawSql = fs.readFileSync(sqlPath, "utf8");

      // Split by semicolon and filter out empty strings to run each statement individually
      const statements = rawSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      console.log(`Executing ${statements.length} SQL statements...`);

      // Get raw client from db to execute SQL directly
      const { client } = await import("@workspace/db");

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await client.execute({ sql: statement, args: [] });
        } catch (stmtError: any) {
          console.error(`Statement ${i + 1} failed:`, stmtError.message);
          // Continue with other statements - some may fail due to duplicates
        }
      }

      console.log("Seed completed successfully");
      return res.json({
        ok: true,
        message: "Starter data seeded successfully",
      });
    } catch (e: any) {
      console.error("Seed error:", e);
      return res
        .status(500)
        .json({ ok: false, error: String(e?.message ?? e) });
    }
  });

  return router;
}
