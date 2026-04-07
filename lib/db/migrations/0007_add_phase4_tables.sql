-- Migration 0007: Add Phase 4 tables for staff shifts, performance metrics, and tax configuration

-- Staff Shifts: Tracks individual staff clock-in/out per shift
CREATE TABLE staff_shifts (
  id TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL,
  staff_user_id TEXT NOT NULL,
  clock_in_at INTEGER NOT NULL DEFAULT (unixepoch()),
  clock_out_at INTEGER,
  break_start_at INTEGER,
  break_end_at INTEGER,
  notes TEXT,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_shifts_shift ON staff_shifts(shift_id);
CREATE INDEX idx_staff_shifts_staff ON staff_shifts(staff_user_id);
CREATE INDEX idx_staff_shifts_clock_in ON staff_shifts(clock_in_at);

-- Staff Performance: Calculated metrics per shift per staff member
CREATE TABLE staff_performance (
  id TEXT PRIMARY KEY,
  staff_user_id TEXT NOT NULL,
  shift_id TEXT NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue REAL NOT NULL DEFAULT 0,
  total_tips REAL NOT NULL DEFAULT 0,
  total_tabs INTEGER NOT NULL DEFAULT 0,
  avg_order_value REAL NOT NULL DEFAULT 0,
  avg_tab_value REAL NOT NULL DEFAULT 0,
  tip_percentage REAL NOT NULL DEFAULT 0,
  customer_count INTEGER NOT NULL DEFAULT 0,
  orders_per_hour REAL NOT NULL DEFAULT 0,
  revenue_per_hour REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_performance_staff ON staff_performance(staff_user_id);
CREATE INDEX idx_staff_performance_shift ON staff_performance(shift_id);
CREATE INDEX idx_staff_performance_revenue ON staff_performance(total_revenue);

-- Tax Rates: Configuration for different tax categories (standard, reduced, food, spirits, beer, non_taxable)
CREATE TABLE tax_rates (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  rate REAL NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_tax_rates_active ON tax_rates(is_active);

-- Insert default Mexican tax rates (as of 2024)
INSERT INTO tax_rates (id, category, rate, description, is_active) VALUES
  ('tax_standard', 'standard', 0.16, 'Standard VAT (IVA) - 16%', 1),
  ('tax_reduced', 'reduced', 0.08, 'Reduced VAT - 8%', 1),
  ('tax_food', 'food', 0.00, 'Food items - 0% VAT', 1),
  ('tax_spirits', 'spirits', 0.18, 'Spirits & alcohol - 18% (IVA + IEPS)', 1),
  ('tax_beer', 'beer', 0.14, 'Beer & light alcohol - 14% (IVA + IEPS)', 1),
  ('tax_non_taxable', 'non_taxable', 0.00, 'Non-taxable items', 1);
