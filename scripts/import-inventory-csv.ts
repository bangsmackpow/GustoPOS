#!/usr/bin/env node
/**
 * CSV Inventory Import Script
 * Parses Luke's 10-column CSV and populates inventory_items table
 * 
 * CSV Format:
 * Name, Type, Subtype, Bulk Size, Bulk Unit, Serving Size, Serving Unit, Bulk Cost, Full Inventory, Partial Inventory
 * 
 * Usage:
 * npx tsx scripts/import-inventory-csv.ts /path/to/luke-inventory.csv
 */

import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import crypto from "crypto";
import Database from "better-sqlite3";

interface LukesCsvRow {
  Name: string;
  Type: string;
  Subtype: string;
  "Bulk Size": string;
  "Bulk Unit": string;
  "Serving Size": string;
  "Serving Unit": string;
  "Bulk Cost": string;
  "Full Inventory": string;
  "Partial Inventory": string;
}

async function importInventoryCSV(csvPath: string) {
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  // Open database
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "data/gusto.db";
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath);
  let importedCount = 0;
  let errorCount = 0;

  console.log(`📖 Reading CSV: ${csvPath}`);
  console.log(`💾 Writing to: ${dbPath}`);
  console.log("");

  return new Promise<void>((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    createReadStream(csvPath)
      .pipe(parser)
      .on("data", async (row: LukesCsvRow) => {
        try {
          // Determine tracking type based on bulk unit
          let trackingType = "count"; // Default
          if (["ml", "oz", "l", "liter"].includes(row["Bulk Unit"].toLowerCase())) {
            trackingType = "tare"; // Liquor (volume-based)
          } else if (["g", "gram", "kg"].includes(row["Bulk Unit"].toLowerCase())) {
            trackingType = "weight"; // Bulk items (weight-based)
          }

          // Generate ID
          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);

          // Prepare insert statement
          const stmt = db.prepare(`
            INSERT INTO inventory_items (
              id, name, type, subtype, tracking_type,
              bulk_unit, bulk_size, partial_unit,
              serving_size, serving_unit,
              bulk_cost, current_bulk, current_partial,
              is_on_menu, markup_factor,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            id, // id
            row.Name, // name
            row.Type.toLowerCase(), // type
            row.Subtype.toLowerCase(), // subtype
            trackingType, // tracking_type
            row["Bulk Unit"], // bulk_unit
            parseFloat(row["Bulk Size"]), // bulk_size
            row["Serving Unit"], // partial_unit
            parseFloat(row["Serving Size"]), // serving_size
            row["Serving Unit"], // serving_unit
            parseFloat(row["Bulk Cost"]), // bulk_cost
            parseFloat(row["Full Inventory"]), // current_bulk
            parseFloat(row["Partial Inventory"]), // current_partial
            1, // is_on_menu (default true)
            3.0, // markup_factor (default)
            now, // created_at
            now // updated_at
          );

          // Also create initial audit record
          const auditStmt = db.prepare(`
            INSERT INTO inventory_counts (
              id, item_id, audit_date, audited_by_user_id,
              audit_entry_method, reported_bulk, reported_partial,
              reported_total, previous_total, expected_total,
              variance, variance_reason, notes,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const reportedTotal =
            parseFloat(row["Full Inventory"]) * parseFloat(row["Bulk Size"]) +
            parseFloat(row["Partial Inventory"]);

          auditStmt.run(
            crypto.randomUUID(), // id
            id, // item_id
            now, // audit_date
            "system", // audited_by_user_id (system import)
            "bulk_partial", // audit_entry_method
            parseFloat(row["Full Inventory"]), // reported_bulk
            parseFloat(row["Partial Inventory"]), // reported_partial
            reportedTotal, // reported_total
            reportedTotal, // previous_total
            reportedTotal, // expected_total
            0, // variance
            "initial_import", // variance_reason
            `Imported from CSV - Type: ${trackingType}`, // notes
            now // created_at
          );

          importedCount++;
          console.log(`✅ [${importedCount}] ${row.Name} (${row.Type})`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error importing ${row.Name}:`, error);
        }
      })
      .on("end", () => {
        db.close();
        console.log("");
        console.log(`📊 Import Complete!`);
        console.log(`   ✅ Imported: ${importedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log("");
        console.log(`🚀 Inventory system ready to use!`);
        resolve();
      })
      .on("error", (error) => {
        db.close();
        console.error("❌ CSV parse error:", error);
        reject(error);
      });
  });
}

// Get CSV path from command line argument
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/import-inventory-csv.ts <path-to-csv>");
  process.exit(1);
}

importInventoryCSV(csvPath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
