import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  tabsTable,
  ordersTable,
  usersTable,
  drinksTable,
  recipeIngredientsTable,
  inventoryItemsTable,
  settingsTable,
  tabPaymentsTable,
} from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import {
  CreateTabBody,
  UpdateTabBody,
  CloseTabBody,
  AddOrderToTabBody,
  UpdateOrderBody,
} from "@workspace/api-zod";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

async function getExchangeRates() {
  const [settings] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, "default"));
  return {
    usdToMxn: settings ? Number(settings.usdToMxnRate) : 17.5,
    cadToMxn: settings ? Number(settings.cadToMxnRate) : 12.8,
  };
}

function formatTab(
  tab: typeof tabsTable.$inferSelect,
  staffUserName?: string | null,
  rates?: { usdToMxn: number; cadToMxn: number },
) {
  const totalMxn = Number(tab.totalMxn);
  const tipMxn = Number(tab.tipMxn || 0);
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
    tipMxn,
    grandTotalMxn: totalMxn + tipMxn,
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
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.tabId, tabId));
  const total = orders.reduce(
    (sum, o) => sum + Number(o.unitPriceMxn) * o.quantity,
    0,
  );
  await db
    .update(tabsTable)
    .set({ totalMxn: total })
    .where(eq(tabsTable.id, tabId));
  return total;
}

router.get("/tabs", async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const shiftId = req.query.shiftId as string | undefined;

  const tabs =
    status && status !== "all"
      ? await db
          .select()
          .from(tabsTable)
          .where(eq(tabsTable.status, status))
          .orderBy(desc(tabsTable.openedAt))
      : await db.select().from(tabsTable).orderBy(desc(tabsTable.openedAt));

  const filtered = shiftId ? tabs.filter((t) => t.shiftId === shiftId) : tabs;

  const rates = await getExchangeRates();

  const userIds = [...new Set(filtered.map((t) => t.staffUserId))];
  const users =
    userIds.length > 0
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, userIds))
      : [];
  const userMap = new Map(
    users.map((u) => [
      u.id,
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id,
    ]),
  );

  res.json(
    filtered.map((t) => formatTab(t, userMap.get(t.staffUserId), rates)),
  );
});

router.post("/tabs", async (req: Request, res: Response) => {
  try {
    const parsed = CreateTabBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error });
      return;
    }
    const { nickname, staffUserId, shiftId, currency, notes } = parsed.data;
    const [tab] = await db
      .insert(tabsTable)
      .values({
        nickname,
        staffUserId,
        shiftId: shiftId ?? null,
        currency: currency as any,
        notes: notes ?? null,
        status: "open",
        totalMxn: 0,
      } as typeof tabsTable.$inferInsert)
      .returning();

    const rates = await getExchangeRates();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, staffUserId));
    const userName = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.email ||
        user.id
      : null;
    res.status(201).json(formatTab(tab, userName, rates));
  } catch (err: any) {
    console.error("[POST /api/tabs] Error creating tab:", err);
    console.error(
      "[POST /api/tabs] Request body:",
      JSON.stringify(req.body, null, 2),
    );
    res
      .status(500)
      .json({ error: "Failed to create tab", details: err.message });
  }
});

router.get("/tabs/:id", async (req: Request, res: Response) => {
  const [tab] = await db
    .select()
    .from(tabsTable)
    .where(eq(tabsTable.id, req.params.id as string));
  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.tabId, tab.id))
    .orderBy(ordersTable.createdAt);
  const rates = await getExchangeRates();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, tab.staffUserId));
  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.email ||
      user.id
    : null;

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

  const [tab] = await db
    .update(tabsTable)
    .set(updateData)
    .where(eq(tabsTable.id, req.params.id as string))
    .returning();
  if (!tab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }
  const rates = await getExchangeRates();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, tab.staffUserId));
  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.email ||
      user.id
    : null;
  res.json(formatTab(tab, userName, rates));
});

