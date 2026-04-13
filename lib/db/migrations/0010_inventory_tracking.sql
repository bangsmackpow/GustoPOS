-- Migration: Inventory Tracking, Close Types, and Specials
-- Created: April 11, 2026
-- Purpose: Add reservedStock for soft-delete, closeType for sold/comp tracking, specials for promotions

-- 1. Add reservedStock to inventory_items (for soft-delete inventory tracking)
ALTER TABLE `inventory_items` ADD COLUMN `reserved_stock` real DEFAULT 0;

-- 2. Add closeType to tabs (sale, comp, staff)
ALTER TABLE `tabs` ADD COLUMN `close_type` text DEFAULT 'sale';

-- 3. Add compReason to tabs (reason when closeType = comp)
ALTER TABLE `tabs` ADD COLUMN `comp_reason` text;

-- 4. Create specials table for drink promotions
CREATE TABLE `specials` (
  `id` text PRIMARY KEY,
  `drink_id` text REFERENCES `drinks`(`id`),
  `special_type` text NOT NULL DEFAULT 'manual',
  `discount_type` text NOT NULL,
  `discount_value` real NOT NULL,
  `days_of_week` text,
  `start_hour` integer,
  `end_hour` integer,
  `start_date` integer,
  `end_date` integer,
  `is_active` integer NOT NULL DEFAULT 1,
  `name` text,
  `created_by_user_id` text,
  `created_at` integer NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 5. Create index for specials lookups
CREATE INDEX `idx_specials_drink_id` ON `specials`(`drink_id`);
CREATE INDEX `idx_specials_is_active` ON `specials`(`is_active`);
