import express from "express";
import type { Request, Response } from "express";

export default function adminLoginRouter(): express.Router {
  const router = express.Router();
  router.post("/login", (req: Request, res: Response) => {
    const enabled =
      (process.env.ADMIN_LOGIN_ENABLED || "false").toLowerCase() === "true";
    const email = req.body?.email;
    const password = req.body?.password;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!enabled) {
      return res.status(403).json({ ok: false, error: "admin login disabled" });
    }
    if (email === adminEmail && password === adminPassword) {
      if ((req as any).session) {
        (req as any).session.user = {
          id: "admin",
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "manager",
          language: "en",
          isActive: true,
        };
        try {
          (req as any).session.save?.();
        } catch {}
      }
      return res
        .status(200)
        .json({ ok: true, user: (req as any).session?.user });
    }
    res.status(401).json({ ok: false, error: "Not authorized" });
  });
  return router;
}
