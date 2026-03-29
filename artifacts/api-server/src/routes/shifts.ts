import { Router, type IRouter, type Request, type Response } from "express";
import { db, shiftsTable, tabsTable, ordersTable, usersTable, drinksTable, ingredientsTable, recipeIngredientsTable, settingsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { StartShiftBody } from "@workspace/api-zod";
import { sendShiftReport } from "../lib/email";

const router: IRouter = Router();

async function getReportData(shiftId: string) {
  const [shift] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, shiftId));
  if (!shift) return null;

  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "default"));
  const usdToMxn = settings ? Number(settings.usdToMxnRate) : 17.5;
  const cadToMxn = settings ? Number(settings.cadToMxnRate) : 12.8;

  const tabs = await db.select().from(tabsTable).where(eq(tabsTable.shiftId, shiftId));
  const closedTabs = tabs.filter(t => t.status === "closed");

  const tabIds = tabs.map(t => t.id);
  const allOrders = tabIds.length > 0
    ? await db.select().from(ordersTable).where(sql`${ordersTable.tabId} IN (${sql.raw(tabIds.map(id => `'${id}'`).join(','))})`)
    : [];

  const totalMxn = closedTabs.reduce((sum, t) => sum + Number(t.totalMxn), 0);
  const cashSalesMxn = closedTabs.filter(t => t.paymentMethod === "cash").reduce((sum, t) => sum + Number(t.totalMxn), 0);
  const cardSalesMxn = closedTabs.filter(t => t.paymentMethod === "card").reduce((sum, t) => sum + Number(t.totalMxn), 0);

  return {
    cashSalesMxn,
    cardSalesMxn,
    totalSalesMxn: totalMxn,
    totalTabsClosed: closedTabs.length,
  };
}

function formatShift(shift: typeof shiftsTable.$inferSelect, openedByUserName?: string | null) {
  return {
    id: shift.id,
    name: shift.name,
    startedAt: shift.startedAt.toISOString(),
    closedAt: shift.closedAt?.toISOString() ?? null,
    status: shift.status,
    openedByUserId: shift.openedByUserId,
    openedByUserName: openedByUserName ?? null,
  };
}

router.get("/shifts", async (req: Request, res: Response) => {
  const shifts = await db.select().from(shiftsTable).orderBy(desc(shiftsTable.startedAt));
  const userIds = [...new Set(shifts.map(s => s.openedByUserId))];
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(sql`${usersTable.id} IN (${sql.raw(userIds.map(id => `'${id}'`).join(','))})`)
    : [];
  const userMap = new Map(users.map(u => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id]));
  return res.json(shifts.map(s => formatShift(s, userMap.get(s.openedByUserId))));
});

router.post("/shifts", async (req: Request, res: Response) => {
  const parsed = StartShiftBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error });
  }
  const existing = await db.select().from(shiftsTable).where(eq(shiftsTable.status, "active"));
  if (existing.length > 0) {
    return res.status(400).json({ error: "There is already an active shift. Close it before starting a new one." });
  }
  const { name, openedByUserId } = parsed.data;
  const [shift] = await db.insert(shiftsTable).values({ name, openedByUserId, status: "active" }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, openedByUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;
  return res.status(201).json(formatShift(shift, userName));
});

router.get("/shifts/active", async (req: Request, res: Response) => {
  const [shift] = await db.select().from(shiftsTable).where(eq(shiftsTable.status, "active"));
  if (!shift) {
    return res.json({ shift: null });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, shift.openedByUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;
  return res.json({ shift: formatShift(shift, userName) });
});

router.post("/shifts/:id/close", async (req: Request, res: Response) => {
  const [shift] = await db.update(shiftsTable)
    .set({ status: "closed", closedAt: new Date() })
    .where(eq(shiftsTable.id, req.params.id as string))
    .returning();
  if (!shift) {
    return res.status(404).json({ error: "Shift not found" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, shift.openedByUserId));
  const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;

  // Send email report
  (async () => {
    try {
      const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "default"));
      if (settings?.inventoryAlertEmail) {
        const reportData = await getReportData(shift.id);
        if (reportData) {
          await sendShiftReport(shift.id, settings.inventoryAlertEmail, reportData);
        }
      }
    } catch (err) {
      console.error("Failed to send shift report email:", err);
    }
  })();

  return res.json(formatShift(shift, userName));
});

