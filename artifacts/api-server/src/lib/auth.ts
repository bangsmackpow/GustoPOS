import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

// Use ADMIN_PASSWORD as secret or fallback to random string
const JWT_SECRET = process.env.ADMIN_PASSWORD || "gustopos-default-secret-change-me";

export interface SessionUser {
  id: string;
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
}

/**
 * Creates a stateless signed JWT
 */
export async function createSession(data: SessionData): Promise<string> {
  // Sign the session data
  return jwt.sign(data, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies and decodes the JWT from the sid
 */
export async function getSession(sid: string): Promise<SessionData | null> {
  try {
    const decoded = jwt.verify(sid, JWT_SECRET) as SessionData;
    return decoded;
  } catch (err) {
    console.warn("[Auth] Invalid or expired token");
    return null;
  }
}

/**
 * Update logic not needed for stateless JWT (we just issue a new one if data changes)
 */
export async function updateSession(
  _sid: string,
  _data: SessionData,
): Promise<void> {
  // Stateless: nothing to update in DB. 
  // Routes should just clear and set a new cookie if they want to update user data.
}

/**
 * No-op for stateless JWT (server doesn't store anything to delete)
 */
export async function deleteSession(_sid: string): Promise<void> {
  // Stateless: nothing to delete on server.
}

export async function clearSession(
  res: Response,
  _sid?: string,
): Promise<void> {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}
