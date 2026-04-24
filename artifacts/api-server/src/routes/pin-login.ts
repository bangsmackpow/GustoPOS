import express from "express";
import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";
import { pinLoginLimiter } from "../lib/rateLimiter";

export default function pinLoginRouter(): express.Router {
  const router = express.Router();

  router.post(
    "/pin-login",
    pinLoginLimiter,
    async (req: Request, res: Response) => {
      const email = req.body?.email;
      const pin = req.body?.pin;

      if (!email || !pin) {
        return res
          .status(400)
          .json({ ok: false, error: "Email and PIN are required" });
      }

      // Validate PIN format: must be exactly 4 digits
      if (!/^\d{4}$/.test(pin)) {
        return res
          .status(400)
          .json({ ok: false, error: "PIN must be 4 digits" });
      }

      try {
        // Find active user with matching email
        const [dbUser] = await db
          .select()
          .from(usersTable)
          .where(and(eq(usersTable.email, email), eq(usersTable.isActive, 1)));

        if (!dbUser) {
          return res
            .status(401)
            .json({ ok: false, error: "Invalid PIN or email" });
        }

        // Handle both hashed and plaintext PINs (for migration compatibility)
        let pinMatches = false;
        let pinNeedsUpgrade = false;

        if (!dbUser.pin) {
          pinMatches = false;
        } else if (dbUser.pin.startsWith("$2")) {
          // PIN is already hashed (bcrypt format)
          pinMatches = await bcrypt.compare(pin, dbUser.pin);
        } else {
          // PIN is plaintext - compare directly and mark for upgrade
          pinMatches = pin === dbUser.pin;
          if (pinMatches) pinNeedsUpgrade = true;
        }

        if (!pinMatches) {
          return res
            .status(401)
            .json({ ok: false, error: "Invalid PIN or email" });
        }

        // Auto-migrate plaintext PINs to bcrypt on first successful login
        if (pinNeedsUpgrade) {
          try {
            const hashedPin = await bcrypt.hash(pin, 10);
            await db
              .update(usersTable)
              .set({ pin: hashedPin })
              .where(eq(usersTable.id, dbUser.id));
            console.log(
              `[PinLogin] Auto-migrated plaintext PIN to bcrypt for user: ${dbUser.email}`,
            );
          } catch (upgradeErr: any) {
            console.warn(
              `[PinLogin] Failed to upgrade PIN hash for ${dbUser.email}:`,
              upgradeErr.message,
            );
            // Continue with login even if upgrade fails
          }
        }

        const sessionData: SessionData = {
          user: {
            id: dbUser.id,
            email: dbUser.email || "",
            firstName: dbUser.firstName || "",
            lastName: dbUser.lastName || "",
            profileImageUrl: dbUser.profileImageUrl || null,
            role: dbUser.role,
            language: dbUser.language,
            isActive: true,
          },
          createdAt: Date.now(),
        };

        const sid = await createSession(sessionData);
        const isSecure =
          req.secure || req.headers["x-forwarded-proto"] === "https";

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
        return res
          .status(500)
          .json({ ok: false, error: "Internal server error" });
      }
    },
  );

  return router;
}
