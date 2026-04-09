-- Migration: 0000 - Core tables with full schema
-- Complete schema for fresh database creation
-- All columns match Drizzle schema exactly

CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`role` text DEFAULT 'bartender' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`pin` text DEFAULT '0000' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`password` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`unit` text NOT NULL,
	`unit_size` real NOT NULL,
	`cost_per_unit` real NOT NULL,
	`current_stock` real DEFAULT 0 NOT NULL,
	`minimum_stock` real DEFAULT 1 NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
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
CREATE TABLE `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`drink_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`amount_in_ml` real DEFAULT 0 NOT NULL,
	`amount_in_base_unit` real DEFAULT 0 NOT NULL,
	`cost_contribution` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`drink_id`) REFERENCES `drinks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
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
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`opened_by_user_id` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer
);
--> statement-breakpoint
CREATE TABLE `tabs` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`staff_user_id` text NOT NULL,
	`shift_id` text,
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
	`closed_at` integer,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action
);
