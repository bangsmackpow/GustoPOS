import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  drinksTable,
  recipeIngredientsTable,
  inventoryItemsTable,
  eventLogsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { CreateDrinkBody, UpdateDrinkBody } from "@workspace/api-zod";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

async function getDrinksBatched(drinkIds?: string[]) {
  const baseQuery = drinkIds
    ? db.select().from(drinksTable).where(inArray(drinksTable.id, drinkIds))
    : db.select().from(drinksTable).orderBy(drinksTable.name);

  const drinks = (await baseQuery).filter((d) => !d.isDeleted);

  if (drinks.length === 0) return [];

  const drinkIdsList = drinks.map((d) => d.id);

  const recipeRows = await db
    .select({
      ri: recipeIngredientsTable,
      inv: inventoryItemsTable,
    })
    .from(recipeIngredientsTable)
    .leftJoin(
      inventoryItemsTable,
      eq(recipeIngredientsTable.ingredientId, inventoryItemsTable.id),
    )
    .where(inArray(recipeIngredientsTable.drinkId, drinkIdsList));

  const drinkRecipeMap = new Map<
    string,
    Array<{
      ingredientId: string | null;
      ingredientName: string;
      ingredientNameEs: string | null;
      amountInBaseUnit: number;
      costContribution: number;
    }>
  >();
  const drinkCostMap = new Map<string, number>();

  for (const { ri, inv } of recipeRows) {
    if (!drinkRecipeMap.has(ri.drinkId)) {
      drinkRecipeMap.set(ri.drinkId, []);
      drinkCostMap.set(ri.drinkId, 0);
    }
    const amountInBaseUnit = Number(ri.amountInBaseUnit);
    const costPerBaseUnit =
      inv && inv.orderCost > 0 && inv.baseUnitAmount > 0
        ? inv.orderCost / inv.baseUnitAmount
        : 0;
    const costContribution = amountInBaseUnit * costPerBaseUnit;

    drinkRecipeMap.get(ri.drinkId)!.push({
      ingredientId: ri.ingredientId,
      ingredientName: inv?.name ?? "Unknown",
      ingredientNameEs: inv?.nameEs ?? null,
      amountInBaseUnit,
      costContribution,
    });
    drinkCostMap.set(
      ri.drinkId,
      (drinkCostMap.get(ri.drinkId) ?? 0) + costContribution,
    );
  }

  return drinks.map((drink) => {
    const recipe = drinkRecipeMap.get(drink.id) ?? [];
    const costPerDrink = drinkCostMap.get(drink.id) ?? 0;
    const markupFactor = Number(drink.markupFactor);
    const suggestedPrice = costPerDrink * markupFactor;
    const actualPrice =
      drink.actualPrice != null ? Number(drink.actualPrice) : suggestedPrice;

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
      recipe,
      isAvailable: drink.isAvailable,
      isOnMenu: drink.isOnMenu,
      createdAt: drink.createdAt.toISOString(),
      updatedAt: drink.updatedAt.toISOString(),
    };
  });
}

router.get("/drinks", async (req: Request, res: Response) => {
  try {
    const result = await getDrinksBatched();
    res.json(result.filter(Boolean));
  } catch (err: any) {
    console.error("Error fetching drinks:", err);
    res.status(500).json({ error: "Failed to fetch drinks" });
  }
});

router.post("/drinks", async (req: Request, res: Response) => {
  try {
    const parsed = CreateDrinkBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error });
      return;
    }
    const {
      name,
      nameEs,
      description,
      descriptionEs,
      category,
      markupFactor,
      actualPrice,
      isAvailable,
      recipe,
    } = parsed.data as any;

    const [drink] = await db
      .insert(drinksTable)
      .values({
        name,
        nameEs: nameEs ?? null,
        description: description ?? null,
        descriptionEs: descriptionEs ?? null,
        category: category as any,
        markupFactor: Number(markupFactor ?? 3.0),
        actualPrice: actualPrice != null ? Number(actualPrice) : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      } as typeof drinksTable.$inferInsert)
      .returning();

    if (recipe && recipe.length > 0) {
      await db.insert(recipeIngredientsTable).values(
        recipe.map(
          (r: any) =>
            ({
              drinkId: drink.id,
              ingredientId: r.ingredientId,
              amountInBaseUnit: Number(r.amountInBaseUnit),
            }) as typeof recipeIngredientsTable.$inferInsert,
        ),
      );
    }

    const result = (await getDrinksBatched([drink.id]))[0];
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Error creating drink:", err);
    res.status(500).json({ error: "Failed to create drink" });
  }
});

router.get("/drinks/:id", async (req: Request, res: Response) => {
  try {
    const result = (await getDrinksBatched([req.params.id as string]))[0];
    if (!result) {
      res.status(404).json({ error: "Drink not found" });
      return;
    }
    res.json(result);
  } catch (err: any) {
    console.error("Error fetching drink:", err);
    res.status(500).json({ error: "Failed to fetch drink" });
  }
});

router.patch("/drinks/:id", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateDrinkBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const data = parsed.data as any;
    const updateData: Partial<typeof drinksTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.name != null) updateData.name = data.name;
    if (data.nameEs !== undefined) updateData.nameEs = data.nameEs;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.descriptionEs !== undefined)
      updateData.descriptionEs = data.descriptionEs;
    if (data.category != null) updateData.category = data.category as any;
    if (data.markupFactor != null)
      updateData.markupFactor = Number(data.markupFactor);
    if (data.actualPrice !== undefined)
      updateData.actualPrice =
        data.actualPrice != null ? Number(data.actualPrice) : undefined;
    if (data.isAvailable != null) updateData.isAvailable = data.isAvailable;

    const [drink] = await db
      .update(drinksTable)
      .set(updateData)
      .where(eq(drinksTable.id, req.params.id as string))
      .returning();
    if (!drink) {
      res.status(404).json({ error: "Drink not found" });
      return;
    }

    await logEvent({
      userId: (req as any).user?.id || "system",
      action: "drink_update",
      entityType: "drink",
      entityId: drink.id,
      newValue: {
        name: drink.name,
        actualPrice: drink.actualPrice,
        markupFactor: drink.markupFactor,
        category: drink.category,
      },
    });

    if (data.recipe) {
      await db
        .delete(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, req.params.id as string));
      if (data.recipe.length > 0) {
        await db.insert(recipeIngredientsTable).values(
          data.recipe.map(
            (r: any) =>
              ({
                drinkId: drink.id,
                ingredientId: r.ingredientId,
                amountInBaseUnit: Number(r.amountInBaseUnit),
              }) as typeof recipeIngredientsTable.$inferInsert,
          ),
        );
      }
    }

    const result = (await getDrinksBatched([drink.id]))[0];
    res.json(result);
  } catch (err: any) {
    console.error("Error updating drink:", err);
    res.status(500).json({ error: "Failed to update drink" });
  }
});

router.delete("/drinks/:id", async (req: Request, res: Response) => {
  try {
    const [drink] = await db
      .update(drinksTable)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(drinksTable.id, req.params.id as string))
      .returning();
    if (!drink) {
      res.status(404).json({ error: "Drink not found" });
      return;
    }
    res.json({ success: true });
    return;
  } catch (err: any) {
    console.error("Error deleting drink:", err);
    res.status(500).json({ error: "Failed to delete drink" });
    return;
  }
});

export default router;
