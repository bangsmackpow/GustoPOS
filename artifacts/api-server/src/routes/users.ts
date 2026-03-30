import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    profileImageUrl: u.profileImageUrl,
    role: u.role as any,
    language: u.language as any,
    pin: u.pin,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await db.select().from(usersTable);
    return res.json(users.map(formatUser));
  } catch (err) {
    console.error("[getUsers] Failed to fetch users:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", async (req: Request, res: Response) => {
  try {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    }

    const data = parsed.data;
    const [user] = await db.insert(usersTable).values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      role: data.role as any,
      language: data.language as any,
      pin: data.pin,
      password: (req.body as any).password || null,
      isActive: true,
    } as typeof usersTable.$inferInsert).returning();

    return res.status(201).json(formatUser(user));
  } catch (err: any) {
    console.error("[createUser] Error:", err);
    return res.status(500).json({ error: "Failed to create user", message: err.message });
  }
});

router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id as string));
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(formatUser(user));
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateUserBody.safeParse(req.body);
    if (!parsed.success) {
      console.warn("[updateUser] Validation failed:", parsed.error.format());
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    }

    const data = parsed.data;
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updatedAt: new Date()
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as any;
    if (data.language !== undefined) updateData.language = data.language as any;
    if (data.pin !== undefined) updateData.pin = data.pin ?? "0000";
    if (data.isActive !== undefined) updateData.isActive = data.isActive ?? true;
    
    // Explicitly handle password update
    const rawPassword = (req.body as any).password;
    if (rawPassword !== undefined) {
      updateData.password = rawPassword || null;
    }

    const [user] = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, req.params.id as string))
      .returning();

    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(`[updateUser] Successfully updated user: ${user.id}`);
    return res.json(formatUser(user));
  } catch (err: any) {
    console.error("[updateUser] Critical Error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
});

router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
