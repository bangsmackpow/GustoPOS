import { Router, type IRouter, type Request, type Response } from "express";
import {
  clearSession,
  getSessionId,
} from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  const session = getSessionId(req);
  console.log(`[AuthCheck] Checking session: ${session ? 'Exists' : 'MISSING'}`);
  
  if (!session) {
    return res.json({ isAuthenticated: false, user: null });
  }
  
  return res.json({
    isAuthenticated: true,
    user: session.user,
  });
});

router.get("/auth/logout", (req: Request, res: Response) => {
  console.log("[AuthLogout] Clearing session");
  clearSession(res);
  return res.json({ success: true });
});

export default router;
