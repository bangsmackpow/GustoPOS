import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetUsersResponse,
  GetUserResponse,
  CreateUserBody,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (req: Request, res: Response) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(GetUsersResponse.parse(users.map(u => ({
    ...u,
    role: u.role ?? "bartender",
    language: u.language ?? "en",
    isActive: u.isActive ?? true,
    createdAt: u.createdAt, // Pass the Date object directly
  }))));
});

router.post("/users", async (req: Request, res: Response) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  const { firstName, lastName, email, role, language, pin } = parsed.data;
  const [user] = await db.insert(usersTable).values({
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    email: email ?? null,
    role,
    language,
    pin,
    isActive: true,
  }).returning();
  res.status(201).json({
    ...user,
    role: user.role ?? "bartender",
    language: user.language ?? "en",
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
  });
});

router.get("/users/:id", async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id as string));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse({
    ...user,
    role: user.role ?? "bartender",
    language: user.language ?? "en",
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
  }));
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;
  const updateData: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = (data.role as any) ?? undefined;
  if (data.language !== undefined) updateData.language = (data.language as any) ?? undefined;
  if (data.pin !== undefined) updateData.pin = (data.pin as any) ?? undefined;
  if (data.isActive !== undefined) updateData.isActive = (data.isActive as any) ?? undefined;

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.params.id as string)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateUserResponse.parse({
    ...user,
    role: user.role ?? "bartender",
    language: user.language ?? "en",
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
  }));
});

router.delete("/users/:id", async (req: Request, res: Response) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.params.id as string));
  res.json(DeleteUserResponse.parse({ success: true }));
});

export default router;
