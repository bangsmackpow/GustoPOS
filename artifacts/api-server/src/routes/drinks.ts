import { Router, type IRouter, type Request, type Response } from "express";
import { db, drinksTable, recipeIngredientsTable, ingredientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateDrinkBody,
  UpdateDrinkBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getDrinkWithRecipe(drinkId: string) {
  const [drink] = await db.select().from(drinksTable).where(eq(drinksTable.id, drinkId));
  if (!drink) return null;

  const recipeRows = await db
    .select({
      ri: recipeIngredientsTable,
      ing: ingredientsTable,
    })
    .from(recipeIngredientsTable)
    .leftJoin(ingredientsTable, eq(recipeIngredientsTable.ingredientId, ingredientsTable.id))
    .where(eq(recipeIngredientsTable.drinkId, drinkId));

  const recipe = recipeRows.map(({ ri, ing }) => {
    const amountInMl = Number(ri.amountInMl);
    const costPerUnit = ing ? Number(ing.costPerUnit) : 0;
    const unitSize = ing ? Number(ing.unitSize) : 1;
    const costContribution = unitSize > 0 ? (amountInMl / unitSize) * costPerUnit : 0;
    return {
      ingredientId: ri.ingredientId,
      ingredientName: ing?.name ?? "Unknown",
      ingredientNameEs: ing?.nameEs ?? null,
      amountInMl,
      costContribution,
    };
  });

  const costPerDrink = recipe.reduce((sum, r) => sum + r.costContribution, 0);
  const markupFactor = Number(drink.markupFactor);
  const upcharge = Number(drink.upcharge);
  const suggestedPrice = costPerDrink * markupFactor + upcharge;
  const actualPrice = drink.actualPrice != null ? Number(drink.actualPrice) : suggestedPrice;

  return {
    id: drink.id,
    name: drink.name,
    nameEs: drink.nameEs ?? null,
    description: drink.description ?? null,
    descriptionEs: drink.descriptionEs ?? null,
    category: drink.category,
    costPerDrink,
    suggestedPrice,
    actualPrice,
    markupFactor,
    upcharge,
    recipe,
    isAvailable: drink.isAvailable,
    createdAt: drink.createdAt.toISOString(),
    updatedAt: drink.updatedAt.toISOString(),
  };
}

router.get("/drinks", async (req: Request, res: Response) => {
  const drinks = await db.select().from(drinksTable).orderBy(drinksTable.name);
  const result = await Promise.all(drinks.map(d => getDrinkWithRecipe(d.id)));
  res.json(result.filter(Boolean));
});

router.post("/drinks", async (req: Request, res: Response) => {
  const parsed = CreateDrinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  const { name, nameEs, description, descriptionEs, category, markupFactor, upcharge, actualPrice, isAvailable, recipe } = parsed.data;

  const [drink] = await db.insert(drinksTable).values({
    name,
    nameEs: nameEs ?? null,
    description: description ?? null,
    descriptionEs: descriptionEs ?? null,
    category: category as any,
    markupFactor: String(markupFactor),
    upcharge: String(upcharge),
    actualPrice: actualPrice != null ? String(actualPrice) : null,
    isAvailable,
  }).returning();

  if (recipe.length > 0) {
    await db.insert(recipeIngredientsTable).values(
      recipe.map(r => ({
        drinkId: drink.id,
        ingredientId: r.ingredientId,
        amountInMl: String(r.amountInMl),
      }))
    );
  }

  const result = await getDrinkWithRecipe(drink.id);
  res.status(201).json(result);
});

router.get("/drinks/:id", async (req: Request, res: Response) => {
  const result = await getDrinkWithRecipe(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: "Drink not found" });
    return;
  }
  res.json(result);
});

router.patch("/drinks/:id", async (req: Request, res: Response) => {
  const parsed = UpdateDrinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;
  const updateData: Partial<typeof drinksTable.$inferInsert> = { updatedAt: new Date() };
  if (data.name != null) updateData.name = data.name;
  if (data.nameEs !== undefined) updateData.nameEs = data.nameEs;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.descriptionEs !== undefined) updateData.descriptionEs = data.descriptionEs;
  if (data.category != null) updateData.category = data.category as any;
  if (data.markupFactor != null) updateData.markupFactor = String(data.markupFactor);
  if (data.upcharge != null) updateData.upcharge = String(data.upcharge);
  if (data.actualPrice !== undefined) updateData.actualPrice = data.actualPrice != null ? String(data.actualPrice) : null;
  if (data.isAvailable != null) updateData.isAvailable = data.isAvailable;


  const [drink] = await db.update(drinksTable).set(updateData).where(eq(drinksTable.id, req.params.id as string)).returning();
  if (!drink) {
    res.status(404).json({ error: "Drink not found" });
    return;
  }

  if (data.recipe) {
    await db.delete(recipeIngredientsTable).where(eq(recipeIngredientsTable.drinkId, req.params.id as string));
    if (data.recipe.length > 0) {
      await db.insert(recipeIngredientsTable).values(
        data.recipe.map(r => ({
          drinkId: drink.id,
          ingredientId: r.ingredientId,
          amountInMl: String(r.amountInMl),
        }))
      );
    }
  }

  const result = await getDrinkWithRecipe(drink.id);
  res.json(result);
});

router.delete("/drinks/:id", async (req: Request, res: Response) => {
  await db.delete(drinksTable).where(eq(drinksTable.id, req.params.id as string));
  res.json({ success: true });
});

export default router;
