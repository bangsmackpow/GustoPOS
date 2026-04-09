-- Migration: 0000 - Complete Schema for Fresh Installs
-- Complete schema replacement for new GustoPOS deployments
-- All columns match Drizzle schema exactly
-- Created: 2026-04-08

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text UNIQUE,
	`password` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`role` text DEFAULT 'bartender' NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`pin` text DEFAULT '0000' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- DRINKS TABLE
-- ==========================================
CREATE TABLE `drinks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`description` text,
	`description_es` text,
	`category` text DEFAULT 'other' NOT NULL,
	`tax_category` text DEFAULT 'standard' NOT NULL,
	`actual_price` real DEFAULT 0 NOT NULL,
	`markup_factor` real DEFAULT 3 NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`is_on_menu` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- INVENTORY ITEMS TABLE (Advanced)
-- ==========================================
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`type` text NOT NULL,
	`subtype` text,
	`parent_item_id` text REFERENCES `inventory_items`(`id`),
	`base_unit` text DEFAULT 'ml' NOT NULL,
	`base_unit_amount` real DEFAULT 0 NOT NULL,
	`bulk_unit` text,
	`bulk_size` real,
	`partial_unit` text,
	`serving_size` real DEFAULT 0 NOT NULL,
	`serving_unit` text,
	`pour_size` real DEFAULT 0 NOT NULL,
	`bottle_size_ml` real,
	`alcohol_density` real DEFAULT 0.955,
	`tare_weight_g` real,
	`glass_weight_g` real,
	`full_bottle_weight_g` real,
	`density` real DEFAULT 0.94 NOT NULL,
	`bulk_cost` real,
	`order_cost` real DEFAULT 0 NOT NULL,
	`markup_factor` real DEFAULT 3.0,
	`is_on_menu` integer DEFAULT true NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`low_stock_method` text DEFAULT 'manual',
	`low_stock_manual_threshold` real,
	`low_stock_threshold` real DEFAULT 0 NOT NULL,
	`low_stock_percent` real,
	`low_stock_percent_base` real,
	`low_stock_usage_days` real,
	`current_bulk` real DEFAULT 0,
	`current_partial` real DEFAULT 0,
	`current_stock` real DEFAULT 0 NOT NULL,
	`units_per_case` integer DEFAULT 1 NOT NULL,
	`last_audited_at` integer,
	`last_audited_by_user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_inventory_items_type` ON `inventory_items`(`type`);
CREATE INDEX `idx_inventory_items_subtype` ON `inventory_items`(`subtype`);
CREATE INDEX `idx_inventory_items_parent` ON `inventory_items`(`parent_item_id`);

-- ==========================================
-- RECIPE INGREDIENTS TABLE
-- Links drinks to inventory items for recipe tracking
-- ==========================================
CREATE TABLE `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`drink_id` text NOT NULL REFERENCES `drinks`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`ingredient_id` text NOT NULL REFERENCES `inventory_items`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`amount_in_ml` real DEFAULT 0 NOT NULL,
	`amount_in_base_unit` real DEFAULT 0 NOT NULL
);

CREATE INDEX `idx_recipe_ingredients_drink` ON `recipe_ingredients`(`drink_id`);
CREATE INDEX `idx_recipe_ingredients_ingredient` ON `recipe_ingredients`(`ingredient_id`);

-- ==========================================
-- ORDERS TABLE
-- ==========================================
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tab_id` text NOT NULL REFERENCES `tabs`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`drink_id` text NOT NULL REFERENCES `drinks`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	`drink_name` text NOT NULL,
	`drink_name_es` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_mxn` real NOT NULL,
	`tax_category` text DEFAULT 'standard' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_orders_tab_id` ON `orders`(`tab_id`);
CREATE INDEX `idx_orders_drink_id` ON `orders`(`drink_id`);

-- ==========================================
-- TABS TABLE
-- ==========================================
CREATE TABLE `tabs` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`staff_user_id` text NOT NULL,
	`shift_id` text REFERENCES `shifts`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL,
	`total_mxn` real DEFAULT 0 NOT NULL,
	`tip_mxn` real DEFAULT 0 NOT NULL,
	`discount_mxn` real DEFAULT 0 NOT NULL,
	`tax_mxn` real DEFAULT 0 NOT NULL,
	`tax_percent` real DEFAULT 0 NOT NULL,
	`promo_code_id` text,
	`payment_method` text,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`notes` text,
	`opened_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer
);

CREATE INDEX `idx_tabs_staff_user_id` ON `tabs`(`staff_user_id`);
CREATE INDEX `idx_tabs_shift_id` ON `tabs`(`shift_id`);
CREATE INDEX `idx_tabs_status` ON `tabs`(`status`);

-- ==========================================
-- TAB PAYMENTS TABLE
-- ==========================================
CREATE TABLE `tab_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`tab_id` text NOT NULL REFERENCES `tabs`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`amount_mxn` real NOT NULL,
	`tip_mxn` real DEFAULT 0 NOT NULL,
	`payment_method` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- SHIFTS TABLE
-- ==========================================
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`opened_by_user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer
);

CREATE INDEX `idx_shifts_opened_by_user` ON `shifts`(`opened_by_user_id`);
CREATE INDEX `idx_shifts_status` ON `shifts`(`status`);

