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
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `enable_litestream` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `enable_usb_backup` integer DEFAULT false NOT NULL;