-- Translations Table (if needed for future database-backed i18n)
-- Currently: Translations are stored in artifacts/gusto-pos/src/lib/utils.ts as JavaScript objects
-- This SQL can be used to migrate to a database table if needed

CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY,
  key_text TEXT NOT NULL UNIQUE,
  en TEXT NOT NULL,
  es TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Note: There are 200+ translation keys in the JavaScript file including:
-- Navigation: dashboard, tabs, menu, inventory, reports, settings
-- Auth: login, logout, switch_user, pin_prompt, etc.
-- Shifts: active_shift, start_shift, close_shift, etc.
-- Tabs: open_tabs, new_tab, close_tab, etc.
-- Orders: add_drink, total, cash, card, tip, etc.
-- Inventory: add_item, edit_item, delete_item, audit, etc.
-- Settings: system defaults, staff management, etc.
-- Reports: sales_analytics, sales_by_drink, etc.
-- And 100+ more keys for all UI elements

-- Example queries to migrate:
-- INSERT INTO translations (id, key_text, en, es) 
-- SELECT 'nav_dashboard', 'dashboard', 'Dashboard', 'Panel';
-- etc.