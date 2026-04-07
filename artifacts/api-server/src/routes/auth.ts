import { Router, type IRouter, type Request, type Response } from "express";
import { clearSession, getSessionId, getSession } from "../lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

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

import { sensitiveLimiter } from "../lib/rateLimiter";

router.post("/auth/reset-password", sensitiveLimiter, async (req: Request, res: Response) => {
  const { email, pin, newPassword } = req.body;

  if (!email || !pin || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email, PIN, and new password are required" });
  }

  if (newPassword.length < 4) {
    return res
      .status(400)
      .json({ error: "Password must be at least 4 characters" });
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify PIN — support both bcrypt and plaintext migration
    let pinValid = false;
    if (user.pin.startsWith("$2")) {
      pinValid = await bcrypt.compare(pin, user.pin);
    } else {
      pinValid = pin === user.pin;
    }

    if (!pinValid) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(usersTable)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (err: any) {
    console.error("[ResetPassword] Error:", err.message);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
