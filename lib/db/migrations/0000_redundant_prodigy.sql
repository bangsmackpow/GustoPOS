CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`email` text,
	`password` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`role` text DEFAULT 'employee' NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`pin` text DEFAULT '0000' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
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
CREATE TABLE `drinks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`description` text,
	`description_es` text,
	`category` text DEFAULT 'other' NOT NULL,
	`tax_category` text DEFAULT 'standard' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`actual_price` real DEFAULT 0 NOT NULL,
	`markup_factor` real DEFAULT 3 NOT NULL,
	`source_type` text DEFAULT 'standard' NOT NULL,
	`is_available` integer DEFAULT 1 NOT NULL,
	`is_on_menu` integer DEFAULT 0 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tab_id` text NOT NULL,
	`drink_id` text NOT NULL,
	`drink_name` text NOT NULL,
	`drink_name_es` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_mxn` real NOT NULL,
	`tax_category` text DEFAULT 'standard' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`drink_id`) REFERENCES `drinks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`discount_type` text DEFAULT 'percentage' NOT NULL,
	`discount_value` real NOT NULL,
	`max_uses` integer,
	`current_uses` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promo_codes_code_unique` ON `promo_codes` (`code`);--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`drink_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`amount_in_ml` real DEFAULT 0 NOT NULL,
	`amount_in_base_unit` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`drink_id`) REFERENCES `drinks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`bar_name` text DEFAULT 'GustoPOS' NOT NULL,
	`bar_icon` text DEFAULT 'Wine',
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
	`enable_litestream` integer DEFAULT 0 NOT NULL,
	`enable_usb_backup` integer DEFAULT 0 NOT NULL,
	`pin_lock_timeout_min` integer DEFAULT 5 NOT NULL,
	`auto_backup_enabled` integer DEFAULT 1 NOT NULL,
	`auto_backup_interval_min` integer DEFAULT 15 NOT NULL,
	`max_auto_backups` integer DEFAULT 5 NOT NULL,
	`last_auto_backup` integer,
	`last_daily_backup` integer,
	`last_weekly_backup` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`opened_by_user_id` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer,
	`expected_cash_mxn` real,
	`actual_cash_mxn` real,
	`cash_variance_mxn` real
);
--> statement-breakpoint
CREATE TABLE `staff_performance` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_user_id` text NOT NULL,
	`shift_id` text NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`staff_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `staff_shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`shift_id` text NOT NULL,
	`staff_user_id` text NOT NULL,
	`clock_in_at` integer DEFAULT (unixepoch()) NOT NULL,
	`clock_out_at` integer,
	`break_start_at` integer,
	`break_end_at` integer,
	`notes` text,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tab_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`tab_id` text NOT NULL,
	`amount_mxn` real NOT NULL,
	`tip_mxn` real DEFAULT 0 NOT NULL,
	`payment_method` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE cascade
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
--> statement-breakpoint
CREATE TABLE `tax_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`rate` real NOT NULL,
	`description` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tax_rates_category_unique` ON `tax_rates` (`category`);--> statement-breakpoint
CREATE TABLE `inventory_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`adjustment_bulk` real DEFAULT 0,
	`adjustment_partial` real DEFAULT 0,
	`reason` text NOT NULL,
	`adjusted_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_audits` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`type` text NOT NULL,
	`subtype` text,
	`parent_item_id` text,
	`base_unit` text DEFAULT 'ml' NOT NULL,
	`base_unit_amount` real DEFAULT 0 NOT NULL,
	`bulk_unit` text,
	`bulk_size` real,
	`partial_unit` text,
	`serving_size` real DEFAULT 0 NOT NULL,
	`serving_unit` text,
	`bottle_size_ml` real,
	`glass_weight_g` real,
	`full_bottle_weight_g` real,
	`density` real DEFAULT 0.94 NOT NULL,
	`bulk_cost` real,
	`order_cost` real DEFAULT 0 NOT NULL,
	`markup_factor` real DEFAULT 3,
	`is_on_menu` integer DEFAULT 1 NOT NULL,
	`sell_single_serving` integer DEFAULT 0 NOT NULL,
	`single_serving_price` real,
	`is_deleted` integer DEFAULT 0 NOT NULL,
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
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`parent_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
