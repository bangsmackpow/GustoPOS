import express from "express";
import type { Request, Response } from "express";
import { createSession, SESSION_COOKIE, SESSION_TTL, type SessionData } from "../lib/auth";

// Simple pin-based login for admin/testing
export default function pinLoginRouter(): express.Router {
  const router = express.Router();
  router.post("/pin-login", async (req: Request, res: Response) => {
    const email = req.body?.email;
    const pin = req.body?.pin;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPin = process.env.ADMIN_PIN;
    if (email === adminEmail && pin === adminPin && adminEmail && adminPin) {
      const sessionData: SessionData = {
        user: {
          id: "admin",
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          language: "en",
          isActive: true,
        },
        createdAt: Date.now(),
      };

      const sid = await createSession(sessionData);
      const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

      res.cookie(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        path: "/",
        maxAge: SESSION_TTL,
      });

      return res
        .status(200)
        .json({ ok: true, user: sessionData.user });
    }
    return res.status(401).json({ ok: false, error: "Not authorized" });
  });
  return router;
}
