import { Router, type IRouter, type Request, type Response } from "express";
import {
  clearSession,
  getSessionId,
} from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/user", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  
  if (!sid) {
    return res.json({ isAuthenticated: false, user: null });
  }

  const session = await getSession(sid);
  if (!session?.user) {
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
