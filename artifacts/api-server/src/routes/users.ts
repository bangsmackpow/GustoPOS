import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserBody, CreateUserBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

const PIN_REGEX = /^[0-9]{4}$/;
const PIN_COST_FACTOR = 10;

function isValidPin(pin: string): boolean {
  if (!PIN_REGEX.test(pin)) return false;
  const allSame = pin[0] === pin[1] && pin[1] === pin[2] && pin[2] === pin[3];
  if (allSame) return false;
  return true;
}

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_COST_FACTOR);
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    profileImageUrl: u.profileImageUrl,
    role: u.role as any,
    language: u.language as any,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
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
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      console.warn("[createUser] Validation failed:", parsed.error.format());
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.format(),
      });
    }

    const data = parsed.data;

    if (data.pin && !isValidPin(data.pin)) {
      return res.status(400).json({
        error: "PIN must be 4 digits and not all the same (e.g., 0000, 1111)",
      });
    }

    const insertData: typeof usersTable.$inferInsert = {
      firstName: data.firstName,
      lastName: data.lastName || "",
      email: data.email || null,
      role: data.role,
      language: data.language || "en",
      pin: data.pin ? await hashPin(data.pin) : await hashPin("0000"),
      password: data.password || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    return res.status(500).json({ error: "Internal server error" });
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
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as any;
    if (data.language !== undefined) updateData.language = data.language as any;
    if (data.pin !== undefined) {
      if (data.pin && !isValidPin(data.pin)) {
        return res.status(400).json({
          error: "PIN must be 4 digits and not all the same (e.g., 0000, 1111)",
        });
      }
      updateData.pin = data.pin
        ? await hashPin(data.pin)
        : await hashPin("0000");
    }
    if (data.isActive !== undefined)
      updateData.isActive = data.isActive ?? true;

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
      .delete(usersTable)
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
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id as string))
      .returning();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
