import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { usersTable } from "./auth";
import { inventoryItemsTable } from "./inventory";

// DEPRECATED: ingredientsTable replaced by inventoryItemsTable in inventory.ts
// This table is kept for backward compatibility but no longer used by any routes
// @deprecated since v0.3.0 - use inventoryItemsTable instead
export const _ingredientsTable = sqliteTable("ingredients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  unit: text("unit").notNull(),
  unitSize: real("unit_size").notNull(),
  costPerUnit: real("cost_per_unit").notNull(),
  currentStock: real("current_stock").notNull().default(0),
  minimumStock: real("minimum_stock").notNull().default(1),
  category: text("category").notNull().default("other"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const drinksTable = sqliteTable("drinks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  category: text("category").notNull().default("other"),
  taxCategory: text("tax_category").notNull().default("standard"),
  taxRate: real("tax_rate").notNull().default(0),
  actualPrice: real("actual_price").notNull().default(0),
  markupFactor: real("markup_factor").notNull().default(3.0),
  isAvailable: integer("is_available", { mode: "boolean" })
    .notNull()
    .default(true),
  isOnMenu: integer("is_on_menu", { mode: "boolean" }).notNull().default(false),
  isDeleted: integer("is_deleted", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const recipeIngredientsTable = sqliteTable("recipe_ingredients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  drinkId: text("drink_id")
    .notNull()
    .references(() => drinksTable.id, { onDelete: "cascade" }),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  amountInMl: real("amount_in_ml").notNull().default(0),
  amountInBaseUnit: real("amount_in_base_unit").notNull().default(0),
});

export const shiftsTable = sqliteTable("shifts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  openedByUserId: text("opened_by_user_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

export const tabsTable = sqliteTable("tabs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nickname: text("nickname").notNull(),
  status: text("status").notNull().default("open"),
  staffUserId: text("staff_user_id").notNull(),
  shiftId: text("shift_id").references(() => shiftsTable.id),
  totalMxn: real("total_mxn").notNull().default(0),
  tipMxn: real("tip_mxn").notNull().default(0),
  discountMxn: real("discount_mxn").notNull().default(0),
  taxMxn: real("tax_mxn").notNull().default(0),
  taxPercent: real("tax_percent").notNull().default(0),
  promoCodeId: text("promo_code_id"),
  paymentMethod: text("payment_method"),
  currency: text("currency").notNull().default("MXN"),
  notes: text("notes"),
  openedAt: integer("opened_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

export const tabPaymentsTable = sqliteTable("tab_payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tabId: text("tab_id")
    .notNull()
    .references(() => tabsTable.id, { onDelete: "cascade" }),
  amountMxn: real("amount_mxn").notNull(),
  tipMxn: real("tip_mxn").notNull().default(0),
  paymentMethod: text("payment_method").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const ordersTable = sqliteTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tabId: text("tab_id")
    .notNull()
    .references(() => tabsTable.id, { onDelete: "cascade" }),
  drinkId: text("drink_id")
    .notNull()
    .references(() => drinksTable.id),
  drinkName: text("drink_name").notNull(),
  drinkNameEs: text("drink_name_es"),
  quantity: integer("quantity").notNull().default(1),
  unitPriceMxn: real("unit_price_mxn").notNull(),
  taxCategory: text("tax_category").notNull().default("standard"),
  taxRate: real("tax_rate").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const settingsTable = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  barName: text("bar_name").notNull().default("GustoPOS"),
  barIcon: text("bar_icon").default("Wine"),
  baseCurrency: text("base_currency").notNull().default("MXN"),
  usdToMxnRate: real("usd_to_mxn_rate").notNull().default(17.5),
  cadToMxnRate: real("cad_to_mxn_rate").notNull().default(12.8),
  defaultMarkupFactor: real("default_markup_factor").notNull().default(3.0),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  smtpFromEmail: text("smtp_from_email"),
  inventoryAlertEmail: text("inventory_alert_email"),
  enableLitestream: integer("enable_litestream", { mode: "boolean" })
    .notNull()
    .default(false),
  enableUsbBackup: integer("enable_usb_backup", { mode: "boolean" })
    .notNull()
    .default(false),
  pinLockTimeoutMin: integer("pin_lock_timeout_min").notNull().default(5),
  autoBackupEnabled: integer("auto_backup_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  autoBackupIntervalMin: integer("auto_backup_interval_min")
    .notNull()
    .default(15),
  maxAutoBackups: integer("max_auto_backups").notNull().default(5),
  lastAutoBackup: integer("last_auto_backup", { mode: "timestamp" }),
  lastDailyBackup: integer("last_daily_backup", { mode: "timestamp" }),
  lastWeeklyBackup: integer("last_weekly_backup", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const rushesTable = sqliteTable("rushes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  impact: text("impact").notNull().default("medium"),
  type: text("type").notNull().default("event"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const staffShiftsTable = sqliteTable("staff_shifts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shiftsTable.id, { onDelete: "cascade" }),
  staffUserId: text("staff_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clockInAt: integer("clock_in_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  clockOutAt: integer("clock_out_at", { mode: "timestamp" }),
  breakStartAt: integer("break_start_at", { mode: "timestamp" }),
  breakEndAt: integer("break_end_at", { mode: "timestamp" }),
  notes: text("notes"),
});

export const staffPerformanceTable = sqliteTable("staff_performance", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  staffUserId: text("staff_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shiftsTable.id, { onDelete: "cascade" }),
  totalOrders: integer("total_orders").notNull().default(0),
  totalRevenue: real("total_revenue").notNull().default(0),
  totalTips: real("total_tips").notNull().default(0),
  totalTabs: integer("total_tabs").notNull().default(0),
  avgOrderValue: real("avg_order_value").notNull().default(0),
  avgTabValue: real("avg_tab_value").notNull().default(0),
  tipPercentage: real("tip_percentage").notNull().default(0),
  customerCount: integer("customer_count").notNull().default(0),
  ordersPerHour: real("orders_per_hour").notNull().default(0),
  revenuePerHour: real("revenue_per_hour").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const taxRatesTable = sqliteTable("tax_rates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull().unique(),
  rate: real("rate").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const promoCodesTable = sqliteTable("promo_codes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: real("discount_value").notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const eventLogsTable = sqliteTable("event_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Ingredient = typeof _ingredientsTable.$inferSelect;
export type InsertIngredient = typeof _ingredientsTable.$inferInsert;

export type Drink = typeof drinksTable.$inferSelect;
export type InsertDrink = typeof drinksTable.$inferInsert;

export type RecipeIngredient = typeof recipeIngredientsTable.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredientsTable.$inferInsert;

export type Tab = typeof tabsTable.$inferSelect;
export type InsertTab = typeof tabsTable.$inferInsert;

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;

export type Shift = typeof shiftsTable.$inferSelect;
export type InsertShift = typeof shiftsTable.$inferInsert;

export type Settings = typeof settingsTable.$inferSelect;
export type InsertSettings = typeof settingsTable.$inferInsert;

export type Rush = typeof rushesTable.$inferSelect;
export type InsertRush = typeof rushesTable.$inferInsert;

export type TabPayment = typeof tabPaymentsTable.$inferSelect;
export type InsertTabPayment = typeof tabPaymentsTable.$inferInsert;

export type StaffShift = typeof staffShiftsTable.$inferSelect;
export type InsertStaffShift = typeof staffShiftsTable.$inferInsert;

export type StaffPerformance = typeof staffPerformanceTable.$inferSelect;
export type InsertStaffPerformance = typeof staffPerformanceTable.$inferInsert;

export type TaxRate = typeof taxRatesTable.$inferSelect;
export type InsertTaxRate = typeof taxRatesTable.$inferInsert;

export type PromoCode = typeof promoCodesTable.$inferSelect;
export type InsertPromoCode = typeof promoCodesTable.$inferInsert;

export type EventLog = typeof eventLogsTable.$inferSelect;
export type InsertEventLog = typeof eventLogsTable.$inferInsert;
