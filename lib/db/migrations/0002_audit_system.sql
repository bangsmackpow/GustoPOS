-- Migration: Audit System Enhancement
-- Created: April 10, 2026
-- Purpose: Add audit workflow support (sessions, pool/collections modes, thresholds)

-- 1. Add audit_method column to inventory_items (for pool/collections mode)
ALTER TABLE `inventory_items` ADD COLUMN `audit_method` text DEFAULT 'auto';

-- 2. Add variance_warning_threshold to settings
ALTER TABLE `settings` ADD COLUMN `variance_warning_threshold` real DEFAULT 5.0;

-- 3. Add session_id to inventory_audits (link audits to batch sessions)
ALTER TABLE `inventory_audits` ADD COLUMN `session_id` text;

-- 4. Create audit_sessions table for batch auditing workflow
CREATE TABLE `audit_sessions` (
  `id` text PRIMARY KEY,
  `status` text NOT NULL DEFAULT 'in_progress',
  `category_filter` text,
  `type_filter` text,
  `started_by_user_id` text NOT NULL,
  `completed_by_user_id` text,
  `started_at` integer,
  `completed_at` integer,
  `item_count` integer DEFAULT 0,
  `completed_count` integer DEFAULT 0,
  `created_at` integer NOT NULL DEFAULT (strftime('%s', 'now'))
);