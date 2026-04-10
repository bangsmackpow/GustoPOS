const Database = require('better-sqlite3');
const db = new Database('./lib/db/local.db');
try {
  const row = db.prepare('SELECT * FROM inventory_items LIMIT 1').get();
  console.log('Success:', row ? row.name : 'No rows');
} catch (e) {
  console.error('Error:', e.message);
}
