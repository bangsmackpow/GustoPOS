import express from "express";
import type { Request, Response } from "express";
import crypto from "crypto";
import { createSession, SESSION_COOKIE, SESSION_TTL, type SessionData } from "../lib/auth";

// Minimal TOTPs helper (no external dep)
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = (base32 || "")
    .replace(/=+$/, "")
    .replace(/[^A-Z2-7]/gi, "")
    .toUpperCase();
  let bits = "";
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function verifyTotp(
  code: string,
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
): boolean {
  try {
    if (!secret) return false;
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStep);
    const counterBuf = Buffer.alloc(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) {
      counterBuf[i] = c & 0xff;
      c = Math.floor(c / 256);
    }
    const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binaryCode = hmac.readUInt32BE(offset) & 0x7fffffff;
    const otp = binaryCode % Math.pow(10, digits);
    return otp.toString().padStart(digits, "0") === code;
  } catch {
    return false;
  }
}

export default function adminLoginRouter(): express.Router {
  const router = express.Router();
  router.post("/login", async (req: Request, res: Response) => {
    const enabled =
      (process.env.ADMIN_LOGIN_ENABLED || "true").toLowerCase() === "true";
    if (!enabled) {
      return res.status(403).json({ ok: false, error: "admin login disabled" });
    }
    const email = req.body?.email;
    const password = req.body?.password;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (email === adminEmail && password === adminPassword && adminEmail && adminPassword) {
      const twofaEnabled =
        (process.env.ADMIN_2FA_ENABLED || "false").toLowerCase() === "true";
      const otp = req.body?.otp;
      if (twofaEnabled) {
        const secret = process.env.ADMIN_TOTP_SECRET || "";
        if (!secret) {
          return res
            .status(500)
            .json({ ok: false, error: "2FA secret not configured" });
        }
        if (!otp || !verifyTotp(otp, secret)) {
          return res.status(401).json({ ok: false, error: "Invalid 2FA code" });
        }
      }
      
      const sessionData: SessionData = {
        user: {
          id: "admin",
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          language: "en",
          isActive: true,
        },
        access_token: "admin-token",
      };

      const sid = await createSession(sessionData);
      res.cookie(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL,
      });

      return res
        .status(200)
        .json({ ok: true, user: sessionData.user });
    }
    return res.status(401).json({ ok: false, error: "Not authorized" });
  });
  return router;
}
