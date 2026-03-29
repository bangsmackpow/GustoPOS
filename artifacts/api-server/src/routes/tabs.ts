import { Router, type IRouter, type Request, type Response } from "express";
import { db, tabsTable, ordersTable, usersTable, drinksTable, recipeIngredientsTable, ingredientsTable, settingsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  CreateTabBody,
  UpdateTabBody,
  CloseTabBody,
  AddOrderToTabBody,
  UpdateOrderBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getExchangeRates() {
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "default"));
  return {
    usdToMxn: settings ? Number(settings.usdToMxnRate) : 17.5,
    cadToMxn: settings ? Number(settings.cadToMxnRate) : 12.8,
  };
}

function formatTab(tab: typeof tabsTable.$inferSelect, staffUserName?: string | null, rates?: { usdToMxn: number; cadToMxn: number }) {
  const totalMxn = Number(tab.totalMxn);
  let convertedTotal: number | null = null;
  if (rates) {
    if (tab.currency === "USD") convertedTotal = totalMxn / rates.usdToMxn;
    else if (tab.currency === "CAD") convertedTotal = totalMxn / rates.cadToMxn;
    else convertedTotal = totalMxn;
  }
  return {
    id: tab.id,
    nickname: tab.nickname,
    status: tab.status,
    staffUserId: tab.staffUserId,
    staffUserName: staffUserName ?? null,
    shiftId: tab.shiftId ?? null,
    totalMxn,
    paymentMethod: tab.paymentMethod ?? null,
    currency: tab.currency,
    convertedTotal,
    openedAt: tab.openedAt.toISOString(),
    closedAt: tab.closedAt?.toISOString() ?? null,
    notes: tab.notes ?? null,
  };
}

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    tabId: order.tabId,
    drinkId: order.drinkId,
    drinkName: order.drinkName,
    drinkNameEs: order.drinkNameEs ?? null,
    quantity: order.quantity,
    unitPriceMxn: Number(order.unitPriceMxn),
    totalPriceMxn: Number(order.unitPriceMxn) * order.quantity,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}

async function recalcTabTotal(tabId: string) {
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.tabId, tabId));
  const total = orders.reduce((sum, o) => sum + Number(o.unitPriceMxn) * o.quantity, 0);
  await db.update(tabsTable).set({ totalMxn: String(total) }).where(eq(tabsTable.id, tabId));
  return total;
}

router.get("/tabs", async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const shiftId = req.query.shiftId as string | undefined;

  let query = db.select().from(tabsTable).orderBy(desc(tabsTable.openedAt)) as any;

  const tabs = await db.select().from(tabsTable).orderBy(desc(tabsTable.openedAt));
  const rates = await getExchangeRates();

  const filtered = tabs.filter(t => {
    if (status && status !== "all" && t.status !== status) return false;
    if (shiftId && t.shiftId !== shiftId) return false;
    return true;
  });

  const userIds = [...new Set(filtered.map(t => t.staffUserId))];
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(sql`${usersTable.id} = ANY(${userIds})`)
    : [];
  const userMap = new Map(users.map(u => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id]));

  res.json(filtered.map(t => formatTab(t, userMap.get(t.staffUserId), rates)));
});

router.post("/tabs", async (req: Request, res: Response) => {
  const parsed = CreateTabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  const { nickname, staffUserId, shiftId, currency, notes } = parsed.data;
  const [tab] = await db.insert(tabsTable).values({
    nickname,
    staffUserId,
    shiftId: shiftId ?? null,
    currency: currency as any,
    notes: notes ?? null,
    status: "open",
    totalMxn: "0",
  }).returning();

  const rates = await getExchangeRates();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, staffUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;
  res.status(201).json(formatTab(tab, userName, rates));
});

router.get("/tabs/:id", async (req: Request, res: Response) => {
  const [tab] = await db.select().from(tabsTable).where(eq(tabsTable.id, req.params.id as string));
  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.tabId, tab.id)).orderBy(ordersTable.createdAt);
  const rates = await getExchangeRates();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tab.staffUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;

  res.json({
    ...formatTab(tab, userName, rates),
    orders: orders.map(formatOrder),
  });
});

router.patch("/tabs/:id", async (req: Request, res: Response) => {
  const parsed = UpdateTabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;
  const updateData: Partial<typeof tabsTable.$inferInsert> = {};
  if (data.nickname != null) updateData.nickname = data.nickname;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.currency != null) updateData.currency = data.currency as any;

  const [tab] = await db.update(tabsTable).set(updateData).where(eq(tabsTable.id, req.params.id as string)).returning();
  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }
  const rates = await getExchangeRates();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tab.staffUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;
  res.json(formatTab(tab, userName, rates));
});

router.post("/tabs/:id/close", async (req: Request, res: Response) => {
  const parsed = CloseTabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { paymentMethod, notes } = parsed.data;
  const [tab] = await db.update(tabsTable).set({
    status: "closed",
    paymentMethod: paymentMethod as any,
    closedAt: new Date(),
    notes: notes ?? undefined,
  }).where(eq(tabsTable.id, req.params.id as string)).returning();
  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }
  const rates = await getExchangeRates();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tab.staffUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;
  res.json(formatTab(tab, userName, rates));
});

