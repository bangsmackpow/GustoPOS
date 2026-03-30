import express from "express";
import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { createSession, SESSION_COOKIE, SESSION_TTL, type SessionData } from "../lib/auth";

export default function pinLoginRouter(): express.Router {
  const router = express.Router();
  
  router.post("/pin-login", async (req: Request, res: Response) => {
    const email = req.body?.email;
    const pin = req.body?.pin;

    if (!email || !pin) {
      return res.status(400).json({ ok: false, error: "Email and PIN are required" });
    }

    try {
      // Find active user with matching email and PIN
      const [dbUser] = await db.select().from(usersTable).where(
        and(
          eq(usersTable.email, email),
          eq(usersTable.pin, pin),
          eq(usersTable.isActive, true)
        )
      );

      if (!dbUser) {
        return res.status(401).json({ ok: false, error: "Invalid PIN or email" });
      }

      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          language: dbUser.language,
          isActive: true,
        },
        createdAt: Date.now(),
      };

      const sid = await createSession(sessionData);
      const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

      res.cookie(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL,
      });

      return res.status(200).json({ ok: true, user: sessionData.user });
    } catch (err: any) {
      console.error("[PinLogin] Error:", err.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  return router;
}
