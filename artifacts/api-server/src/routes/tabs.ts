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
  specialsTable,
  orderModificationsTable,
} from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import {
  CreateTabBody,
  UpdateTabBody,
  CloseTabBody,
  AddOrderToTabBody,
  UpdateOrderBody,
  ModifyOrderIngredientBody,
} from "@workspace/api-zod";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

async function getExchangeRates() {
  try {
    const [settings] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, "default"));
    return {
      usdToMxn: settings ? Number(settings.usdToMxnRate) : 17.5,
      cadToMxn: settings ? Number(settings.cadToMxnRate) : 12.8,
    };
  } catch (err: any) {
    console.error("[getExchangeRates] Error, using defaults:", err.message);
    return { usdToMxn: 17.5, cadToMxn: 12.8 };
  }
}

function isSpecialActiveNow(
  special: typeof specialsTable.$inferSelect,
): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const nowUnix = Math.floor(now.getTime() / 1000);

  if (special.isActive !== 1) return false;

  if (special.daysOfWeek) {
    const days = special.daysOfWeek
      .split(",")
      .map((d) => parseInt(d.trim(), 10));
    if (!days.includes(dayOfWeek)) return false;
  }

  if (special.startHour !== null && special.startHour !== undefined) {
    if (hour < special.startHour) return false;
  }

  if (special.endHour !== null && special.endHour !== undefined) {
    if (hour > special.endHour) return false;
  }

  if (special.startDate && nowUnix < special.startDate) return false;
  if (special.endDate && nowUnix > special.endDate) return false;

  return true;
}

async function getActiveSpecialForDrink(
  drinkId: string,
  drinkCategory: string,
): Promise<{
  discountType: string;
  discountValue: number;
  name: string;
} | null> {
  let allSpecials;
  try {
    allSpecials = await db.select().from(specialsTable);
  } catch (err: any) {
    console.warn(
      "[getActiveSpecial] Specials table query failed:",
      err.message,
    );
    return null;
  }
  const activeSpecials = allSpecials.filter(isSpecialActiveNow);

  if (activeSpecials.length === 0) return null;

  let bestSpecial: {
    discountType: string;
    discountValue: number;
    name: string;
  } | null = null;

  for (const special of activeSpecials) {
    let applies = false;

    if (special.drinkId && special.drinkId === drinkId) {
      applies = true;
    } else if (special.category && special.category === drinkCategory) {
      applies = true;
    } else if (!special.drinkId && !special.category) {
      applies = true;
    }

    if (applies) {
      if (!bestSpecial || special.discountValue > bestSpecial.discountValue) {
        bestSpecial = {
          discountType: special.discountType,
          discountValue: special.discountValue,
          name: special.name || "Special",
        };
      }
    }
  }

  return bestSpecial;
}

async function finalizeTabInventory(tabId: string) {
  const tabOrders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.tabId, tabId));

  const activeOrders = tabOrders.filter((o) => !o.voided);

  await db.transaction(async (tx) => {
    for (const order of activeOrders) {
      const recipe = await tx
        .select()
        .from(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

      for (const item of recipe) {
        if (!item.ingredientId) continue;
        const [ing] = await tx
          .select({ parentItemId: inventoryItemsTable.parentItemId })
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, item.ingredientId));

        const targetId = ing?.parentItemId || item.ingredientId;
        const deductionAmount = Number(item.amountInBaseUnit) * order.quantity;

        const [ingredient] = await tx
          .select()
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, targetId));

        if (ingredient) {
          await tx
            .update(inventoryItemsTable)
            .set({
              currentStock: Math.max(
                0,
                (ingredient.currentStock ?? 0) - deductionAmount,
              ),
              reservedStock: 0,
            })
            .where(eq(inventoryItemsTable.id, targetId));
        }
      }
    }
  });
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
    openedAt: tab.openedAt,
    closedAt: tab.closedAt ?? null,
    notes: tab.notes ?? null,
  };
}

function formatOrder(order: typeof ordersTable.$inferSelect) {
  const discountMxn = Number(order.discountMxn) || 0;
  return {
    id: order.id,
    tabId: order.tabId,
    drinkId: order.drinkId,
    drinkName: order.drinkName,
    quantity: order.quantity,
    unitPriceMxn: Number(order.unitPriceMxn),
    discountMxn,
    totalPriceMxn: Number(order.unitPriceMxn) * order.quantity - discountMxn,
    notes: order.notes ?? null,
    createdAt: order.createdAt,
    voided: order.voided === 1,
    voidReason: order.voidReason ?? null,
    voidedByUserId: order.voidedByUserId ?? null,
    voidedAt: order.voidedAt ?? null,
  };
}

