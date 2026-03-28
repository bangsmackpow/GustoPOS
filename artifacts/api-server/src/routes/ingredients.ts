import { Router, type IRouter, type Request, type Response } from "express";
import { db, ingredientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateIngredientBody,
  UpdateIngredientBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatIngredient(i: typeof ingredientsTable.$inferSelect) {
  return {
    ...i,
    unitSize: Number(i.unitSize),
    costPerUnit: Number(i.costPerUnit),
    currentStock: Number(i.currentStock),
    minimumStock: Number(i.minimumStock),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

router.get("/ingredients", async (req: Request, res: Response) => {
  const items = await db.select().from(ingredientsTable).orderBy(ingredientsTable.name);
  res.json(items.map(formatIngredient));
});

router.post("/ingredients", async (req: Request, res: Response) => {
  const parsed = CreateIngredientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  const [item] = await db.insert(ingredientsTable).values({
    name: parsed.data.name,
    nameEs: parsed.data.nameEs ?? null,
    unit: parsed.data.unit,
    unitSize: String(parsed.data.unitSize),
    costPerUnit: String(parsed.data.costPerUnit),
    currentStock: String(parsed.data.currentStock),
    minimumStock: String(parsed.data.minimumStock),
    category: parsed.data.category as any,
  }).returning();
  res.status(201).json(formatIngredient(item));
});

router.get("/ingredients/:id", async (req: Request, res: Response) => {
  const [item] = await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, req.params.id));
  if (!item) {
    res.status(404).json({ error: "Ingredient not found" });
    return;
  }
  res.json(formatIngredient(item));
});

router.patch("/ingredients/:id", async (req: Request, res: Response) => {
  const parsed = UpdateIngredientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name != null) updateData.name = data.name;
  if (data.nameEs != null) updateData.nameEs = data.nameEs;
  if (data.unit != null) updateData.unit = data.unit;
  if (data.unitSize != null) updateData.unitSize = String(data.unitSize);
  if (data.costPerUnit != null) updateData.costPerUnit = String(data.costPerUnit);
  if (data.currentStock != null) updateData.currentStock = String(data.currentStock);
  if (data.minimumStock != null) updateData.minimumStock = String(data.minimumStock);
  if (data.category != null) updateData.category = data.category;

  const [item] = await db.update(ingredientsTable).set(updateData).where(eq(ingredientsTable.id, req.params.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Ingredient not found" });
    return;
  }
  res.json(formatIngredient(item));
});

router.delete("/ingredients/:id", async (req: Request, res: Response) => {
  await db.delete(ingredientsTable).where(eq(ingredientsTable.id, req.params.id));
  res.json({ success: true });
});

export default router;