-- ==========================================
-- STAFF SHIFTS TABLE
-- ==========================================
CREATE TABLE `staff_shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`shift_id` text NOT NULL REFERENCES `shifts`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`staff_user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`clock_in_at` integer DEFAULT (unixepoch()) NOT NULL,
	`clock_out_at` integer,
	`break_start_at` integer,
	`break_end_at` integer,
	`notes` text
);

-- ==========================================
-- STAFF PERFORMANCE TABLE
-- ==========================================
CREATE TABLE `staff_performance` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`shift_id` text NOT NULL REFERENCES `shifts`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	`total_orders` integer DEFAULT 0 NOT NULL,
	`total_revenue` real DEFAULT 0 NOT NULL,
	`total_tips` real DEFAULT 0 NOT NULL,
	`total_tabs` integer DEFAULT 0 NOT NULL,
	`avg_order_value` real DEFAULT 0 NOT NULL,
	`avg_tab_value` real DEFAULT 0 NOT NULL,
	`tip_percentage` real DEFAULT 0 NOT NULL,
	`customer_count` integer DEFAULT 0 NOT NULL,
	`orders_per_hour` real DEFAULT 0 NOT NULL,
	`revenue_per_hour` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- SETTINGS TABLE
-- ==========================================
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`bar_name` text DEFAULT 'GustoPOS' NOT NULL,
	`bar_icon` text DEFAULT 'Wine' NOT NULL,
	`base_currency` text DEFAULT 'MXN' NOT NULL,
	`usd_to_mxn_rate` real DEFAULT 17.5 NOT NULL,
	`cad_to_mxn_rate` real DEFAULT 12.8 NOT NULL,
	`default_markup_factor` real DEFAULT 3 NOT NULL,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_user` text,
	`smtp_password` text,
	`smtp_from_email` text,
	`inventory_alert_email` text,
	`enable_litestream` integer DEFAULT false NOT NULL,
	`enable_usb_backup` integer DEFAULT false NOT NULL,
	`pin_lock_timeout_min` integer DEFAULT 5 NOT NULL,
	`auto_backup_enabled` integer DEFAULT true NOT NULL,
	`auto_backup_interval_min` integer DEFAULT 15 NOT NULL,
	`max_auto_backups` integer DEFAULT 5 NOT NULL,
	`last_auto_backup` integer,
	`last_daily_backup` integer,
	`last_weekly_backup` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- TAX RATES TABLE
-- ==========================================
CREATE TABLE `tax_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL UNIQUE,
	`rate` real NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- PROMO CODES TABLE
-- ==========================================
CREATE TABLE `promo_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL UNIQUE,
	`description` text,
	`discount_type` text DEFAULT 'percentage' NOT NULL,
	`discount_value` real NOT NULL,
	`max_uses` integer,
	`current_uses` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- INVENTORY AUDITS TABLE
-- ==========================================
CREATE TABLE `inventory_audits` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
	`audit_date` integer DEFAULT (unixepoch()),
	`audit_entry_method` text,
	`reported_bulk` real,
	`reported_partial` real,
	`reported_total` real,
	`previous_total` real,
	`expected_total` real,
	`system_stock` real DEFAULT 0 NOT NULL,
	`physical_count` real DEFAULT 0 NOT NULL,
	`variance` real DEFAULT 0 NOT NULL,
	`variance_percent` real DEFAULT 0 NOT NULL,
	`audit_reason` text,
	`weight_g` real,
	`calculated_base_units` real,
	`counted_by_user_id` text,
	`notes` text,
	`audited_by_user_id` text,
	`audited_at` integer DEFAULT (unixepoch()),
	`counted_at` integer DEFAULT (unixepoch()),
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_inventory_audits_item_id` ON `inventory_audits`(`item_id`);
CREATE INDEX `idx_inventory_audits_audited_at` ON `inventory_audits`(`audited_at`);

-- ==========================================
-- INVENTORY ADJUSTMENTS TABLE
-- ==========================================
CREATE TABLE `inventory_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
	`adjustment_bulk` real DEFAULT 0,
	`adjustment_partial` real DEFAULT 0,
	`reason` text NOT NULL,
	`adjusted_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_inventory_adjustments_item_id` ON `inventory_adjustments`(`item_id`);

-- ==========================================
-- RUSHES TABLE
-- ==========================================
CREATE TABLE `rushes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`impact` text DEFAULT 'medium' NOT NULL,
	`type` text DEFAULT 'event' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- ==========================================
-- EVENT LOGS TABLE
-- ==========================================
CREATE TABLE `event_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_event_logs_user_id` ON `event_logs`(`user_id`);
CREATE INDEX `idx_event_logs_entity` ON `event_logs`(`entity_type`, `entity_id`);

-- ==========================================
-- SESSIONS TABLE (Express Session Store)
-- ==========================================
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);

-- Insert default settings
INSERT INTO `settings` (`id`, `bar_name`, `base_currency`, `usd_to_mxn_rate`, `cad_to_mxn_rate`, `default_markup_factor`)
VALUES ('default', 'GustoPOS', 'MXN', 17.5, 12.8, 3.0);

-- Insert default tax rates
INSERT INTO `tax_rates` (`id`, `category`, `rate`, `description`)
VALUES 
	('tax-standard', 'standard', 0.16, 'Standard 16%'),
	('tax-reduced', 'reduced', 0.08, 'Reduced 8%'),
	('tax-zero', 'zero', 0.0, 'Zero Rate'),
	('tax-exempt', 'exempt', -1.0, 'Exempt');