router.post("/tabs/:id/close", async (req: Request, res: Response) => {
  const parsed = CloseTabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { paymentMethod, notes, tipMxn, payments } = parsed.data;
  const [existingTab] = await db
    .select()
    .from(tabsTable)
    .where(eq(tabsTable.id, req.params.id as string));
  if (!existingTab) {
    res.status(404).json({ error: "Tab not found" });
    return;
  }

  if (payments && payments.length > 0) {
    // Split bill: multiple payments
    const totalPaid = payments.reduce((sum, p) => sum + p.amountMxn, 0);
    const totalTips = payments.reduce((sum, p) => sum + (p.tipMxn ?? 0), 0);
    const tabTotal = Number(existingTab.totalMxn);

    if (Math.abs(totalPaid - tabTotal) > 0.01) {
      res.status(400).json({
        error: `Payment total (${totalPaid.toFixed(2)}) does not match tab total (${tabTotal.toFixed(2)})`,
      });
      return;
    }

    const [tab] = await db
      .update(tabsTable)
      .set({
        status: "closed",
        paymentMethod:
          payments.length > 1 ? "split" : payments[0].paymentMethod,
        closedAt: new Date(),
        notes: notes ?? undefined,
        tipMxn: totalTips,
      })
      .where(eq(tabsTable.id, req.params.id as string))
      .returning();

    for (const p of payments) {
      await db.insert(tabPaymentsTable).values({
        tabId: tab.id,
        amountMxn: p.amountMxn,
        tipMxn: p.tipMxn ?? 0,
        paymentMethod: p.paymentMethod,
      });
    }

    await logEvent({
      userId: (req as any).user?.id || existingTab.staffUserId || "system",
      action: "tab_close",
      entityType: "tab",
      entityId: tab.id,
      oldValue: { totalMxn: existingTab.totalMxn },
      newValue: {
        payments: payments.map((p) => ({
          amountMxn: p.amountMxn,
          paymentMethod: p.paymentMethod,
          tipMxn: p.tipMxn ?? 0,
        })),
        totalPaid,
        totalTips,
      },
    });

    const rates = await getExchangeRates();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, tab.staffUserId));
    const userName = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.email ||
        user.id
      : null;
    res.json(formatTab(tab, userName, rates));
  } else {
    // Single payment (legacy flow)
    if (!paymentMethod) {
      res.status(400).json({
        error: "paymentMethod is required when not using split payments",
      });
      return;
    }
    const [tab] = await db
      .update(tabsTable)
      .set({
        status: "closed",
        paymentMethod: paymentMethod as any,
        closedAt: new Date(),
        notes: notes ?? undefined,
        tipMxn: tipMxn ?? 0,
      })
      .where(eq(tabsTable.id, req.params.id as string))
      .returning();
    if (!tab) {
      res.status(404).json({ error: "Tab not found" });
      return;
    }

    await logEvent({
      userId: (req as any).user?.id || existingTab.staffUserId || "system",
      action: "tab_close",
      entityType: "tab",
      entityId: tab.id,
      oldValue: { totalMxn: existingTab.totalMxn },
      newValue: {
        paymentMethod,
        tipMxn: tipMxn ?? 0,
        grandTotal: Number(existingTab.totalMxn) + (tipMxn ?? 0),
      },
    });
    const rates = await getExchangeRates();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, tab.staffUserId));
    const userName = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.email ||
        user.id
      : null;
    res.json(formatTab(tab, userName, rates));
  }
});

