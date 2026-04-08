-- Migration: Add Advanced Inventory System (Luke's Specification)
-- Date: 2026-04-05
-- Purpose: Add inventory tracking with tare/weight/count methods, audit trail, and multi-method low stock alerts
-- Rewritten to match Drizzle schema exactly

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  name_es TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  base_unit TEXT NOT NULL DEFAULT 'ml',
  base_unit_amount REAL NOT NULL DEFAULT 0,
  bulk_unit TEXT,
  bulk_size REAL,
  partial_unit TEXT,
  serving_size REAL NOT NULL DEFAULT 0,
  serving_unit TEXT,
  pour_size REAL NOT NULL DEFAULT 0,
  bottle_size_ml REAL,
  alcohol_density REAL DEFAULT 0.955,
  tare_weight_g REAL,
  glass_weight_g REAL,
  full_bottle_weight_g REAL,
  density REAL NOT NULL DEFAULT 0.94,
  bulk_cost REAL,
  order_cost REAL NOT NULL DEFAULT 0,
  markup_factor REAL DEFAULT 3.0,
  is_on_menu INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  low_stock_method TEXT DEFAULT 'manual',
  low_stock_manual_threshold REAL,
  low_stock_threshold REAL NOT NULL DEFAULT 0,
  low_stock_percent REAL,
  low_stock_percent_base REAL,
  low_stock_usage_days REAL,
  current_bulk REAL DEFAULT 0,
  current_partial REAL DEFAULT 0,
  current_stock REAL NOT NULL DEFAULT 0,
  units_per_case INTEGER NOT NULL DEFAULT 1,
  last_audited_at INTEGER,
  last_audited_by_user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create inventory_audits table
CREATE TABLE IF NOT EXISTS inventory_audits (
  id TEXT PRIMARY KEY NOT NULL,
  item_id TEXT NOT NULL,
  audit_date INTEGER DEFAULT (unixepoch()),
  audit_entry_method TEXT,
  reported_bulk REAL,
  reported_partial REAL,
  reported_total REAL,
  previous_total REAL,
  expected_total REAL,
  system_stock REAL NOT NULL DEFAULT 0,
  physical_count REAL NOT NULL DEFAULT 0,
  variance REAL NOT NULL DEFAULT 0,
  variance_percent REAL NOT NULL DEFAULT 0,
  audit_reason TEXT,
  weight_g REAL,
  calculated_base_units REAL,
  counted_by_user_id TEXT,
  notes TEXT,
  audited_by_user_id TEXT,
  audited_at INTEGER DEFAULT (unixepoch()),
  counted_at INTEGER DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Create inventory_adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY NOT NULL,
  item_id TEXT NOT NULL,
  adjustment_bulk REAL DEFAULT 0,
  adjustment_partial REAL DEFAULT 0,
  reason TEXT NOT NULL,
  adjusted_by_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_subtype ON inventory_items(subtype);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_item_id ON inventory_audits(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_audited_at ON inventory_audits(audited_at);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item_id ON inventory_adjustments(item_id);