ALTER TABLE `settings` ADD `bar_icon` text DEFAULT 'Wine' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `drinks_name_unique` ON `drinks` (`name`);