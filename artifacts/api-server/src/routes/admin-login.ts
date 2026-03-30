import express from "express";
import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { createSession, SESSION_COOKIE, SESSION_TTL, type SessionData } from "../lib/auth";

export default function adminLoginRouter(): express.Router {
  const router = express.Router();
  
  router.post("/admin/login", async (req: Request, res: Response) => {
    const enabled = (process.env.ADMIN_LOGIN_ENABLED || "true").toLowerCase() === "true";
    if (!enabled) {
      return res.status(403).json({ ok: false, error: "admin login disabled" });
    }

    const email = req.body?.email;
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required" });
    }

    try {
      console.log(`[AdminLogin] Login attempt for: ${email}`);
      
      // Query database for user (unifies Env Admin and DB Managers)
      const [dbUser] = await db.select().from(usersTable).where(
        and(
          eq(usersTable.email, email),
          eq(usersTable.password, password),
          eq(usersTable.isActive, true)
        )
      );

      if (!dbUser) {
        console.warn(`[AdminLogin] No matching active user found for: ${email}`);
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
      }

      // Check if user has management permissions
      const hasAccess = ["admin", "manager", "head_bartender"].includes(dbUser.role);
      if (!hasAccess) {
        console.warn(`[AdminLogin] User ${email} has insufficient role: ${dbUser.role}`);
        return res.status(403).json({ ok: false, error: "Insufficient permissions" });
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
      
      // Smart Secure flag: only use secure cookies if we are on HTTPS
      const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
      
      res.cookie(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax", // Most compatible for local networks
        path: "/",
        maxAge: SESSION_TTL,
      });

      console.log(`[AdminLogin] Success! Token issued for: ${email}`);
      return res.status(200).json({ ok: true, user: sessionData.user });

    } catch (err: any) {
      console.error("[AdminLogin] Critical Error:", err.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  return router;
}
