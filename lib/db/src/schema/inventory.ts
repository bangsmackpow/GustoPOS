import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * INVENTORY_ITEMS - Advanced inventory tracking with multiple weight/count methods
 * Schema matches actual SQLite database (migrations 0000, 0001, 0002)
 * All timestamps stored as unix seconds (integer), not JS Date objects
 * All booleans stored as 0/1 (integer), not JS true/false
 */
export const inventoryItemsTable = sqliteTable("inventory_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(),
  subtype: text("subtype"),
  parentItemId: text("parent_item_id").references(
    (): any => inventoryItemsTable.id,
  ),

  // Measurement System
  baseUnit: text("base_unit").notNull().default("ml"),
  baseUnitAmount: real("base_unit_amount").notNull().default(0),

  bulkUnit: text("bulk_unit"),
  bulkSize: real("bulk_size"),
  partialUnit: text("partial_unit"),

  servingSize: real("serving_size").notNull().default(0),
  servingUnit: text("serving_unit"),
  bottleSizeMl: real("bottle_size_ml"),

  containerWeightG: real("container_weight_g"),
  fullBottleWeightG: real("full_bottle_weight_g"),
  density: real("density").notNull().default(0.94),

  bulkCost: real("bulk_cost"),
  orderCost: real("order_cost").notNull().default(0),
  markupFactor: real("markup_factor").default(3.0),

  // Boolean flags
  isOnMenu: integer("is_on_menu").notNull().default(1),
  sellSingleServing: integer("sell_single_serving").notNull().default(0),
  singleServingPrice: real("single_serving_price"),
  productPrice: real("product_price"),
  menuPricePerServing: real("menu_price_per_serving"),

  isDeleted: integer("is_deleted").notNull().default(0),

  lowStockMethod: text("low_stock_method").default("manual"),
  lowStockManualThreshold: real("low_stock_manual_threshold"),
  lowStockThreshold: real("low_stock_threshold").notNull().default(0),
  lowStockPercent: real("low_stock_percent"),
  lowStockPercentBase: real("low_stock_percent_base"),
  lowStockUsageDays: real("low_stock_usage_days"),

  currentBulk: real("current_bulk").default(0),
  currentPartial: real("current_partial").default(0),
  currentStock: real("current_stock").notNull().default(0),
  reservedStock: real("reserved_stock").default(0),

  // Beer-specific
  unitsPerCase: integer("units_per_case").notNull().default(1),

  // Audit tracking
  lastAuditedAt: integer("last_audited_at"),
  lastAuditedByUserId: text("last_audited_by_user_id"),

  // Timestamps stored as unix seconds (no mode: "timestamp" conversion)
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),

  // Density variants (migration 0001)
  alcoholDensity: real("alcohol_density").default(0.94),
  pourSize: real("pour_size"),

  // Audit workflow (migration 0002)
  auditMethod: text("audit_method").default("auto"),

  trackingMode: text("tracking_mode").default("auto"),
});

export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

/**
 * INVENTORY_AUDITS - Combined audit table to satisfy both logics
 * Timestamps stored as unix seconds (integer), no JS Date conversion
 * Linked to audit_sessions via session_id (migration 0002)
 */
export const inventoryAuditsTable = sqliteTable("inventory_audits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),

  auditDate: integer("audit_date"),
  auditEntryMethod: text("audit_entry_method"),
  reportedBulk: real("reported_bulk"),
  reportedPartial: real("reported_partial"),
  reportedTotal: real("reported_total"),
  previousTotal: real("previous_total"),
  expectedTotal: real("expected_total"),

  systemStock: real("system_stock"),
  physicalCount: real("physical_count"),
  variance: real("variance"),
  variancePercent: real("variance_percent"),
  auditReason: text("audit_reason"),
  weightG: real("weight_g"),
  calculatedBaseUnits: real("calculated_base_units"),
  countedByUserId: text("counted_by_user_id"),

  notes: text("notes"),
  auditedByUserId: text("audited_by_user_id"),
  auditedAt: integer("audited_at"),
  countedAt: integer("counted_at"),

  createdAt: integer("created_at"),

  sessionId: text("session_id"),
});

/**
 * Legacy support for inventoryCountsTable (mapped to audits)
 */
export const inventoryCountsTable = inventoryAuditsTable;

export const inventoryAdjustmentsTable = sqliteTable("inventory_adjustments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  adjustmentBulk: real("adjustment_bulk").default(0),
  adjustmentPartial: real("adjustment_partial").default(0),
  reason: text("reason").notNull(),
  adjustedByUserId: text("adjusted_by_user_id").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * AUDIT_SESSIONS - Batch audit workflow support (migration 0002)
 * Groups multiple audit records (items) into a single audit session
 * Timestamps stored as unix seconds (integer), no JS Date conversion
 */
export const auditSessionsTable = sqliteTable("audit_sessions", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("in_progress"),
  categoryFilter: text("category_filter"),
  typeFilter: text("type_filter"),
  startedByUserId: text("started_by_user_id").notNull(),
  completedByUserId: text("completed_by_user_id"),
  startedAt: integer("started_at"),
  completedAt: integer("completed_at"),
  itemCount: integer("item_count").default(0),
  completedCount: integer("completed_count").default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});
