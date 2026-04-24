import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
export const SESSION_ACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour of inactivity

const JWT_SECRET: string = (() => {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required for JWT session security",
    );
  }
  return secret;
})();

export interface SessionUser {
  id: string;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role: string;
  language: string;
  isActive: boolean;
}

export interface SessionData {
  user: SessionUser;
  createdAt: number;
  lastActivity?: number;
}

export async function createSession(data: SessionData): Promise<string> {
  const sessionWithActivity = {
    ...data,
    lastActivity: Date.now(),
  };
  const token = jwt.sign(sessionWithActivity, JWT_SECRET, { expiresIn: "7d" });
  console.log("[Auth] Created session for user:", {
    userId: data.user.id,
    email: data.user.email,
    role: data.user.role,
    hasProfileImage: !!data.user.profileImageUrl,
    tokenLength: token.length,
  });
  // Verify token can be decoded immediately
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    console.log("[Auth] Verified created token - decoded user:", {
      userId: decoded.user?.id,
      email: decoded.user?.email,
      role: decoded.user?.role,
    });
  } catch (err: any) {
    console.error("[Auth] CRITICAL: Created token cannot be verified!", err.message);
  }
  return token;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  try {
    const decoded = jwt.verify(sid, JWT_SECRET) as SessionData;
    const now = Date.now();
    const lastActivity = decoded.lastActivity ?? decoded.createdAt;
    const inactivityMinutes = (now - lastActivity) / (60 * 1000);
    
    console.log("[Auth] Verified session token for user:", {
      userId: decoded.user?.id,
      email: decoded.user?.email,
      inactivityMinutes: inactivityMinutes.toFixed(2),
      hasUser: !!decoded.user,
    });
    
    if (now - lastActivity > SESSION_ACTIVITY_TIMEOUT) {
      console.warn("[Auth] Session expired due to inactivity", {
        inactivityMinutes: inactivityMinutes.toFixed(2),
        timeoutMinutes: SESSION_ACTIVITY_TIMEOUT / (60 * 1000),
      });
      return null;
    }
    return decoded;
  } catch (err: any) {
    console.warn("[Auth] Invalid or expired token:", err.message);
    return null;
  }
}

export async function refreshActivity(sid: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(sid, JWT_SECRET) as SessionData;
    const refreshed = {
      ...decoded,
      lastActivity: Date.now(),
    };
    return jwt.sign(refreshed, JWT_SECRET, { expiresIn: "7d" });
  } catch {
    return null;
  }
}

export async function updateSession(
  _sid: string,
  _data: SessionData,
): Promise<void> {}

export async function deleteSession(_sid: string): Promise<void> {}

export async function clearSession(
  res: Response,
  _sid?: string,
): Promise<void> {
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}
