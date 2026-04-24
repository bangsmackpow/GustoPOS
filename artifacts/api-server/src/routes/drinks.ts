import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  drinksTable,
  recipeIngredientsTable,
  inventoryItemsTable,
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
      amountInBaseUnit: number;
      costContribution: number;
      isDefault: boolean;
      defaultCost: number;
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
      amountInBaseUnit,
      costContribution,
      isDefault: ri.isDefault === 1,
      defaultCost: Number(ri.defaultCost) || 0,
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
      description: drink.description ?? null,
      category: drink.category,
      sourceType: drink.sourceType,
      costPerDrink,
      suggestedPrice,
      actualPrice,
      markupFactor,
      recipe,
      isAvailable: drink.isAvailable === 1,
      isOnMenu: drink.isOnMenu === 1,
      isHidden: drink.isHidden === 1,
      isApproved: drink.isApproved === 1,
      createdAt: drink.createdAt
        ? new Date(drink.createdAt * 1000).toISOString()
        : null,
      updatedAt: drink.updatedAt
        ? new Date(drink.updatedAt * 1000).toISOString()
        : null,
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
      description,
      category,
      markupFactor,
      actualPrice,
      isAvailable,
      recipe,
      sourceType,
    } = parsed.data as any;

    // Validate recipe required unless inventory_single
    if (sourceType !== "inventory_single" && (!recipe || recipe.length === 0)) {
      res
        .status(400)
        .json({ error: "Recipe must have at least one ingredient" });
      return;
    }

    const [drink] = await db
      .insert(drinksTable)
      .values({
        name,
        description: description ?? null,
        category: category as any,
        markupFactor: Number(markupFactor ?? 3.0),
        actualPrice: actualPrice != null ? Number(actualPrice) : null,
        priceSource: actualPrice != null ? "manual" : "auto",
        isAvailable: isAvailable !== undefined ? (isAvailable ? 1 : 0) : 1,
        isApproved: 1, // Auto-approve new drinks for beta
      } as typeof drinksTable.$inferInsert)
      .returning();

    // Calculate menuPrice from ingredients
    let menuPrice = 0;
    if (recipe && recipe.length > 0) {
      // Get ALL ingredient prices (not just first!)
      const ingredientIds = recipe.map((r: any) => r.ingredientId);
      const ingredients = await db
        .select({
          id: inventoryItemsTable.id,
          productPrice: inventoryItemsTable.productPrice,
        })
        .from(inventoryItemsTable)
        .where(inArray(inventoryItemsTable.id, ingredientIds));

      const priceMap = new Map(
        ingredients.map((i) => [i.id, Number(i.productPrice) || 0]),
      );

      // Calculate menuPrice = sum of ingredient productPrices
      menuPrice = recipe.reduce((sum: number, r: any) => {
        return sum + (r.productPrice || priceMap.get(r.ingredientId) || 0);
      }, 0);

      // If no manual price provided, set actualPrice based on ingredient count
      if (!actualPrice) {
        if (recipe.length === 1) {
          // Single ingredient: use ingredient's productPrice
          const ing = ingredients.find((i) => i.id === recipe[0].ingredientId);
          drink.actualPrice = ing?.productPrice || 0;
        } else {
          // Multi-ingredient: use calculated menuPrice
          drink.actualPrice = menuPrice;
        }
      }
      drink.menuPrice = menuPrice;

      // Update drink with calculated prices
      await db
        .update(drinksTable)
        .set({ actualPrice: drink.actualPrice, menuPrice: menuPrice })
        .where(eq(drinksTable.id, drink.id));

      // Save recipe with ingredient productPrices
      await db.insert(recipeIngredientsTable).values(
        recipe.map(
          (r: any) =>
            ({
              drinkId: drink.id,
              ingredientId: r.ingredientId,
              amountInBaseUnit: Number(r.amountInBaseUnit),
              isDefault: r.isDefault ? 1 : 0,
              defaultCost: r.defaultCost ? Number(r.defaultCost) : null,
              productPrice: r.productPrice || priceMap.get(r.ingredientId) || 0,
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
      updatedAt: Math.floor(Date.now() / 1000),
    };
    if (data.name != null) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.category != null) updateData.category = data.category as any;
    if (data.markupFactor != null)
      updateData.markupFactor = Number(data.markupFactor);
    if (data.actualPrice !== undefined) {
      updateData.actualPrice =
        data.actualPrice != null ? Number(data.actualPrice) : undefined;
      updateData.priceSource = data.actualPrice != null ? "manual" : "auto";
    }
    if (data.basePriceOverride !== undefined) {
      updateData.basePriceOverride =
        data.basePriceOverride != null ? Number(data.basePriceOverride) : undefined;
    }
    if (data.isAvailable != null) updateData.isAvailable = data.isAvailable;

    // Validate isOnMenu requires recipe
    if (data.isOnMenu === true) {
      const [existing] = await db
        .select()
        .from(drinksTable)
        .where(eq(drinksTable.id, req.params.id as string))
        .limit(1);

      if (existing && existing.isOnMenu !== 1) {
        // Check if recipe exists or if it's inventory_single
        const recipeRows = await db
          .select()
          .from(recipeIngredientsTable)
          .where(eq(recipeIngredientsTable.drinkId, req.params.id as string));

        const isInventorySingle = existing.sourceType === "inventory_single";
        if (recipeRows.length === 0 && !isInventorySingle) {
          res.status(400).json({
            error:
              "Cannot enable menu: recipe must have at least one ingredient",
          });
          return;
        }
      }
    }
    if (data.isOnMenu != null) updateData.isOnMenu = data.isOnMenu;
    if (data.isApproved != null) updateData.isApproved = data.isApproved ? 1 : 0;

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
        // Calculate menuPrice from recipe
        const ingredientIds = data.recipe.map((r: any) => r.ingredientId);
        const ingredients = await db
          .select({
            id: inventoryItemsTable.id,
            productPrice: inventoryItemsTable.productPrice,
          })
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, ingredientIds[0]));

        const priceMap = new Map(
          ingredients.map((i) => [i.id, i.productPrice || 0]),
        );

        const menuPrice = data.recipe.reduce((sum: number, r: any) => {
          return sum + (r.productPrice || priceMap.get(r.ingredientId) || 0);
        }, 0);

        // Update menuPrice
        if (drink.priceSource === "auto") {
          const newActualPrice =
            data.recipe.length === 1
              ? priceMap.get(data.recipe[0].ingredientId) || 0
              : menuPrice;
          await db
            .update(drinksTable)
            .set({ actualPrice: newActualPrice, menuPrice })
            .where(eq(drinksTable.id, drink.id));
        } else {
          await db
            .update(drinksTable)
            .set({ menuPrice })
            .where(eq(drinksTable.id, drink.id));
        }

        await db.insert(recipeIngredientsTable).values(
          data.recipe.map(
            (r: any) =>
              ({
                drinkId: drink.id,
                ingredientId: r.ingredientId,
                amountInBaseUnit: Number(r.amountInBaseUnit),
                isDefault: r.isDefault ? 1 : 0,
                defaultCost: r.defaultCost ? Number(r.defaultCost) : null,
                productPrice:
                  r.productPrice || priceMap.get(r.ingredientId) || 0,
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
    const id = req.params.id as string;
    
    // First delete associated recipe ingredients (cascade)
    await db
      .delete(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.drinkId, id));
    
    // Then soft-delete the drink
    const [drink] = await db
      .update(drinksTable)
      .set({ isDeleted: 1, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(drinksTable.id, id))
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
