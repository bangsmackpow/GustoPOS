import { type Request, type Response, type NextFunction } from "express";
import {
  clearSession,
  getSessionId,
  getSession,
  type SessionUser,
} from "../lib/auth";

declare global {
  namespace Express {
    interface User extends SessionUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    if (req.url?.includes("/api/")) {
      console.log(`[AuthMiddleware] No Session ID found for URL: ${req.url}`);
    }
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    console.log(`[AuthMiddleware] Session ID ${sid.slice(0, 8)}... found but NO VALID USER in session or EXPIRED`);
    await clearSession(res, sid);
    next();
    return;
  }

  console.log(`[AuthMiddleware] Identified User: ${session.user.id} (${session.user.role}) for URL: ${req.url}`);
  req.user = session.user;
  next();
}