async function recalcTabTotal(tabId: string) {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.tabId, tabId));
  const total = orders
    .filter((o) => o.voided !== 1)
    .reduce(
      (sum, o) =>
        sum +
        Number(o.unitPriceMxn) * o.quantity -
        (Number(o.discountMxn) || 0),
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

  // Recalculate tab total before closing to ensure accuracy
  await recalcTabTotal(req.params.id as string);
  const [updatedTab] = await db
    .select()
    .from(tabsTable)
    .where(eq(tabsTable.id, req.params.id as string));

  if (payments && payments.length > 0) {
    // Split bill: multiple payments
    const totalPaid = payments.reduce((sum, p) => sum + p.amountMxn, 0);
    const totalTips = payments.reduce((sum, p) => sum + (p.tipMxn ?? 0), 0);
    const tabTotal = Number(updatedTab.totalMxn);

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
        closedAt: Math.floor(Date.now() / 1000),
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
        totalMxn: updatedTab.totalMxn,
      },
    });

    await finalizeTabInventory(req.params.id as string);
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
        closedAt: Math.floor(Date.now() / 1000),
        notes: notes ?? undefined,
        tipMxn: tipMxn ?? 0,
      })
      .where(eq(tabsTable.id, req.params.id as string))
      .returning();

    await finalizeTabInventory(req.params.id as string);
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
        grandTotal: Number(updatedTab.totalMxn) + (tipMxn ?? 0),
        totalMxn: updatedTab.totalMxn,
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
  // TODO: Pricing overhaul - markupFactor needs to be replaced
  const markupFactor = Number(drink.markupFactor || 3.0);
  const suggestedPrice = costPerDrink * markupFactor;
  let unitPriceMxn =
    drink.actualPrice != null ? Number(drink.actualPrice) : suggestedPrice;

  const activeSpecial = await getActiveSpecialForDrink(
    drinkId,
    drink.category || "",
  );
  let appliedSpecialName: string | null = null;
  if (activeSpecial) {
    const specialDiscount =
      activeSpecial.discountType === "percentage"
        ? (unitPriceMxn * activeSpecial.discountValue) / 100
        : activeSpecial.discountValue;
    unitPriceMxn = Math.max(0, unitPriceMxn - specialDiscount);
    appliedSpecialName = activeSpecial.name;
  }

  const order = await db.transaction(async (tx) => {
    for (const item of recipe) {
      if (item.ingredientId && item.amountInBaseUnit > 0) {
        const [ing] = await tx
          .select()
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, item.ingredientId));

        const targetId = ing?.parentItemId || item.ingredientId;

        const [ingredient] = await tx
          .select()
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, targetId));

        const reserveAmount = item.amountInBaseUnit * quantity;

        const availableStock =
          (ingredient?.currentStock ?? 0) + (ingredient?.reservedStock ?? 0);
        if (availableStock < reserveAmount) {
          throw Object.assign(
            new Error(
              `Insufficient stock for ${ingredient?.name || "ingredient"}. Need ${reserveAmount.toFixed(1)}, have ${availableStock.toFixed(1)}`,
            ),
            {
              ingredientId: targetId,
              needed: reserveAmount,
              available: availableStock,
            },
          );
        }

        await tx
          .update(inventoryItemsTable)
          .set({
            reservedStock:
              sql`COALESCE(${inventoryItemsTable.reservedStock}, 0) + ${reserveAmount}` as any,
          })
          .where(eq(inventoryItemsTable.id, targetId));
      }
    }

    const [newOrder] = await tx
      .insert(ordersTable)
      .values({
        tabId: req.params.id as string,
        drinkId,
        drinkName: drink.name,

        quantity,
        unitPriceMxn: Number(unitPriceMxn),
        taxCategory: drink.taxCategory ?? "standard",
        taxRate: Number(drink.taxRate) || 0,
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

      if (diff > 0) {
        for (const item of recipe) {
          if (!item.ingredientId) continue;
          const [ing] = await tx
            .select({ parentItemId: inventoryItemsTable.parentItemId })
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, item.ingredientId));

          const targetId = ing?.parentItemId || item.ingredientId;

          const [ingredient] = await tx
            .select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, targetId));
          const required = Number(item.amountInBaseUnit) * diff;
          const available =
            (ingredient?.currentStock ?? 0) + (ingredient?.reservedStock ?? 0);
          if (!ingredient || available < required) {
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
        const [ing] = await tx
          .select({ parentItemId: inventoryItemsTable.parentItemId })
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, item.ingredientId));

        const targetId = ing?.parentItemId || item.ingredientId;

        await tx
          .update(inventoryItemsTable)
          .set({
            reservedStock:
              sql`COALESCE(${inventoryItemsTable.reservedStock}, 0) + ${adjustment}` as any,
          })
          .where(eq(inventoryItemsTable.id, targetId));
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
    return res.status(404).json({ error: "Order not found" });
  }

  const voidReason = req.body?.reason as string | undefined;
  const voidedByUserId = req.body?.voidedByUserId as string | undefined;
  const managerUserId = req.body?.managerUserId as string | undefined;
  const managerPin = req.body?.managerPin as string | undefined;

  if (!managerUserId || !managerPin) {
    return res.status(400).json({
      error: "Manager authorization required",
      code: "MANAGER_REQUIRED",
    });
  }

  const [manager] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, managerUserId))
    .limit(1);

  if (!manager || manager.role !== "admin") {
    return res.status(403).json({
      error: "Manager authorization required",
      code: "INVALID_MANAGER",
    });
  }

  const pinValid = await import("bcryptjs").then((bcrypt) =>
    bcrypt.compare(managerPin, manager.pin || ""),
  );

  if (!pinValid) {
    return res.status(403).json({
      error: "Invalid manager credentials",
      code: "INVALID_PIN",
    });
  }

  const recipe = await db
    .select()
    .from(recipeIngredientsTable)
    .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

  await db.transaction(async (tx) => {
    for (const item of recipe) {
      if (!item.ingredientId) continue;
      const [ing] = await tx
        .select({ parentItemId: inventoryItemsTable.parentItemId })
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, item.ingredientId));

      const targetId = ing?.parentItemId || item.ingredientId;
      const releaseAmount = Number(item.amountInBaseUnit) * order.quantity;

      await tx
        .update(inventoryItemsTable)
        .set({
          reservedStock:
            sql`GREATEST(0, COALESCE(${inventoryItemsTable.reservedStock}, 0) - ${releaseAmount})` as any,
        })
        .where(eq(inventoryItemsTable.id, targetId));
    }

    await tx
      .update(ordersTable)
      .set({
        voided: 1,
        voidReason: voidReason || null,
        voidedByUserId: voidedByUserId || null,
        voidedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(ordersTable.id, req.params.id as string));
  });

  await recalcTabTotal(order.tabId);
  return res.json({ success: true });
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
      const tabOrders = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.tabId, req.params.id as string));

      const activeOrders = tabOrders.filter((o) => !o.voided);

      for (const order of activeOrders) {
        const recipe = await tx
          .select()
          .from(recipeIngredientsTable)
          .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

        for (const item of recipe) {
          if (!item.ingredientId) continue;
          const [ing] = await tx
            .select({ parentItemId: inventoryItemsTable.parentItemId })
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, item.ingredientId));

          const targetId = ing?.parentItemId || item.ingredientId;
          const releaseAmount = Number(item.amountInBaseUnit) * order.quantity;

          const [ingredient] = await tx
            .select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, targetId));

          if (ingredient) {
            const returnToStock = Math.min(
              releaseAmount,
              ingredient.reservedStock ?? 0,
            );
            await tx
              .update(inventoryItemsTable)
              .set({
                currentStock: (ingredient.currentStock ?? 0) + returnToStock,
                reservedStock: Math.max(
                  0,
                  (ingredient.reservedStock ?? 0) - returnToStock,
                ),
              })
              .where(eq(inventoryItemsTable.id, targetId));
          }
        }
      }

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