router.post("/tabs/:id/orders", async (req: Request, res: Response) => {
  const parsed = AddOrderToTabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { drinkId, quantity, notes } = parsed.data;

  const [tab] = await db.select().from(tabsTable).where(eq(tabsTable.id, req.params.id as string));
  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }
  if (tab.status === "closed") {
    res.status(400).json({ error: "Cannot add orders to a closed tab" });
    return;
  }

  const drinkResult = await db
    .select({
      drink: drinksTable,
      recipe: recipeIngredientsTable,
      ingredient: ingredientsTable,
    })
    .from(drinksTable)
    .leftJoin(recipeIngredientsTable, eq(recipeIngredientsTable.drinkId, drinksTable.id))
    .leftJoin(ingredientsTable, eq(recipeIngredientsTable.ingredientId, ingredientsTable.id))
    .where(eq(drinksTable.id, drinkId));

  if (drinkResult.length === 0) {
    res.status(404).json({ error: "Drink not found" });
    return;
  }

  const drink = drinkResult[0].drink;
  const recipe = drinkResult.filter(r => r.recipe).map(r => ({
    ingredientId: r.recipe!.ingredientId,
    amountInMl: Number(r.recipe!.amountInMl),
    costPerUnit: r.ingredient ? Number(r.ingredient.costPerUnit) : 0,
    unitSize: r.ingredient ? Number(r.ingredient.unitSize) : 1,
  }));

  const costPerDrink = recipe.reduce((sum, r) => {
    return sum + (r.unitSize > 0 ? (r.amountInMl / r.unitSize) * r.costPerUnit : 0);
  }, 0);
  const markupFactor = Number(drink.markupFactor);
  const upcharge = Number(drink.upcharge);
  const suggestedPrice = costPerDrink * markupFactor + upcharge;
  const unitPriceMxn = drink.actualPrice != null ? Number(drink.actualPrice) : suggestedPrice;

  // Transaction for order insertion and stock decrement
  const order = await db.transaction(async (tx) => {
    // 1. Decrement stock for each recipe ingredient
    for (const item of recipe) {
      if (item.ingredientId && item.amountInMl > 0) {
        await tx.update(ingredientsTable)
          .set({
            currentStock: sql`${ingredientsTable.currentStock} - ${item.amountInMl.toString()}`
          })
          .where(eq(ingredientsTable.id, item.ingredientId));
      }
    }

    // 2. Insert order
    const [newOrder] = await tx.insert(ordersTable).values({
      tabId: req.params.id as string,
      drinkId,
      drinkName: drink.name,
      drinkNameEs: drink.nameEs ?? null,
      quantity,
      unitPriceMxn: String(unitPriceMxn),
      notes: notes ?? null,
    } as typeof ordersTable.$inferInsert).returning();

    return newOrder;
  });

  await recalcTabTotal(req.params.id as string);

  res.status(201).json(formatOrder(order));
});

router.patch("/orders/:id", async (req: Request, res: Response) => {
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;

  const [existingOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.id as string));
  if (!existingOrder) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const updateData: Partial<typeof ordersTable.$inferInsert> = {};
  if (data.quantity != null) updateData.quantity = data.quantity;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const order = await db.transaction(async (tx) => {
    // 1. If quantity changed, adjust stock
    if (data.quantity != null && data.quantity !== existingOrder.quantity) {
      const diff = data.quantity - existingOrder.quantity;
      const recipe = await tx.select()
        .from(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, existingOrder.drinkId));

      for (const item of recipe) {
        await tx.update(ingredientsTable)
          .set({
            currentStock: sql`${ingredientsTable.currentStock} - ${(Number(item.amountInMl) * diff).toString()}`
          })
          .where(eq(ingredientsTable.id, item.ingredientId));
      }
    }

    // 2. Update order
    const [updatedOrder] = await tx.update(ordersTable).set(updateData).where(eq(ordersTable.id, req.params.id as string)).returning();
    return updatedOrder;
  });

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  await recalcTabTotal(order.tabId);
  res.json(formatOrder(order));
});

router.delete("/orders/:id", async (req: Request, res: Response) => {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.id as string));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Get recipe for restoration
  const recipe = await db.select()
    .from(recipeIngredientsTable)
    .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

  await db.transaction(async (tx) => {
    // 1. Restore stock
    for (const item of recipe) {
      await tx.update(ingredientsTable)
        .set({
          currentStock: sql`${ingredientsTable.currentStock} + ${item.amountInMl.toString()}`
        })
        .where(eq(ingredientsTable.id, item.ingredientId));
    }

    // 2. Delete order
    await tx.delete(ordersTable).where(eq(ordersTable.id, req.params.id as string));
  });

  await recalcTabTotal(order.tabId);
  res.json({ success: true });
});

export default router;
