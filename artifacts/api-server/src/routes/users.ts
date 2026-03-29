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
  const users = await db.select().from(usersTable);
  return res.json(users.map(formatUser));
});

router.post("/users", async (req: Request, res: Response) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
  }

  const { password, ...otherData } = req.body;

  const [user] = await db.insert(usersTable).values({
    ...otherData,
    password: password || null,
    isActive: true,
  }).returning();

  return res.status(201).json(formatUser(user));
});

router.get("/users/:id", async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id as string));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(user));
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const updateData: any = { ...req.body };
  // Ensure we don't accidentally wipe the password if not provided
  if (!updateData.password) delete updateData.password;

  const [user] = await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.params.id as string))
    .returning();

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(user));
});

router.delete("/users/:id", async (req: Request, res: Response) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.params.id as string));
  return res.json({ success: true });
});

export default router;