router.post("/tabs/:id/orders", async (req: Request, res: Response) => {
  const parsed = AddOrderToTabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { drinkId, quantity, notes } = parsed.data;

  const [tab] = await db
    .select()
    .from(tabsTable)
    .where(eq(tabsTable.id, req.params.id as string));
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
      ingredient: inventoryItemsTable,
    })
    .from(drinksTable)
    .leftJoin(
      recipeIngredientsTable,
      eq(recipeIngredientsTable.drinkId, drinksTable.id),
    )
    .leftJoin(
      inventoryItemsTable,
      eq(recipeIngredientsTable.ingredientId, inventoryItemsTable.id),
    )
    .where(eq(drinksTable.id, drinkId));

  if (drinkResult.length === 0) {
    res.status(404).json({ error: "Drink not found" });
    return;
  }

  const drink = drinkResult[0].drink;
  const recipe = drinkResult
    .filter((r) => r.recipe)
    .map((r) => ({
      ingredientId: r.recipe!.ingredientId,
      amountInBaseUnit: Number(r.recipe!.amountInBaseUnit),
      costPerBaseUnit:
        r.ingredient &&
        r.ingredient.orderCost > 0 &&
        r.ingredient.baseUnitAmount > 0
          ? r.ingredient.orderCost / r.ingredient.baseUnitAmount
          : 0,
    }));

  const costPerDrink = recipe.reduce((sum, r) => {
    return sum + r.amountInBaseUnit * r.costPerBaseUnit;
  }, 0);
  const markupFactor = Number(drink.markupFactor);
  const suggestedPrice = costPerDrink * markupFactor;
  const unitPriceMxn =
    drink.actualPrice != null ? Number(drink.actualPrice) : suggestedPrice;

  const order = await db.transaction(async (tx) => {
    for (const item of recipe) {
      if (item.ingredientId && item.amountInBaseUnit > 0) {
        await tx
          .update(inventoryItemsTable)
          .set({
            currentStock:
              sql`${inventoryItemsTable.currentStock} - ${item.amountInBaseUnit}` as any,
          })
          .where(eq(inventoryItemsTable.id, item.ingredientId));
      }
    }

    const [newOrder] = await tx
      .insert(ordersTable)
      .values({
        tabId: req.params.id as string,
        drinkId,
        drinkName: drink.name,
        drinkNameEs: drink.nameEs ?? null,
        quantity,
        unitPriceMxn: Number(unitPriceMxn),
        notes: notes ?? null,
      } as typeof ordersTable.$inferInsert)
      .returning();

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

  const [existingOrder] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.id as string));
  if (!existingOrder) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const updateData: Partial<typeof ordersTable.$inferInsert> = {};
  if (data.quantity != null) updateData.quantity = data.quantity;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const order = await db.transaction(async (tx) => {
    if (data.quantity != null && data.quantity !== existingOrder.quantity) {
      const diff = data.quantity - existingOrder.quantity;
      const recipe = await tx
        .select()
        .from(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, existingOrder.drinkId));

      // Only check for stock if increasing quantity
      if (diff > 0) {
        for (const item of recipe) {
          if (!item.ingredientId) continue;
          const [ingredient] = await tx
            .select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, item.ingredientId));
          const required = Number(item.amountInBaseUnit) * diff;
          if (!ingredient || ingredient.currentStock < required) {
            throw Object.assign(
              new Error("Insufficient stock for ingredient"),
              {
                ingredientId: item.ingredientId,
              },
            );
          }
        }
      }

      for (const item of recipe) {
        if (!item.ingredientId) continue;
        const adjustment = Number(item.amountInBaseUnit) * diff;
        // Prevent negative inventory
        const [ingredient] = await tx
          .select()
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, item.ingredientId));
        const newStock = (ingredient?.currentStock ?? 0) - adjustment;
        if (newStock < 0) {
          throw Object.assign(new Error("Insufficient stock for ingredient"), {
            ingredientId: item.ingredientId,
          });
        }
        await tx
          .update(inventoryItemsTable)
          .set({
            currentStock: newStock,
          })
          .where(eq(inventoryItemsTable.id, item.ingredientId));
      }
    }

    const [updatedOrder] = await tx
      .update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, req.params.id as string))
      .returning();
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
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.id as string));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const recipe = await db
    .select()
    .from(recipeIngredientsTable)
    .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

  await db.transaction(async (tx) => {
    for (const item of recipe) {
      if (!item.ingredientId) continue;
      const [ingredient] = await tx
        .select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, item.ingredientId));
      const addBack = Number(item.amountInBaseUnit) * order.quantity;
      const newStock = (ingredient?.currentStock ?? 0) + addBack;
      if (newStock < 0) {
        throw Object.assign(
          new Error("Inventory would go negative for ingredient"),
          {
            ingredientId: item.ingredientId,
          },
        );
      }
      await tx
        .update(inventoryItemsTable)
        .set({
          currentStock: newStock,
        })
        .where(eq(inventoryItemsTable.id, item.ingredientId));
    }

    await tx
      .delete(ordersTable)
      .where(eq(ordersTable.id, req.params.id as string));
  });

  await recalcTabTotal(order.tabId);
  res.json({ success: true });
});

router.delete("/tabs/:id", async (req: Request, res: Response) => {
  try {
    const [tab] = await db
      .select()
      .from(tabsTable)
      .where(eq(tabsTable.id, req.params.id as string));
    if (!tab) {
      res.status(404).json({ error: "Tab not found" });
      return;
    }
    await db.transaction(async (tx) => {
      await tx
        .delete(ordersTable)
        .where(eq(ordersTable.tabId, req.params.id as string));
      await tx
        .delete(tabsTable)
        .where(eq(tabsTable.id, req.params.id as string));
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting tab:", err);
    res.status(500).json({ error: "Failed to delete tab" });
  }
});

export default router;
