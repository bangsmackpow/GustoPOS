import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const periodsTable = sqliteTable("periods", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  periodType: text("period_type").notNull().default("daily"),
  startDate: integer("start_date").notNull(),
  endDate: integer("end_date").notNull(),
  status: text("status").notNull().default("open"),
  closedAt: integer("closed_at"),
  closedByUserId: text("closed_by_user_id"),
  totalSalesMxn: real("total_sales_mxn").default(0),
  totalCostMxn: real("total_cost_mxn").default(0),
  totalTipsMxn: real("total_tips_mxn").default(0),
  totalDiscountsMxn: real("total_discounts_mxn").default(0),
  totalVoidsMxn: real("total_voids_mxn").default(0),
  totalCompsMxn: real("total_comps_mxn").default(0),
  inventoryStartValue: real("inventory_start_value").default(0),
  inventoryEndValue: real("inventory_end_value").default(0),
  cogsMxn: real("cogs_mxn").default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const cogsEntriesTable = sqliteTable("cogs_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  periodId: text("period_id")
    .notNull()
    .references(() => periodsTable.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  itemName: text("item_name").notNull(),
  quantityUsed: real("quantity_used").notNull().default(0),
  unitCost: real("unit_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  category: text("category"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Period = typeof periodsTable.$inferSelect;
export type InsertPeriod = typeof periodsTable.$inferInsert;
export type CogsEntry = typeof cogsEntriesTable.$inferSelect;
export type InsertCogsEntry = typeof cogsEntriesTable.$inferInsert;
