ALTER TABLE `inventory_items` ADD `parent_item_id` text REFERENCES `inventory_items`(`id`);
