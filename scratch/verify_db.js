const Database = require('better-sqlite3');
const db = new Database('/Users/McKinneyMakesMedia/Library/Application Support/@workspace/desktop-app/gusto.db');
const tables = [
  'users', 'inventory_items', 'drinks', 'recipe_ingredients', 'tabs', 'orders', 
  'shifts', 'staff_shifts', 'settings', 'promo_codes', 'specials', 'rushes', 
  'inventory_audits', 'audit_sessions', 'event_logs', 'periods', 'cogs_entries'
];
console.log("| Table | Status | Records | Notes |");
console.log("|---|---|---|---|");
for (const table of tables) {
  try {
    const row = db.prepare(`SELECT count(*) as count FROM ${table}`).get();
    const count = row.count;
    const status = count > 0 ? "✅" : "⚠️";
    console.log(`| ${table} | ${status} | ${count} | ${count > 0 ? 'Data exists' : 'Empty'} |`);
  } catch (e) {
    console.log(`| ${table} | ❌ | 0 | Error: ${e.message} |`);
  }
}
