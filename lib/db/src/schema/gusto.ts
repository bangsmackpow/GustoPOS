import { boolean, decimal, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const ingredientCategoryEnum = pgEnum("ingredient_category", [
  "spirits", "wine", "beer", "mixer", "garnish", "other"
]);

export const drinkCategoryEnum = pgEnum("drink_category", [
  "cocktail", "beer", "wine", "shot", "non_alcoholic", "other"
]);

export const tabStatusEnum = pgEnum("tab_status", ["open", "closed"]);

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card"]);

export const shiftStatusEnum = pgEnum("shift_status", ["active", "closed"]);

export const currencyEnum = pgEnum("currency", ["MXN", "USD", "CAD"]);

export const ingredientsTable = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameEs: varchar("name_es"),
  unit: varchar("unit").notNull(),
  unitSize: decimal("unit_size", { precision: 10, scale: 3 }).notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).notNull().default("0"),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 3 }).notNull().default("1"),
  category: ingredientCategoryEnum("category").notNull().default("other"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const drinksTable = pgTable("drinks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameEs: varchar("name_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  category: drinkCategoryEnum("category").notNull().default("other"),
  markupFactor: decimal("markup_factor", { precision: 10, scale: 2 }).notNull().default("3.0"),
  upcharge: decimal("upcharge", { precision: 10, scale: 2 }).notNull().default("0"),
  actualPrice: decimal("actual_price", { precision: 10, scale: 2 }),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drinkId: varchar("drink_id").notNull().references(() => drinksTable.id, { onDelete: "cascade" }),
  ingredientId: varchar("ingredient_id").notNull().references(() => ingredientsTable.id, { onDelete: "restrict" }),
  amountInMl: decimal("amount_in_ml", { precision: 10, scale: 3 }).notNull(),
});

export const shiftsTable = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  status: shiftStatusEnum("status").notNull().default("active"),
  openedByUserId: varchar("opened_by_user_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const tabsTable = pgTable("tabs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nickname: varchar("nickname").notNull(),
  status: tabStatusEnum("status").notNull().default("open"),
  staffUserId: varchar("staff_user_id").notNull(),
  shiftId: varchar("shift_id").references(() => shiftsTable.id),
  totalMxn: decimal("total_mxn", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: paymentMethodEnum("payment_method"),
  currency: currencyEnum("currency").notNull().default("MXN"),
  notes: text("notes"),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const ordersTable = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tabId: varchar("tab_id").notNull().references(() => tabsTable.id, { onDelete: "cascade" }),
  drinkId: varchar("drink_id").notNull().references(() => drinksTable.id),
  drinkName: varchar("drink_name").notNull(),
  drinkNameEs: varchar("drink_name_es"),
  quantity: integer("quantity").notNull().default(1),
  unitPriceMxn: decimal("unit_price_mxn", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settingsTable = pgTable("settings", {
  id: varchar("id").primaryKey().default("default"),
  barName: varchar("bar_name").notNull().default("GustoPOS"),
  usdToMxnRate: decimal("usd_to_mxn_rate", { precision: 10, scale: 4 }).notNull().default("17.5"),
  cadToMxnRate: decimal("cad_to_mxn_rate", { precision: 10, scale: 4 }).notNull().default("12.8"),
  defaultMarkupFactor: decimal("default_markup_factor", { precision: 10, scale: 2 }).notNull().default("3.0"),
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: varchar("smtp_password"),
  smtpFromEmail: varchar("smtp_from_email"),
  inventoryAlertEmail: varchar("inventory_alert_email"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
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
