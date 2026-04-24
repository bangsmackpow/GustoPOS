import { type Request, type Response, type NextFunction } from "express";
import {
  getSessionId,
  getSession,
  refreshActivity,
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

const LOGIN_PATHS = ["/admin/login", "/login", "/pin-login"];

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  if (LOGIN_PATHS.includes(req.path)) {
    next();
    return;
  }

  const sid = getSessionId(req);
  if (!sid) {
    if (req.path === "/auth/user") {
      console.log("[AuthMiddleware] /auth/user: No session ID found", {
        hasCookie: !!req.cookies?.["sid"],
        allCookies: Object.keys(req.cookies || {}),
        authHeader: req.headers.authorization ? "present" : "missing",
      });
    }
    next();
    return;
  }

  // Stateless: getSession now just verifies the JWT
  const session = await getSession(sid);
  if (!session?.user?.id) {
    if (req.path === "/auth/user") {
      console.log("[AuthMiddleware] /auth/user: Session validation failed", {
        sessionExists: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id,
      });
    }
    next();
    return;
  }

  if (req.path === "/auth/user") {
    console.log("[AuthMiddleware] /auth/user: Session valid", {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });
  }

  req.user = session.user;

  // Refresh activity timestamp on each authenticated request
  const newSid = await refreshActivity(sid);
  if (newSid) {
    res.cookie("sid", newSid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  next();
}

// Require authentication - returns 401 if not logged in
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// Require specific role - returns 403 if user doesn't have the role
export function requireRole(role: "admin" | "bartender") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (req.user.role !== role && req.user.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
