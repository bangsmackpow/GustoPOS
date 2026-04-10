import express from "express";
import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, SESSION_COOKIE, SESSION_TTL, type SessionData } from "../lib/auth";
import { loginLimiter } from "../lib/rateLimiter";

export default function adminLoginRouter(): express.Router {
  const router = express.Router();
  
  router.post("/admin/login", loginLimiter, async (req: Request, res: Response) => {
    const enabled = (process.env.ADMIN_LOGIN_ENABLED || "true").toLowerCase() === "true";
    if (!enabled) {
      return res.status(403).json({ ok: false, error: "admin login disabled" });
    }

    const username = req.body?.username;
    const password = req.body?.password;

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Username and password are required" });
    }

    try {
      console.log(`[AdminLogin] Login attempt for: ${username}`);
      
      // Query database for user
      const [dbUser] = await db.select().from(usersTable).where(
        and(
          eq(usersTable.username, username),
          eq(usersTable.isActive, true)
        )
      );

      if (!dbUser || !dbUser.password) {
        console.warn(`[AdminLogin] No matching active user found for: ${username}`);
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
      }

      // Compare password using bcrypt (supports both hashed and plaintext for migration)
      let passwordMatches = false;
      let passwordNeedsUpgrade = false;

      if (dbUser.password.startsWith("$2")) {
        // Password is already hashed (bcrypt format)
        passwordMatches = await bcrypt.compare(password, dbUser.password);
      } else {
        // Password is plaintext - compare directly and mark for upgrade
        passwordMatches = password === dbUser.password;
        if (passwordMatches) passwordNeedsUpgrade = true;
      }

      if (!passwordMatches) {
        console.warn(`[AdminLogin] Invalid password for: ${username}`);
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
      }

      // Check if user has management permissions
      const hasAccess = ["admin", "employee"].includes(dbUser.role);
      if (!hasAccess) {
        console.warn(`[AdminLogin] User ${username} has insufficient role: ${dbUser.role}`);
        return res.status(403).json({ ok: false, error: "Insufficient permissions" });
      }

      // Auto-migrate plaintext passwords to bcrypt on first successful login
      if (passwordNeedsUpgrade) {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await db
            .update(usersTable)
            .set({ password: hashedPassword })
            .where(eq(usersTable.id, dbUser.id));
          console.log(`[AdminLogin] Auto-migrated plaintext password to bcrypt for user: ${username}`);
        } catch (upgradeErr: any) {
          console.warn(
            `[AdminLogin] Failed to upgrade password hash for ${username}:`,
            upgradeErr.message,
          );
          // Continue with login even if upgrade fails
        }
      }

      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          username: dbUser.username || "",
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

      console.log(`[AdminLogin] Success! Token issued for: ${username}`);
      return res.status(200).json({ ok: true, user: sessionData.user });

    } catch (err: any) {
      console.error("[AdminLogin] Critical Error:", err.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  return router;
}