router.patch("/orders/:id/discount", async (req: Request, res: Response) => {
  const { discountType, discountValue } = req.body;

  if (!discountType || discountValue === undefined) {
    res
      .status(400)
      .json({ error: "discountType and discountValue are required" });
    return;
  }

  if (!["percentage", "fixed_amount"].includes(discountType)) {
    res
      .status(400)
      .json({ error: "discountType must be 'percentage' or 'fixed_amount'" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.id as string));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.voided === 1) {
    res.status(400).json({ error: "Cannot discount a voided order" });
    return;
  }

  const basePrice = Number(order.unitPriceMxn) * order.quantity;
  const specialDiscount = Number(order.discountMxn) || 0;

  let newDiscount: number;
  if (discountType === "percentage") {
    newDiscount = (basePrice * Number(discountValue)) / 100;
  } else {
    newDiscount = Number(discountValue);
  }

  newDiscount = Math.min(newDiscount, basePrice);

  if (newDiscount > specialDiscount) {
    await db
      .update(ordersTable)
      .set({
        discountMxn: newDiscount,
      })
      .where(eq(ordersTable.id, req.params.id as string));

    await recalcTabTotal(order.tabId);

    res.json({
      success: true,
      discountMxn: newDiscount,
      message: "Discount applied (greater discount)",
    });
  } else {
    res.json({
      success: true,
      discountMxn: specialDiscount,
      message: "Existing discount is greater, keeping current",
    });
  }
});

/**
 * PATCH /orders/:id/modify-ingredient
 * Substitute an ingredient in an order with full stock and price tracking
 */
