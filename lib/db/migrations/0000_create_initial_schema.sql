-- Migration: Create Initial Schema (Final Version)
-- Creates all tables with the simplified, current schema

CREATE TABLE IF NOT EXISTS `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
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
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`type` text DEFAULT 'spirit' NOT NULL,
	`subtype` text,
	`base_unit` text DEFAULT 'ml' NOT NULL,
	`base_unit_amount` real DEFAULT 750 NOT NULL,
	`serving_size` real DEFAULT 44.36 NOT NULL,
	`tare_weight_g` real,
	`full_bottle_weight_g` real,
	`current_stock` real DEFAULT 0 NOT NULL,
	`order_cost` real DEFAULT 0 NOT NULL,
	`low_stock_threshold` real DEFAULT 1 NOT NULL,
	`units_per_case` integer DEFAULT 1 NOT NULL,
	`is_on_menu` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_inventory_items_type` ON `inventory_items`(`type`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_inventory_items_is_on_menu` ON `inventory_items`(`is_on_menu`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `drinks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`description` text,
	`description_es` text,
	`category` text DEFAULT 'other' NOT NULL,
	`actual_price` real DEFAULT 0 NOT NULL,
	`markup_factor` real DEFAULT 3.0 NOT NULL,
	`is_available` integer DEFAULT 1 NOT NULL,
	`is_on_menu` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_drinks_category` ON `drinks`(`category`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_drinks_is_on_menu` ON `drinks`(`is_on_menu`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`drink_id` text NOT NULL,
	`ingredient_id` text,
	`amount_in_base_unit` real NOT NULL,
	FOREIGN KEY (`drink_id`) REFERENCES `drinks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_recipe_ingredients_drink_id` ON `recipe_ingredients`(`drink_id`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_recipe_ingredients_ingredient_id` ON `recipe_ingredients`(`ingredient_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`opened_by_user_id` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `tabs` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`staff_user_id` text NOT NULL,
	`shift_id` text,
	`total_mxn` real DEFAULT 0 NOT NULL,
	`payment_method` text,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`notes` text,
	`opened_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_tabs_status` ON `tabs`(`status`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tab_id` text NOT NULL,
	`drink_id` text NOT NULL,
	`drink_name` text NOT NULL,
	`drink_name_es` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_mxn` real NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`drink_id`) REFERENCES `drinks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_orders_tab_id` ON `orders`(`tab_id`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_orders_drink_id` ON `orders`(`drink_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`bar_name` text DEFAULT 'GustoPOS' NOT NULL,
	`bar_icon` text DEFAULT 'Wine' NOT NULL,
	`usd_to_mxn_rate` real DEFAULT 17.5 NOT NULL,
	`cad_to_mxn_rate` real DEFAULT 12.8 NOT NULL,
	`default_markup_factor` real DEFAULT 3.0 NOT NULL,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_user` text,
	`smtp_password` text,
	`smtp_from_email` text,
	`inventory_alert_email` text,
	`enable_litestream` integer DEFAULT 0 NOT NULL,
	`enable_usb_backup` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `inventory_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`weight_g` real,
	`calculated_base_units` real,
	`counted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`counted_by_user_id` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_inventory_counts_item_id` ON `inventory_counts`(`item_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `rushes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`impact` text DEFAULT 'medium' NOT NULL,
	`type` text DEFAULT 'event' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
