-- Migration 0006: Add soft delete columns to critical tables
ALTER TABLE drinks ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
