-- Note: password, enable_litestream and enable_usb_backup now included in 0000_slippery_george_stacy.sql
-- This migration creates rushes table

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