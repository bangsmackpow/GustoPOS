-- Migration 0004: Create tab_payments table for split bill support
CREATE TABLE tab_payments (
  id TEXT PRIMARY KEY,
  tab_id TEXT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
  amount_mxn REAL NOT NULL,
  tip_mxn REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_tab_payments_tab ON tab_payments(tab_id);
