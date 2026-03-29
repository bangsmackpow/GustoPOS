import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const ingredientsTable = sqliteTable("ingredients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  unit: text("unit").notNull(),
  unitSize: real("unit_size").notNull(),
  costPerUnit: real("cost_per_unit").notNull(),
  currentStock: real("current_stock").notNull().default(0),
  minimumStock: real("minimum_stock").notNull().default(1),
  category: text("category").notNull().default("other"), // spirits, wine, beer, mixer, garnish, other
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const drinksTable = sqliteTable("drinks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  category: text("category").notNull().default("other"), // cocktail, beer, wine, shot, non_alcoholic, other
  markupFactor: real("markup_factor").notNull().default(3.0),
  upcharge: real("upcharge").notNull().default(0),
  actualPrice: real("actual_price"),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const recipeIngredientsTable = sqliteTable("recipe_ingredients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  drinkId: text("drink_id").notNull().references(() => drinksTable.id, { onDelete: "cascade" }),
  ingredientId: text("ingredient_id").notNull().references(() => ingredientsTable.id, { onDelete: "restrict" }),
  amountInMl: real("amount_in_ml").notNull(),
});

export const shiftsTable = sqliteTable("shifts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, closed
  openedByUserId: text("opened_by_user_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

export const tabsTable = sqliteTable("tabs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nickname: text("nickname").notNull(),
  status: text("status").notNull().default("open"), // open, closed
  staffUserId: text("staff_user_id").notNull(),
  shiftId: text("shift_id").references(() => shiftsTable.id),
  totalMxn: real("total_mxn").notNull().default(0),
  paymentMethod: text("payment_method"), // cash, card
  currency: text("currency").notNull().default("MXN"), // MXN, USD, CAD
  notes: text("notes"),
  openedAt: integer("opened_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

export const ordersTable = sqliteTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tabId: text("tab_id").notNull().references(() => tabsTable.id, { onDelete: "cascade" }),
  drinkId: text("drink_id").notNull().references(() => drinksTable.id),
  drinkName: text("drink_name").notNull(),
  drinkNameEs: text("drink_name_es"),
  quantity: integer("quantity").notNull().default(1),
  unitPriceMxn: real("unit_price_mxn").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const settingsTable = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  barName: text("bar_name").notNull().default("GustoPOS"),
  usdToMxnRate: real("usd_to_mxn_rate").notNull().default(17.5),
  cadToMxnRate: real("cad_to_mxn_rate").notNull().default(12.8),
  defaultMarkupFactor: real("default_markup_factor").notNull().default(3.0),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  smtpFromEmail: text("smtp_from_email"),
  inventoryAlertEmail: text("inventory_alert_email"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Ingredient = typeof ingredientsTable.$inferSelect;
export type InsertIngredient = typeof ingredientsTable.$inferInsert;
export type Drink = typeof drinksTable.$inferSelect;
export type InsertDrink = typeof drinksTable.$inferInsert;
export type RecipeIngredient = typeof recipeIngredientsTable.$inferSelect;
export type Tab = typeof tabsTable.$inferSelect;
export type InsertTab = typeof tabsTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
export type Shift = typeof shiftsTable.$inferSelect;
export type Settings = typeof settingsTable.$inferSelect;
