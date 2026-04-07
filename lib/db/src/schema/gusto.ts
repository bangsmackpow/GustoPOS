import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { usersTable } from "./auth";

// ─── Inventory Items ─────────────────────────────────────────────────────────

export const inventoryItemsTable = sqliteTable("inventory_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  type: text("type").notNull().default("spirit"), // spirit | beer | mixer | unit
  subtype: text("subtype"), // spirit: tequila|mezcal|vodka|gin|whiskey|rum|other | beer: nacional|importada|caguama|cero|other
  // Base unit system — single source of truth for measurement
  baseUnit: text("base_unit").notNull().default("ml"), // ml | g | unit
  baseUnitAmount: real("base_unit_amount").notNull().default(750), // total in a full container
  servingSize: real("serving_size").notNull().default(44.36), // standard pour/serving in base units
  pourSize: real("pour_size").notNull().default(1.5), // pour size in ounces (oz)
  // Bottle weight tracking (for weight-based inventory counting)
  bottleSizeMl: real("bottle_size_ml"), // bottle volume in ml (e.g. 750, 1000, 1750)
  glassWeightG: real("glass_weight_g"), // calculated empty glass weight
  density: real("density").notNull().default(0.94), // g/ml for the liquid (0.94 for 40% ABV spirits)
  tareWeightG: real("tare_weight_g"), // legacy: empty bottle weight
  fullBottleWeightG: real("full_bottle_weight_g"), // legacy: full bottle weight
  // Stock — always in base units
  currentStock: real("current_stock").notNull().default(0),
  // Cost & alerts
  orderCost: real("order_cost").notNull().default(0), // last purchase price for full container
  lowStockThreshold: real("low_stock_threshold").notNull().default(1),
  // Beer-specific
  unitsPerCase: integer("units_per_case").notNull().default(1),
  // Metadata
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

// ─── Staff Shifts (per-person clock in/out) ──────────────────────────────────

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

// ─── Staff Performance Metrics ────────────────────────────────────────────────

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
  customerCount: integer("customer_count").notNull().default(0), // unique customers/tabs
  ordersPerHour: real("orders_per_hour").notNull().default(0),
  revenuePerHour: real("revenue_per_hour").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Tax Rates Configuration ──────────────────────────────────────────────────

export const taxRatesTable = sqliteTable("tax_rates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull().unique(), // standard, reduced, food, spirits, beer, non_taxable
  rate: real("rate").notNull(), // 0.16 for 16%
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Inventory Counts (audit trail) ──────────────────────────────────────────

export const inventoryCountsTable = sqliteTable("inventory_counts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  weightG: real("weight_g"),
  calculatedBaseUnits: real("calculated_base_units"),
  countedAt: integer("counted_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  countedByUserId: text("counted_by_user_id").notNull(),
});

// ─── Drinks ──────────────────────────────────────────────────────────────────

export const drinksTable = sqliteTable("drinks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  category: text("category").notNull().default("other"),
  taxCategory: text("tax_category").notNull().default("standard"), // standard | reduced | food | spirits | beer | non_taxable
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

// ─── Recipe Ingredients ──────────────────────────────────────────────────────

export const recipeIngredientsTable = sqliteTable("recipe_ingredients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  drinkId: text("drink_id")
    .notNull()
    .references(() => drinksTable.id, { onDelete: "cascade" }),
  ingredientId: text("ingredient_id").references(() => inventoryItemsTable.id, {
    onDelete: "set null",
  }),
  amountInBaseUnit: real("amount_in_base_unit").notNull(),
});

// ─── Shifts ──────────────────────────────────────────────────────────────────

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

// ─── Tabs ────────────────────────────────────────────────────────────────────

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
  taxMxn: real("tax_mxn").notNull().default(0), // tax amount
  taxPercent: real("tax_percent").notNull().default(0), // effective tax rate for the tab
  promoCodeId: text("promo_code_id"),
  paymentMethod: text("payment_method"),
  currency: text("currency").notNull().default("MXN"),
  notes: text("notes"),
  openedAt: integer("opened_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

// ─── Tab Payments (for split bill) ──────────────────────────────────────────

export const tabPaymentsTable = sqliteTable("tab_payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tabId: text("tab_id")
    .notNull()
    .references(() => tabsTable.id, { onDelete: "cascade" }),
  amountMxn: real("amount_mxn").notNull(),
  tipMxn: real("tip_mxn").notNull().default(0),
  paymentMethod: text("payment_method").notNull(), // "cash" | "card"
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type TabPayment = typeof tabPaymentsTable.$inferSelect;
export type InsertTabPayment = typeof tabPaymentsTable.$inferInsert;

// ─── Orders ──────────────────────────────────────────────────────────────────

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
  taxRate: real("tax_rate").notNull().default(0), // 16% for standard, etc
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsTable = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  barName: text("bar_name").notNull().default("GustoPOS"),
  barIcon: text("bar_icon").notNull().default("Wine"),
  usdToMxnRate: real("usd_to_mxn_rate").notNull().default(17.5),
  cadToMxnRate: real("cad_to_mxn_rate").notNull().default(12.8),
  defaultMarkupFactor: real("default_markup_factor").notNull().default(3.0),
  // SMTP & notifications
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  smtpFromEmail: text("smtp_from_email"),
  inventoryAlertEmail: text("inventory_alert_email"),
  // Backup
  enableLitestream: integer("enable_litestream", { mode: "boolean" })
    .notNull()
    .default(false),
  enableUsbBackup: integer("enable_usb_backup", { mode: "boolean" })
    .notNull()
    .default(false),
  // PIN lock
  pinLockTimeoutMin: integer("pin_lock_timeout_min").notNull().default(5),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Rushes ──────────────────────────────────────────────────────────────────

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

// ─── Promo Codes ─────────────────────────────────────────────────────────────

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

// ─── Inventory Audits ────────────────────────────────────────────────────────

export const inventoryAuditsTable = sqliteTable("inventory_audits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  systemStock: real("system_stock").notNull(), // What the system thinks is in stock
  physicalCount: real("physical_count").notNull(), // What was physically counted
  variance: real("variance").notNull(), // physicalCount - systemStock (units)
  variancePercent: real("variance_percent").notNull(), // (variance / systemStock) * 100
  auditReason: text("audit_reason"), // "physical_count", "discrepancy", "routine", etc
  notes: text("notes"), // notes about the audit
  auditedByUserId: text("audited_by_user_id").notNull(),
  auditedAt: integer("audited_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
export type InsertInventoryItem = typeof inventoryItemsTable.$inferInsert;

export type InventoryCount = typeof inventoryCountsTable.$inferSelect;
export type InsertInventoryCount = typeof inventoryCountsTable.$inferInsert;

export type InventoryAudit = typeof inventoryAuditsTable.$inferSelect;
export type InsertInventoryAudit = typeof inventoryAuditsTable.$inferInsert;

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

export type PromoCode = typeof promoCodesTable.$inferSelect;
export type InsertPromoCode = typeof promoCodesTable.$inferInsert;

// ─── Event Logs (audit trail) ────────────────────────────────────────────────

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

export type EventLog = typeof eventLogsTable.$inferSelect;
export type InsertEventLog = typeof eventLogsTable.$inferInsert;

export type StaffShift = typeof staffShiftsTable.$inferSelect;
export type InsertStaffShift = typeof staffShiftsTable.$inferInsert;

export type StaffPerformance = typeof staffPerformanceTable.$inferSelect;
export type InsertStaffPerformance = typeof staffPerformanceTable.$inferInsert;

export type TaxRate = typeof taxRatesTable.$inferSelect;
export type InsertTaxRate = typeof taxRatesTable.$inferInsert;
