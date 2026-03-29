import express from "express";
import type { Request, Response } from "express";
import { createSession, SESSION_COOKIE, SESSION_TTL, type SessionData } from "../lib/auth";

export default function devLoginRouter(): express.Router {
  const router = express.Router();
  router.post("/login", async (req: Request, res: Response) => {
    const email = req.body?.email;
    const password = req.body?.password;
    const enable = (process.env.DEV_LOGIN || "false").toLowerCase() === "true";
    const devEmail = process.env.DEV_ADMIN_EMAIL;
    const devPw = process.env.DEV_ADMIN_PASSWORD;
    if (enable && email === devEmail && password === devPw && devEmail && devPw) {
      const sessionData: SessionData = {
        user: {
          id: "dev-admin",
          email: devEmail,
          firstName: "Dev",
          lastName: "Admin",
          role: "manager",
          language: "en",
          isActive: true,
        },
        access_token: "dev-token",
      };

      const sid = await createSession(sessionData);
      res.cookie(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
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
