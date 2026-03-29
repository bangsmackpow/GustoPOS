import express from "express";
import type { Request, Response } from "express";

// Simple pin-based login for admin/testing
export default function pinLoginRouter(): express.Router {
  const router = express.Router();
  router.post("/pin-login", (req: Request, res: Response) => {
    const email = req.body?.email;
    const pin = req.body?.pin;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPin = process.env.ADMIN_PIN;
    if (email === adminEmail && pin === adminPin) {
      if ((req as any).session) {
        (req as any).session.user = {
          id: "admin",
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
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
