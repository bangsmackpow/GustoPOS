-- Migration 0005: Add discount fields to tabs table
ALTER TABLE tabs ADD COLUMN discount_mxn REAL NOT NULL DEFAULT 0;
ALTER TABLE tabs ADD COLUMN promo_code_id TEXT;

-- Create promo_codes table
CREATE TABLE promo_codes (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value REAL NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create index for faster code lookups
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
