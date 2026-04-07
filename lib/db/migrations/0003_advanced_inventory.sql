-- Migration: Add Advanced Inventory System (Luke's Specification)
-- Date: 2026-04-05
-- Purpose: Add inventory tracking with tare/weight/count methods, audit trail, and multi-method low stock alerts

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  tracking_type TEXT NOT NULL DEFAULT 'count',
  
  -- Bulk + Partial Units
  bulk_unit TEXT,
  bulk_size REAL,
  partial_unit TEXT,
  
  -- Serving Standards
  serving_size REAL,
  serving_unit TEXT,
  
  -- Tare System (for liquor)
  alcohol_density REAL DEFAULT 0.955,
  tare_weight_g REAL,
  full_bottle_weight_g REAL,
  
  -- Pricing
  bulk_cost REAL,
  markup_factor REAL DEFAULT 3.0,
  is_on_menu INTEGER DEFAULT 1,
  
  -- Low Stock Alerts (all three methods)
  low_stock_method TEXT DEFAULT 'manual',
  low_stock_manual_threshold REAL,
  low_stock_percent REAL,
  low_stock_percent_base REAL,
  low_stock_usage_days REAL,
  
  -- Current Stock (Bulk + Partial)
  current_bulk REAL DEFAULT 0,
  current_partial REAL DEFAULT 0,
  
  -- Audit Tracking
  last_audited_at INTEGER,
  last_audited_by_user_id TEXT,
  
  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create inventory_counts table (audit trail)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id TEXT PRIMARY KEY NOT NULL,
  item_id TEXT NOT NULL,
  audit_date INTEGER NOT NULL,
  audited_by_user_id TEXT NOT NULL,
  
  -- Entry Method
  audit_entry_method TEXT NOT NULL,
  
  -- Reported Values
  reported_bulk REAL,
  reported_partial REAL,
  reported_total REAL NOT NULL,
  
  -- Expected Values
  previous_total REAL NOT NULL,
  expected_total REAL NOT NULL,
  
  -- Variance Analysis
  variance REAL NOT NULL,
  variance_percent REAL,
  variance_reason TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamp
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Create inventory_adjustments table (manual adjustments)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY NOT NULL,
  item_id TEXT NOT NULL,
  
  -- Adjustments
  adjustment_bulk REAL DEFAULT 0,
  adjustment_partial REAL DEFAULT 0,
  
  -- Reason
  reason TEXT NOT NULL,
  
  -- Who
  adjusted_by_user_id TEXT NOT NULL,
  
  -- Timestamp
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Create indices for performance
CREATE INDEX idx_inventory_items_type ON inventory_items(type);
CREATE INDEX idx_inventory_items_subtype ON inventory_items(subtype);
CREATE INDEX idx_inventory_items_tracking_type ON inventory_items(tracking_type);
CREATE INDEX idx_inventory_counts_item_id ON inventory_counts(item_id);
CREATE INDEX idx_inventory_counts_audit_date ON inventory_counts(audit_date);
CREATE INDEX idx_inventory_counts_audited_by ON inventory_counts(audited_by_user_id);
CREATE INDEX idx_inventory_adjustments_item_id ON inventory_adjustments(item_id);
