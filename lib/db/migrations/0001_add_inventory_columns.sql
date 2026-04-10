-- Migration: Add missing columns to inventory_items for schema compatibility
-- Created: April 9, 2026
-- Purpose: Fix deployed databases missing columns added after initial migration

-- Note: These columns may already exist if the database was partially migrated
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we use a workaround
-- The application code handles duplicate column errors gracefully

-- Add alcohol_density for spirits/liquids density calculation
ALTER TABLE `inventory_items` ADD COLUMN `alcohol_density` real DEFAULT 0.94;

-- Add pour_size for standard pour measurements
ALTER TABLE `inventory_items` ADD COLUMN `pour_size` real;
