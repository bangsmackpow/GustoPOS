import express from "express";
import type { Request, Response } from "express";

export default function devLoginRouter(): express.Router {
  const router = express.Router();
  router.post("/login", (req: Request, res: Response) => {
    const email = req.body?.email;
    const password = req.body?.password;
    const enable = (process.env.DEV_LOGIN || "false").toLowerCase() === "true";
    const devEmail = process.env.DEV_ADMIN_EMAIL;
    const devPw = process.env.DEV_ADMIN_PASSWORD;
    if (enable && email === devEmail && password === devPw) {
      // @ts-ignore create a dev session user
      if ((req as any).session) {
        (req as any).session.user = {
          id: "dev-admin",
          email: devEmail,
          firstName: "Dev",
          lastName: "Admin",
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