router.get("/reports/end-of-night/:shiftId", async (req: Request, res: Response) => {
  const shiftId = req.params.shiftId as string;
  const [shift] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, shiftId));
  if (!shift) {
    return res.status(404).json({ error: "Shift not found" });
  }

  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "default"));
  const usdToMxn = settings ? Number(settings.usdToMxnRate) : 17.5;
  const cadToMxn = settings ? Number(settings.cadToMxnRate) : 12.8;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, shift.openedByUserId));
  const shiftUserName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.id : null;

  const tabs = await db.select().from(tabsTable).where(eq(tabsTable.shiftId, shiftId));
  const closedTabs = tabs.filter(t => t.status === "closed");

  const tabIds = tabs.map(t => t.id);
  const allOrders = tabIds.length > 0
    ? await db.select().from(ordersTable).where(sql`${ordersTable.tabId} IN (${sql.raw(tabIds.map(id => `'${id}'`).join(','))})`)
    : [];

  const allDrinkIds = [...new Set(allOrders.map(o => o.drinkId))];
  const drinks = allDrinkIds.length > 0
    ? await db.select().from(drinksTable).where(sql`${drinksTable.id} IN (${sql.raw(allDrinkIds.map(id => `'${id}'`).join(','))})`)
    : [];
  const drinkMap = new Map(drinks.map(d => [d.id, d]));

  const recipeRows = allDrinkIds.length > 0
    ? await db.select({ ri: recipeIngredientsTable, ing: ingredientsTable })
        .from(recipeIngredientsTable)
        .leftJoin(ingredientsTable, eq(recipeIngredientsTable.ingredientId, ingredientsTable.id))
        .where(sql`${recipeIngredientsTable.drinkId} IN (${sql.raw(allDrinkIds.map(id => `'${id}'`).join(','))})`)
    : [];

  const drinkCostMap = new Map<string, number>();
  const drinkRecipeMap = new Map<string, Array<{ ingredientId: string; amountInMl: number }>>();

  for (const { ri, ing } of recipeRows) {
    const amt = Number(ri.amountInMl);
    const cost = ing ? (Number(ing.costPerUnit) / Number(ing.unitSize)) * amt : 0;
    drinkCostMap.set(ri.drinkId, (drinkCostMap.get(ri.drinkId) ?? 0) + cost);
    if (!drinkRecipeMap.has(ri.drinkId)) drinkRecipeMap.set(ri.drinkId, []);
    drinkRecipeMap.get(ri.drinkId)!.push({ ingredientId: ri.ingredientId, amountInMl: amt });
  }

  const totalMxn = closedTabs.reduce((sum, t) => sum + Number(t.totalMxn), 0);
  const cashSalesMxn = closedTabs.filter(t => t.paymentMethod === "cash").reduce((sum, t) => sum + Number(t.totalMxn), 0);
  const cardSalesMxn = closedTabs.filter(t => t.paymentMethod === "card").reduce((sum, t) => sum + Number(t.totalMxn), 0);

  const staffMap = new Map<string, { name: string; totalSales: number; tabsClosed: number; drinksServed: number }>();
  for (const tab of closedTabs) {
    if (!staffMap.has(tab.staffUserId)) {
      const u = await db.select().from(usersTable).where(eq(usersTable.id, tab.staffUserId));
      const name = u[0] ? `${u[0].firstName ?? ""} ${u[0].lastName ?? ""}`.trim() || u[0].email || tab.staffUserId : tab.staffUserId;
      staffMap.set(tab.staffUserId, { name, totalSales: 0, tabsClosed: 0, drinksServed: 0 });
    }
    const entry = staffMap.get(tab.staffUserId)!;
    entry.totalSales += Number(tab.totalMxn);
    entry.tabsClosed += 1;
    const tabOrders = allOrders.filter(o => o.tabId === tab.id);
    entry.drinksServed += tabOrders.reduce((sum, o) => sum + o.quantity, 0);
  }

  const salesByStaff = [...staffMap.entries()].map(([staffUserId, v]) => ({
    staffUserId,
    staffUserName: v.name,
    totalSalesMxn: v.totalSales,
    tabsClosed: v.tabsClosed,
    drinksServed: v.drinksServed,
  }));

  const drinkSalesMap = new Map<string, { name: string; nameEs: string | null; qty: number; sales: number; cost: number }>();
  const categorySalesMap = new Map<string, { qty: number; sales: number }>();

  for (const order of allOrders) {
    const tab = tabs.find(t => t.id === order.tabId);
    if (!tab || tab.status !== "closed") continue;
    const drink = drinkMap.get(order.drinkId);
    const name = drink?.name ?? order.drinkName;
    const nameEs = drink?.nameEs ?? order.drinkNameEs ?? null;
    const category = drink?.category ?? "other";
    const unitSale = Number(order.unitPriceMxn);
    const unitCost = drinkCostMap.get(order.drinkId) ?? 0;
    const total = unitSale * order.quantity;
    const totalCost = unitCost * order.quantity;

    if (!drinkSalesMap.has(order.drinkId)) {
      drinkSalesMap.set(order.drinkId, { name, nameEs, qty: 0, sales: 0, cost: 0 });
    }
    const ds = drinkSalesMap.get(order.drinkId)!;
    ds.qty += order.quantity;
    ds.sales += total;
    ds.cost += totalCost;

    if (!categorySalesMap.has(category)) categorySalesMap.set(category, { qty: 0, sales: 0 });
    const cs = categorySalesMap.get(category)!;
    cs.qty += order.quantity;
    cs.sales += total;
  }

  const salesByDrink = [...drinkSalesMap.entries()].map(([drinkId, v]) => ({
    drinkId,
    drinkName: v.name,
    drinkNameEs: v.nameEs,
    quantitySold: v.qty,
    totalSalesMxn: v.sales,
    totalCostMxn: v.cost,
    profitMxn: v.sales - v.cost,
  })).sort((a, b) => b.profitMxn - a.profitMxn); // Sort by Profit primarily

  const topSellers = [...salesByDrink].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);

  const salesByCategory = [...categorySalesMap.entries()].map(([category, v]) => ({
    category,
    quantitySold: v.qty,
    totalSalesMxn: v.sales,
  }));

  const inventoryUsedMap = new Map<string, { name: string; unit: string; amount: number; currentStock: number }>();
  const allIngredients = await db.select().from(ingredientsTable);
  const ingredientMap = new Map(allIngredients.map(i => [i.id, i]));

  for (const order of allOrders) {
    const tab = tabs.find(t => t.id === order.tabId);
    if (!tab || tab.status !== "closed") continue;
    const recipe = drinkRecipeMap.get(order.drinkId) ?? [];
    for (const r of recipe) {
      const ing = ingredientMap.get(r.ingredientId);
      if (!ing) continue;
      if (!inventoryUsedMap.has(r.ingredientId)) {
        inventoryUsedMap.set(r.ingredientId, { name: ing.name, unit: ing.unit, amount: 0, currentStock: Number(ing.currentStock) });
      }
      inventoryUsedMap.get(r.ingredientId)!.amount += r.amountInMl * order.quantity;
    }
  }

  const inventoryUsed = [...inventoryUsedMap.entries()].map(([ingredientId, v]) => ({
    ingredientId,
    ingredientName: v.name,
    amountUsed: v.amount,
    unit: v.unit,
    currentStock: v.currentStock,
  }));

  const lowStockAlerts = allIngredients
    .filter(i => Number(i.currentStock) <= Number(i.minimumStock))
    .map(i => ({
      ingredientId: i.id,
      ingredientName: i.name,
      currentStock: Number(i.currentStock),
      minimumStock: Number(i.minimumStock),
      unit: i.unit,
    }));

  const tabsFormatted = tabs.map(t => ({
    id: t.id,
    nickname: t.nickname,
    status: t.status,
    staffUserId: t.staffUserId,
    staffUserName: null,
    shiftId: t.shiftId ?? null,
    totalMxn: Number(t.totalMxn),
    paymentMethod: t.paymentMethod ?? null,
    currency: t.currency,
    convertedTotal: null,
    openedAt: t.openedAt.toISOString(),
    closedAt: t.closedAt?.toISOString() ?? null,
    notes: t.notes ?? null,
  }));

  return res.json({
    shift: formatShift(shift, shiftUserName),
    totalSalesMxn: totalMxn,
    totalSalesUsd: totalMxn / usdToMxn,
    totalSalesCad: totalMxn / cadToMxn,
    totalTabsClosed: closedTabs.length,
    cashSalesMxn,
    cardSalesMxn,
    salesByStaff,
    salesByDrink,
    salesByCategory,
    topSellers,
    inventoryUsed,
    lowStockAlerts,
    tabs: tabsFormatted,
  });
});

export default router;