router.patch(
  "/orders/:id/modify-ingredient",
  async (req: Request, res: Response) => {
    const parsed = ModifyOrderIngredientBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error });
      return;
    }

    const { recipeLineIndex, newIngredientId, notes } = parsed.data;
    const modifiedByUserId = (req as any).user?.id || "system";

    try {
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, req.params.id as string));

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (order.voided === 1) {
        res.status(400).json({ error: "Cannot modify a voided order" });
        return;
      }

      // Get the drink recipe
      const recipe = await db
        .select()
        .from(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, order.drinkId));

      if (
        !recipe ||
        recipe.length === 0 ||
        recipeLineIndex < 0 ||
        recipeLineIndex >= recipe.length
      ) {
        res.status(400).json({
          error: "Invalid recipe line index",
        });
        return;
      }

      const recipeItem = recipe[recipeLineIndex];
      const originalIngredientId = recipeItem.ingredientId;

      // Validate new ingredient exists
      const [newIngredient] = await db
        .select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, newIngredientId));

      if (!newIngredient) {
        res.status(404).json({ error: "New ingredient not found" });
        return;
      }

      // Get original ingredient for cost calculation
      const [originalIngredient] = await db
        .select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, originalIngredientId));

      if (!originalIngredient) {
        res.status(404).json({ error: "Original ingredient not found" });
        return;
      }

      const amountNeeded = Number(recipeItem.amountInBaseUnit) || 1;

      // Check stock availability for new ingredient
      const newIngAvailable =
        (Number(newIngredient.currentStock) || 0) +
        (Number(newIngredient.reservedStock) || 0);
      if (newIngAvailable < amountNeeded) {
        res.status(400).json({
          error: "Insufficient stock for new ingredient",
          available: newIngAvailable,
          needed: amountNeeded,
        });
        return;
      }

      // Calculate price difference
      // Cost per unit: orderCost is the cost of new inventory
      const origCostPerUnit = Number(originalIngredient.orderCost) || 0;
      const newCostPerUnit = Number(newIngredient.orderCost) || 0;

      const origCost = origCostPerUnit * amountNeeded;
      const newCost = newCostPerUnit * amountNeeded;
      const costDifference = newCost - origCost;

      // For quantity > 1, apply price difference to all units
      const priceDifference = costDifference * order.quantity;

      // Execute all changes in a transaction
      const result = await db.transaction(async (tx) => {
        // 1. Release reserved stock from original ingredient
        const origTargetId =
          originalIngredient.parentItemId || originalIngredientId;
        await tx
          .update(inventoryItemsTable)
          .set({
            reservedStock:
              sql`COALESCE(${inventoryItemsTable.reservedStock}, 0) - ${amountNeeded * order.quantity}` as any,
          })
          .where(eq(inventoryItemsTable.id, origTargetId));

        // 2. Reserve stock from new ingredient
        const newTargetId = newIngredient.parentItemId || newIngredientId;
        await tx
          .update(inventoryItemsTable)
          .set({
            reservedStock:
              sql`COALESCE(${inventoryItemsTable.reservedStock}, 0) + ${amountNeeded * order.quantity}` as any,
          })
          .where(eq(inventoryItemsTable.id, newTargetId));

        // 3. Update order with new price
        const newUnitPrice =
          Number(order.unitPriceMxn) + priceDifference / order.quantity;
        const [updatedOrder] = await tx
          .update(ordersTable)
          .set({
            unitPriceMxn: newUnitPrice,
          })
          .where(eq(ordersTable.id, req.params.id as string))
          .returning();

        // 4. Record the modification for audit trail
        await tx.insert(orderModificationsTable).values({
          orderId: order.id,
          recipeLineIndex,
          originalIngredientId,
          originalIngredientName: originalIngredient.name,
          originalAmount: amountNeeded,
          replacementIngredientId: newIngredientId,
          replacementIngredientName: newIngredient.name,
          replacementAmount: amountNeeded,
          priceDifferenceMxn: priceDifference,
          modifiedByUserId,
          notes: notes || null,
        } as any);

        return updatedOrder;
      });

      // Recalculate tab total
      await recalcTabTotal(order.tabId);

      // Log the modification
      await logEvent({
        action: "modify_order_ingredient",
        userId: modifiedByUserId,
        entityType: "order",
        entityId: order.id,
        newValue: {
          originalIngredient: originalIngredient.name,
          newIngredient: newIngredient.name,
          priceDifference,
        },
      });

      res.json(formatOrder(result));
    } catch (err: any) {
      console.error("Error modifying order ingredient:", err);
      res.status(500).json({
        error: "Failed to modify order ingredient",
        details: err.message,
      });
    }
  },
);

export default router;
