import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserBody, CreateUserBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

const PIN_REGEX = /^[0-9]{4}$/;
const PIN_COST_FACTOR = 10;

function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_COST_FACTOR);
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    profileImageUrl: u.profileImageUrl,
    role: u.role as any,
    language: u.language as any,
    isActive: u.isActive,
    createdAt: u.createdAt,
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await db.select().from(usersTable);
    return res.json(users.map(formatUser));
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    // Manual validation for better error messages
    const {
      firstName,
      lastName,
      username,
      email,
      role,
      language,
      pin,
      password,
    } = req.body;

    console.log("[createUser] Received data:", {
      firstName,
      lastName,
      username,
      email,
      role,
      language,
      pin: pin ? "***" : undefined,
      hasPassword: !!password,
    });

    if (
      !firstName ||
      typeof firstName !== "string" ||
      firstName.trim() === ""
    ) {
      return res.status(400).json({ error: "First name is required" });
    }
    if (!role || !["admin", "employee"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Valid role is required (admin, employee)" });
    }
    if (!language || !["en", "es"].includes(language)) {
      return res
        .status(400)
        .json({ error: "Valid language is required (en, es)" });
    }

    // Validate PIN if provided
    if (pin && !isValidPin(pin)) {
      return res.status(400).json({
        error: "PIN must be exactly 4 digits",
      });
    }

    const insertData: typeof usersTable.$inferInsert = {
      firstName: firstName,
      lastName: lastName || "",
      username: username || null,
      email: email || null,
      role: role,
      language: language || "en",
      pin: pin ? await hashPin(pin) : await hashPin("0000"),
      password: password || null,
      isActive: 1,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };

    const [user] = await db.insert(usersTable).values(insertData).returning();

    console.log(`[createUser] Successfully created user: ${user.id}`);
    return res.status(201).json(formatUser(user));
  } catch (err: any) {
    console.error("[createUser] Error:", err);
    if (err.message?.includes("UNIQUE constraint")) {
      return res
        .status(409)
        .json({ error: "A user with that email already exists" });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateUserBody.safeParse(req.body);
    if (!parsed.success) {
      console.warn("[updateUser] Validation failed:", parsed.error.format());
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.format(),
      });
    }

    const data = parsed.data;
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updatedAt: Math.floor(Date.now() / 1000),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as any;
    if (data.language !== undefined) updateData.language = data.language as any;
    if (data.pin !== undefined) {
      if (data.pin && !isValidPin(data.pin)) {
        return res.status(400).json({
          error: "PIN must be exactly 4 digits",
        });
      }
      updateData.pin = data.pin
        ? await hashPin(data.pin)
        : await hashPin("0000");
    }
    if (data.isActive !== undefined)
      updateData.isActive = data.isActive ? 1 : 0;

    // Explicitly handle password update
    const rawPassword = (req.body as any).password;
    if (rawPassword !== undefined) {
      updateData.password = rawPassword
        ? await bcrypt.hash(rawPassword, 10)
        : null;
    }

    const [user] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, req.params.id as string))
      .returning();

    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(`[updateUser] Successfully updated user: ${user.id}`);
    return res.json(formatUser(user));
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await db
      .update(usersTable)
      .set({ isActive: 0 })
      .where(eq(usersTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [user] = await db
      .update(usersTable)
      .set({
        password: hashedPassword,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(usersTable.id, req.params.id as string))
      .returning();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
