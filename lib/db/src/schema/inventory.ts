import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * INVENTORY_ITEMS - Advanced inventory tracking with multiple weight/count methods
 * Supports Luke's three tracking models:
 * 1. Tare-based (liquor with weight calculation)
 * 2. Weight-based (bulk items like sugar)
 * 3. Count-based (cases, bottles, discrete units)
 */
export const inventoryItemsTable = sqliteTable("inventory_items", {
  // Identity
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // liquor, beer, wine, mixer, food, other
  subtype: text("subtype"), // vodka, rum, corona, etc.

  // Tracking Configuration
  trackingType: text("tracking_type").notNull().default("count"), // 'tare' | 'weight' | 'count'

  // Bulk + Partial Unit System (flexible for all inventory types)
  // Supports: 5 cases + 18 bottles, OR 500g + 250g, OR 10 bottles + 2 partial
  bulkUnit: text("bulk_unit"), // case, bottle, bag, liter, gram, etc.
  bulkSize: real("bulk_size"), // 24 (bottles per case), 1000 (ml), 1000 (grams), etc.
  partialUnit: text("partial_unit"), // oz, gram, bottle, etc.

  // Serving Standards
  servingSize: real("serving_size"), // 2 (for 2 oz)
  servingUnit: text("serving_unit"), // oz, ml, shot, pour

  // Tare System Fields (for tracking_type='tare', liquor)
  alcoholDensity: real("alcohol_density").default(0.955), // kg/L, default 0.955 for spirits
  tareWeightG: real("tare_weight_g"), // Glass weight (calculated: full_weight - 1000)
  fullBottleWeightG: real("full_bottle_weight_g"), // Sealed bottle weight in grams

  // Pricing
  bulkCost: real("bulk_cost"), // Cost per bulk unit
  markupFactor: real("markup_factor").default(3.0),
  isOnMenu: integer("is_on_menu", { mode: "boolean" }).default(true),

  // Low Stock Alerts - All Three Methods Supported
  lowStockMethod: text("low_stock_method").default("manual"), // manual | percentage | usage | all
  lowStockManualThreshold: real("low_stock_manual_threshold"), // e.g., 3 bottles
  lowStockPercent: real("low_stock_percent"), // e.g., 20 (alert at 20%)
  lowStockPercentBase: real("low_stock_percent_base"), // Reference quantity for percentage
  lowStockUsageDays: real("low_stock_usage_days"), // e.g., 2 (alert when < 2 days supply)

  // Current Inventory State (Bulk + Partial)
  currentBulk: real("current_bulk").default(0), // Number of full units
  currentPartial: real("current_partial").default(0), // Partial amount

  // Audit Tracking
  lastAuditedAt: integer("last_audited_at", { mode: "timestamp" }),
  lastAuditedByUserId: text("last_audited_by_user_id"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Type definition for InventoryItem (derived from table)
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

/**
 * INVENTORY_COUNTS - Audit Trail
 * Every audit creates a record showing:
 * - What was counted/weighed
 * - What we expected
 * - Variance (difference)
 * - Who did audit, when, and why
 */
export const inventoryCountsTable = sqliteTable("inventory_counts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),

  // Audit Metadata
  auditDate: integer("audit_date", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  auditedByUserId: text("audited_by_user_id").notNull(), // Staff ID

  // Entry Method Used
  auditEntryMethod: text("audit_entry_method").notNull(), // 'bulk_partial' | 'loose_only'

  // What Staff Reported
  reportedBulk: real("reported_bulk"), // Full units (if bulk_partial method)
  reportedPartial: real("reported_partial"), // Partial units (if bulk_partial method)
  reportedTotal: real("reported_total").notNull(), // Total in loose units

  // What We Expected
  previousTotal: real("previous_total").notNull(), // Previous count
  expectedTotal: real("expected_total").notNull(), // Expected based on usage

  // Variance Analysis
  variance: real("variance").notNull(), // actual - expected
  variancePercent: real("variance_percent"), // (variance / expected) * 100
  varianceReason: text("variance_reason"), // spillage, error, over-count, demo, unknown

  // Notes
  notes: text("notes"),

  // Timestamp
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * INVENTORY_ADJUSTMENTS - Manual Stock Adjustments
 * For non-audit changes (received new stock, wrote off damaged, etc.)
 */
export const inventoryAdjustmentsTable = sqliteTable("inventory_adjustments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),

  // Adjustment Amounts
  adjustmentBulk: real("adjustment_bulk").default(0),
  adjustmentPartial: real("adjustment_partial").default(0),

  // Why Was It Adjusted?
  reason: text("reason").notNull(), // received, damaged, demo, inventory_correction, etc.

  // Who Made It
  adjustedByUserId: text("adjusted_by_user_id").notNull(),

  // Timestamp
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
