import express from "express";
import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Development admin seed endpoint
export default function adminSeedRouter(): express.Router {
  const router = express.Router();
  router.post("/seed-admin", async (req: Request, res: Response) => {
    const enabled =
      (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
    if (!enabled) {
      return res.status(403).json({ ok: false, error: "seed disabled" });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ ok: false, error: "ADMIN_EMAIL not configured" });
    }

    try {
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
        // Update existing admin pin if it's different
        await db.update(usersTable)
          .set({ pin: adminPin, role: "admin", isActive: true })
          .where(eq(usersTable.email, adminEmail));
        return res.json({ ok: true, message: `Admin user updated: ${adminEmail}` });
      }
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: String(e?.message ?? e) });
    }
  });
  return router;
}
