#!/usr/bin/env node
// Schema comparison tool for GustoPOS database
import Database from 'better-sqlite3';

const dbPath = process.argv[2] || 'c:\\users\\curtis\\downloads\\gusto.db.backup';

// Current schema as provided
const currentSchema = {
  users: ['id', 'email', 'password', 'firstName', 'lastName', 'profileImageUrl', 'role', 'language', 'pin', 'isActive', 'createdAt', 'updatedAt'],
  ingredients: ['id', 'name', 'nameEs', 'unit', 'unitSize', 'costPerUnit', 'currentStock', 'minimumStock', 'category', 'createdAt', 'updatedAt'],
  drinks: ['id', 'name', 'nameEs', 'description', 'descriptionEs', 'category', 'markupFactor', 'upcharge', 'actualPrice', 'isAvailable', 'createdAt', 'updatedAt'],
  recipe_ingredients: ['id', 'drinkId', 'ingredientId', 'amountInMl'],
  shifts: ['id', 'name', 'status', 'openedByUserId', 'startedAt', 'closedAt'],
  tabs: ['id', 'nickname', 'status', 'staffUserId', 'shiftId', 'totalMxn', 'paymentMethod', 'currency', 'notes', 'openedAt', 'closedAt'],
  orders: ['id', 'tabId', 'drinkId', 'drinkName', 'drinkNameEs', 'quantity', 'unitPriceMxn', 'notes', 'createdAt'],
  settings: ['id', 'barName', 'barIcon', 'usdToMxnRate', 'cadToMxnRate', 'defaultMarkupFactor', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpFromEmail', 'inventoryAlertEmail', 'enableLitestream', 'enableUsbBackup', 'updatedAt'],
  rushes: ['id', 'title', 'description', 'startTime', 'endTime', 'impact', 'type', 'createdAt'],
};

try {
  console.log('='.repeat(100));
  console.log('FRIEND\'S DATABASE SCHEMA EXTRACTION');
  console.log('='.repeat(100));
  console.log(`\nDatabase: ${dbPath}\n`);

  const db = new Database(dbPath, { readonly: true });

  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  const backupSchema = {};

  console.log(`Total Tables: ${tables.length}`);
  console.log(`\nTables: ${tables.map(t => t.name).join(', ')}\n`);

  // Extract schema for each table
  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    
    console.log(`\n${'='.repeat(100)}`);
    console.log(`TABLE: ${table.name}`);
    console.log(`${'='.repeat(100)}`);
    console.log(
      `${'Column Name'.padEnd(30)} | ${'Type'.padEnd(15)} | ${'Not Null'.padEnd(10)} | ${'Default'.padEnd(20)} | ${'Primary Key'.padEnd(10)}`
    );
    console.log(`${'-'.repeat(100)}`);

    backupSchema[table.name] = {};
    for (const col of columns) {
      backupSchema[table.name][col.name] = {
        type: col.type,
        not_null: col.notnull,
        default: col.dflt_value,
        pk: col.pk,
      };
      const not_null_str = col.notnull ? 'YES' : 'NO';
      const default_str = col.dflt_value ? String(col.dflt_value) : 'NULL';
      const pk_str = col.pk ? 'YES' : 'NO';
      console.log(
        `${col.name.padEnd(30)} | ${col.type.padEnd(15)} | ${not_null_str.padEnd(10)} | ${default_str.padEnd(20)} | ${pk_str.padEnd(10)}`
      );
    }
  }

  db.close();

  // Analysis
  console.log(`\n\n${'='.repeat(100)}`);
  console.log('SCHEMA COMPARISON ANALYSIS');
  console.log(`${'='.repeat(100)}`);

  const backupTables = new Set(Object.keys(backupSchema));
  const currentTables = new Set(Object.keys(currentSchema));

  // Extra tables
  const friendOnlyTables = Array.from(backupTables).filter((t) => !currentTables.has(t));
  if (friendOnlyTables.length > 0) {
    console.log(`\n❌ TABLES IN FRIEND'S DB BUT NOT IN CURRENT SCHEMA:`);
    for (const table of friendOnlyTables.sort()) {
      console.log(`   • ${table}`);
      for (const col of Object.keys(backupSchema[table]).sort()) {
        console.log(`       - ${col}: ${backupSchema[table][col].type}`);
      }
    }
  } else {
    console.log(`\n✓ No extra tables in friend's DB`);
  }

  // Missing tables
  const currentOnlyTables = Array.from(currentTables).filter((t) => !backupTables.has(t));
  if (currentOnlyTables.length > 0) {
    console.log(`\n⚠️  TABLES IN CURRENT SCHEMA BUT NOT IN FRIEND'S DB:`);
    for (const table of currentOnlyTables.sort()) {
      console.log(`   • ${table}`);
    }
  } else {
    console.log(`\n✓ All current tables exist in friend's DB`);
  }

  // Column comparison
  console.log(`\n${'='.repeat(100)}`);
  console.log('COLUMN COMPARISON FOR SHARED TABLES');
  console.log(`${'='.repeat(100)}`);

  const sharedTables = Array.from(backupTables).filter((t) => currentTables.has(t));

  let totalExtraCols = 0;
  let totalMissingCols = 0;

  for (const table of sharedTables.sort()) {
    const backupCols = new Set(Object.keys(backupSchema[table]));
    const currentCols = new Set(currentSchema[table]);

    const extraCols = Array.from(backupCols).filter((c) => !currentCols.has(c));
    const missingCols = Array.from(currentCols).filter((c) => !backupCols.has(c));

    totalExtraCols += extraCols.length;
    totalMissingCols += missingCols.length;

    if (extraCols.length > 0 || missingCols.length > 0) {
      console.log(`\n📋 TABLE: ${table}`);

      if (extraCols.length > 0) {
        console.log(`   ✨ EXTRA COLUMNS IN FRIEND'S DB (not in current):`);
        for (const col of extraCols.sort()) {
          console.log(`      • ${col}: ${backupSchema[table][col].type}`);
        }
      }

      if (missingCols.length > 0) {
        console.log(`   ❌ MISSING COLUMNS IN FRIEND'S DB (exist in current):`);
        for (const col of missingCols.sort()) {
          console.log(`      • ${col}`);
        }
      }
    } else {
      console.log(`\n✓ ${table}: All columns match`);
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(100)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(100)}`);
  console.log(`\nBackup Database Tables: ${backupTables.size}`);
  console.log(`Current Schema Tables: ${currentTables.size}`);
  console.log(`\nExtra tables in friend's DB: ${friendOnlyTables.length}`);
  console.log(`Missing tables in friend's DB: ${currentOnlyTables.length}`);
  console.log(`Extra columns across all shared tables: ${totalExtraCols}`);
  console.log(`Missing columns across all shared tables: ${totalMissingCols}`);
  
  if (totalExtraCols === 0 && totalMissingCols === 0 && friendOnlyTables.length === 0 && currentOnlyTables.length === 0) {
    console.log('\n✅ SCHEMAS ARE IDENTICAL!');
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
