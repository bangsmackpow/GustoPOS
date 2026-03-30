import { Router, type IRouter, type Request, type Response } from "express";
import {
  clearSession,
  getSessionId,
} from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  const isAuthenticated = !!req.user;
  res.json({
    isAuthenticated,
    user: isAuthenticated ? {
      id: req.user!.id,
      email: req.user!.email ?? null,
      firstName: req.user!.firstName ?? null,
      lastName: req.user!.lastName ?? null,
      profileImageUrl: req.user!.profileImageUrl ?? null,
      role: req.user!.role ?? "bartender",
      language: req.user!.language ?? "en",
    } : undefined,
  });
});

router.get("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

// For backward compatibility with any hardcoded redirects
router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/login");
});

export default router;
