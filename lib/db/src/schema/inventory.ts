import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * INVENTORY_ITEMS - Advanced inventory tracking with multiple weight/count methods
 */
export const inventoryItemsTable = sqliteTable("inventory_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  type: text("type").notNull(), 
  subtype: text("subtype"),
  parentItemId: text("parent_item_id").references((): any => inventoryItemsTable.id),
  
  // Measurement System
  baseUnit: text("base_unit").notNull().default("ml"), 
  baseUnitAmount: real("base_unit_amount").notNull().default(0), 
  
  bulkUnit: text("bulk_unit"), 
  bulkSize: real("bulk_size"), 
  partialUnit: text("partial_unit"), 

  servingSize: real("serving_size").notNull().default(0), 
  servingUnit: text("serving_unit"), 
  pourSize: real("pour_size").notNull().default(0), 
  bottleSizeMl: real("bottle_size_ml"), 

  alcoholDensity: real("alcohol_density").default(0.955),
  tareWeightG: real("tare_weight_g"), 
  glassWeightG: real("glass_weight_g"), 
  fullBottleWeightG: real("full_bottle_weight_g"), 
  density: real("density").notNull().default(0.94), 

  bulkCost: real("bulk_cost"), 
  orderCost: real("order_cost").notNull().default(0), 
  markupFactor: real("markup_factor").default(3.0),
  isOnMenu: integer("is_on_menu", { mode: "boolean" }).notNull().default(true),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),

  lowStockMethod: text("low_stock_method").default("manual"), 
  lowStockManualThreshold: real("low_stock_manual_threshold"), 
  lowStockThreshold: real("low_stock_threshold").notNull().default(0), 
  lowStockPercent: real("low_stock_percent"), 
  lowStockPercentBase: real("low_stock_percent_base"), 
  lowStockUsageDays: real("low_stock_usage_days"), 

  currentBulk: real("current_bulk").default(0), 
  currentPartial: real("current_partial").default(0), 
  currentStock: real("current_stock").notNull().default(0), 

  // Beer-specific
  unitsPerCase: integer("units_per_case").notNull().default(1),

  lastAuditedAt: integer("last_audited_at", { mode: "timestamp" }),
  lastAuditedByUserId: text("last_audited_by_user_id"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

/**
 * INVENTORY_AUDITS - Combined audit table to satisfy both logics
 */
export const inventoryAuditsTable = sqliteTable("inventory_audits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  
  // From advanced logic
  auditDate: integer("audit_date", { mode: "timestamp" }).default(sql`(unixepoch())`),
  auditEntryMethod: text("audit_entry_method"), 
  reportedBulk: real("reported_bulk"),
  reportedPartial: real("reported_partial"),
  reportedTotal: real("reported_total"),
  previousTotal: real("previous_total"),
  expectedTotal: real("expected_total"),
  
  // From guest logic
  systemStock: real("system_stock").notNull().default(0), 
  physicalCount: real("physical_count").notNull().default(0), 
  variance: real("variance").notNull().default(0), 
  variancePercent: real("variance_percent").notNull().default(0), 
  auditReason: text("audit_reason"), 
  weightG: real("weight_g"),
  calculatedBaseUnits: real("calculated_base_units"),
  countedByUserId: text("counted_by_user_id"), 
  
  notes: text("notes"),
  // Made optional to satisfy varying logic requirements
  auditedByUserId: text("audited_by_user_id"), 
  auditedAt: integer("audited_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  countedAt: integer("counted_at", { mode: "timestamp" }).default(sql`(unixepoch())`), 
  
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/**
 * Legacy support for inventoryCountsTable (mapped to audits)
 */
export const inventoryCountsTable = inventoryAuditsTable;

export const inventoryAdjustmentsTable = sqliteTable("inventory_adjustments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  adjustmentBulk: real("adjustment_bulk").default(0),
  adjustmentPartial: real("adjustment_partial").default(0),
  reason: text("reason").notNull(), 
  adjustedByUserId: text("adjusted_by_user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
