import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const databaseUrl = process.env["DATABASE_URL"] || "file:./gusto.db";

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Get database file path for backup operations
export function getDatabasePath(): string {
  let dbPath = databaseUrl
    .replace(/^file:\/\//, "")
    .replace(/^file:/, "")
    .replace(/%20/g, " ");
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.resolve(process.cwd(), dbPath);
  }
  return dbPath;
}

// Get backup directory path
export function getBackupDirectory(): string {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  return path.join(dbDir, "backups");
}

// Ensure backup directory exists
export function ensureBackupDirectory(): string {
  const backupDir = getBackupDirectory();
  if (!fs.existsSync(backupDir)) {
    console.log(`Creating backup directory: ${backupDir}`);
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

// Ensure the application support directory exists (for desktop app)
export function ensureAppDataDirectory(): string {
  const isDesktop = process.env.GUSTO_DESKTOP === "true";
  if (isDesktop) {
    const appSupportDir = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      "Library",
      "Application Support",
      "GustoPOS",
    );
    if (!fs.existsSync(appSupportDir)) {
      console.log(`Creating app data directory: ${appSupportDir}`);
      fs.mkdirSync(appSupportDir, { recursive: true });
    }
    return appSupportDir;
  }
  return "";
}

// Configure SQLite for optimal local performance
async function configureSQLitePerformance() {
  try {
    // Enable WAL mode for better concurrency and crash recovery
    await client.execute({ sql: "PRAGMA journal_mode=WAL", args: [] });
    // Use NORMAL sync for speed/durability balance
    await client.execute({ sql: "PRAGMA synchronous=NORMAL", args: [] });
    // Increase cache size to 64MB
    await client.execute({ sql: "PRAGMA cache_size=-64000", args: [] });
    // Store temp tables in memory
    await client.execute({ sql: "PRAGMA temp_store=MEMORY", args: [] });
    // Enable foreign keys
    await client.execute({ sql: "PRAGMA foreign_keys=ON", args: [] });
    console.log("✓ SQLite performance configured (WAL mode enabled)");
  } catch (error) {
    console.warn("Could not configure SQLite performance settings:", error);
  }
}

// Run integrity check on startup
async function runIntegrityCheck(): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: "PRAGMA integrity_check",
      args: [],
    });
    if (result.rows && result.rows.length > 0) {
      const status = result.rows[0] as unknown as { integrity_check: string };
      if (status.integrity_check === "ok") {
        console.log("✓ Database integrity check passed");
        return true;
      } else {
        console.error(
          "✗ Database integrity check failed:",
          status.integrity_check,
        );
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn("Could not run integrity check:", error);
    return true;
  }
}

// Ensure the database directory exists (for file: URLs)
if (databaseUrl.startsWith("file:")) {
  // Decode URL encoding (%20 -> space) when extracting path
  const dbPath = databaseUrl.replace(/^file:/, "").replace(/%20/g, " ");
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

export const client = createClient({ url: databaseUrl });
export const db = drizzle(client, { schema });

// Use absolute path for migrations in production
const migrationsPath =
  process.env.MIGRATIONS_PATH || path.resolve(__dirname, "migrations");

async function upsertAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "GUSTO";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPin = process.env.ADMIN_PIN || "0000";

  if (!adminPassword) {
    console.warn("[Initialize] ADMIN_PASSWORD not set. Skipping admin upsert.");
    return;
  }

  try {
    console.log(
      `[Initialize] Checking for existing admin user: ${adminUsername}`,
    );
    const [existing] = await db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.username, adminUsername));

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const hashedPin = await bcrypt.hash(adminPin, 10);

    if (existing) {
      console.log(
        `[Initialize] Found existing admin user, updating credentials...`,
      );
      await db
        .update(schema.usersTable)
        .set({
          password: hashedPassword,
          pin: hashedPin,
          role: "admin",
          isActive: 1,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(schema.usersTable.id, existing.id));
      console.log(
        `[Initialize] ✓ Admin user updated successfully: ${adminUsername}`,
      );
    } else {
      console.log(`[Initialize] No existing user found, creating new admin...`);
      await db.insert(schema.usersTable).values({
        username: adminUsername,
        password: hashedPassword,
        pin: hashedPin,
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        language: "en",
        isActive: 1,
      });
      console.log(
        `[Initialize] ✓ Admin user created successfully: ${adminUsername}`,
      );
    }
  } catch (err: any) {
    console.error("[Initialize] ✗ FAILED to upsert admin user:", err.message);
    throw new Error(`Admin user initialization failed: ${err.message}`);
  }
}

export async function initializeDatabase() {
  try {
    console.log("[Initialize] Starting database initialization...");
    console.log(`[Initialize] Database URL: ${databaseUrl}`);

    // Configure SQLite for optimal local performance
    await configureSQLitePerformance();

    // Ensure app data directory exists (for desktop)
    ensureAppDataDirectory();

    // Ensure backup directory exists
    ensureBackupDirectory();

    // Print full path for debugging
    let dbPath = "";
    if (databaseUrl?.startsWith("file:")) {
      dbPath = databaseUrl.replace(/^file:\/\//, "").replace(/%20/g, " ");
      console.log(`[Initialize] Resolved database path: ${dbPath}`);
    }

    console.log(`[Initialize] Using migrations from: ${migrationsPath}`);

    // Ensure the database directory exists (for file: URLs)
    if (databaseUrl?.startsWith("file:")) {
      let resolvedDbPath = dbPath;
      // Handle relative paths
      if (!path.isAbsolute(resolvedDbPath)) {
        resolvedDbPath = path.resolve(process.cwd(), resolvedDbPath);
      }
      const dbDir = path.dirname(resolvedDbPath);
      console.log(`[Initialize] Database directory: ${dbDir}`);
      if (!fs.existsSync(dbDir)) {
        console.log(`[Initialize] Creating database directory: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
      } else {
        console.log(`[Initialize] Database directory exists: ${dbDir}`);
      }
      console.log(`[Initialize] Database full path: ${resolvedDbPath}`);

      // Check if database file exists and is valid
      if (fs.existsSync(resolvedDbPath)) {
        const stats = fs.statSync(resolvedDbPath);
        console.log(
          `[Initialize] Database file exists, size: ${stats.size} bytes`,
        );
        if (stats.size === 0) {
          console.error(
            "[Initialize] ✗ Database file is empty (0 bytes) - this will cause errors",
          );
          console.log("[Initialize] Deleting empty database file...");
          fs.unlinkSync(resolvedDbPath);
          console.log(
            "[Initialize] Empty database file deleted. SQLite will create a new one.",
          );
        }
      } else {
        console.log(
          "[Initialize] Database file does not exist - SQLite will create it",
        );
      }
    }

    // Run integrity check
    console.log("[Initialize] Running integrity check...");
    const integrityOk = await runIntegrityCheck();
    if (!integrityOk) {
      console.error(
        "[Initialize] ⚠️ Database integrity check failed - data may be corrupted",
      );
    }

    // Verify migrations folder exists
    console.log(`[Initialize] Checking migrations folder: ${migrationsPath}`);
    if (!fs.existsSync(migrationsPath)) {
      console.error(
        `[Initialize] ✗ Migrations folder not found: ${migrationsPath}`,
      );
      throw new Error(`Migrations folder not found: ${migrationsPath}`);
    }
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((f) => f.endsWith(".sql"));
    console.log(`[Initialize] Found ${migrationFiles.length} migration files`);

    // Check if critical tables already exist BEFORE running migrations
    // This handles the case where database exists but migrations tracking is broken
    console.log("[Initialize] Checking if database tables already exist...");
    let tablesAlreadyExist = false;
    try {
      const existingTables = await db
        .select({ name: sql<string>`name` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table' AND name = 'inventory_items'`);

      if (existingTables.length > 0) {
        tablesAlreadyExist = true;
        console.log(
          "[Initialize] ✓ Tables already exist - checking schema completeness...",
        );

        // Verify critical columns exist across all tables
        try {
          // Check inventory_items for all required columns
          const invColumns = await db.all(
            sql`PRAGMA table_info(inventory_items)`,
          );
          const invColNames = invColumns.map((c: any) => c.name);
          const requiredInvCols = [
            "parent_item_id",
            "alcohol_density",
            "audit_method",
            "tracking_mode",
            "reserved_stock",
            "container_weight_g",
          ];
          const hasAllInvCols = requiredInvCols.every((name) =>
            invColNames.includes(name),
          );

          // Check settings for all required columns
          const settingsColumns = await db.all(
            sql`PRAGMA table_info(settings)`,
          );
          const settingsColNames = settingsColumns.map((c: any) => c.name);
          const requiredSettingsCols = [
            "variance_warning_threshold",
            "default_alcohol_density",
            "default_serving_size_ml",
            "default_bottle_size_ml",
            "default_tracking_mode",
            "default_audit_method",
          ];
          const hasAllSettingsCols = requiredSettingsCols.every((name) =>
            settingsColNames.includes(name),
          );

          // Check orders for void columns
          const ordersColumns = await db.all(sql`PRAGMA table_info(orders)`);
          const ordersColNames = ordersColumns.map((c: any) => c.name);
          const hasVoidColumns = [
            "voided",
            "void_reason",
            "voided_by_user_id",
            "voided_at",
          ].every((name) => ordersColNames.includes(name));

          // Check tabs for close_type
          const tabsColumns = await db.all(sql`PRAGMA table_info(tabs)`);
          const tabsColNames = tabsColumns.map((c: any) => c.name);
          const hasTabsCols = ["close_type", "comp_reason"].every((name) =>
            tabsColNames.includes(name),
          );

          if (
            hasAllInvCols &&
            hasAllSettingsCols &&
            hasVoidColumns &&
            hasTabsCols
          ) {
            console.log(
              "[Initialize] ✓ Schema is complete - skipping migrations",
            );
          } else {
            console.log(
              "[Initialize] ⚠ Schema incomplete - will add missing columns",
            );
            if (!hasAllInvCols)
              console.log(
                "[Initialize]   Missing inventory columns:",
                requiredInvCols.filter((c) => !invColNames.includes(c)),
              );
            if (!hasAllSettingsCols)
              console.log(
                "[Initialize]   Missing settings columns:",
                requiredSettingsCols.filter(
                  (c) => !settingsColNames.includes(c),
                ),
              );
            if (!hasVoidColumns)
              console.log("[Initialize]   Missing orders columns");
            if (!hasTabsCols)
              console.log("[Initialize]   Missing tabs columns");
            tablesAlreadyExist = false;
          }
        } catch (colError) {
          console.log(
            "[Initialize] ⚠ Could not verify columns - will run migrations:",
            colError,
          );
          tablesAlreadyExist = false;
        }
      }
    } catch (checkError: any) {
      console.log(
        "[Initialize] Could not check existing tables:",
        checkError.message,
      );
    }

    let migrationFailed = false;
    let duplicateColumnError = false;
    if (!tablesAlreadyExist) {
      console.log("[Initialize] Running database migrations...");
      try {
        await migrate(db, { migrationsFolder: migrationsPath });
        console.log("[Initialize] ✓ Migration check complete.");
      } catch (error: any) {
        migrationFailed = true;
        console.error(
          "[Initialize] ✗ Migration execution error:",
          error.message,
        );

        // Special handling for "duplicate column" errors
        if (error.message && error.message.includes("duplicate column")) {
          console.log(
            "[Initialize] ⚠ Migration failed due to duplicate column - this is OK if schema already exists",
          );
          migrationFailed = false; // Treat as success
          duplicateColumnError = true;
        }
      }

      // Fallback: Ensure critical migration columns exist (drizzle migrator doesn't always run ALTER TABLE)
      console.log("[Initialize] Ensuring migration columns exist...");
      try {
        const invCols = await db.all(sql`PRAGMA table_info(inventory_items)`);
        const colNames = invCols.map((c: any) => c.name);

        // sell_single_serving (was in original 0000 but may be missing)
        if (!colNames.includes("sell_single_serving")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN sell_single_serving integer DEFAULT 0`,
          );
          console.log("[Initialize] Added column: sell_single_serving");
        }
        // single_serving_price (was in original 0000 but may be missing)
        if (!colNames.includes("single_serving_price")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN single_serving_price real`,
          );
          console.log("[Initialize] Added column: single_serving_price");
        }
        // Migration 0001 columns
        if (!colNames.includes("alcohol_density")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN alcohol_density real DEFAULT 0.94`,
          );
          console.log("[Initialize] Added column: alcohol_density");
        }
        if (!colNames.includes("pour_size")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN pour_size real`,
          );
          console.log("[Initialize] Added column: pour_size");
        }
        // Migration 0002 columns
        if (!colNames.includes("audit_method")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN audit_method text DEFAULT 'auto'`,
          );
          console.log("[Initialize] Added column: audit_method");
        }
        // Tracking mode column
        if (!colNames.includes("tracking_mode")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN tracking_mode text DEFAULT 'auto'`,
          );
          console.log("[Initialize] Added column: tracking_mode");
        }

        // Stock tracking columns (may be missing from older databases)
        if (!colNames.includes("current_bulk")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN current_bulk real DEFAULT 0`,
          );
          console.log("[Initialize] Added column: current_bulk");
        }
        if (!colNames.includes("current_partial")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN current_partial real DEFAULT 0`,
          );
          console.log("[Initialize] Added column: current_partial");
        }
        if (!colNames.includes("current_stock")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN current_stock real DEFAULT 0`,
          );
          console.log("[Initialize] Added column: current_stock");
        }
        // reservedStock for soft-delete tracking
        if (!colNames.includes("reserved_stock")) {
          await db.run(
            sql`ALTER TABLE inventory_items ADD COLUMN reserved_stock real DEFAULT 0`,
          );
          console.log("[Initialize] Added column: reserved_stock");
        }
        // containerWeightG (renamed from glassWeightG)
        if (!colNames.includes("container_weight_g")) {
          if (colNames.includes("glass_weight_g")) {
            await db.run(
              sql`ALTER TABLE inventory_items RENAME COLUMN glass_weight_g TO container_weight_g`,
            );
            console.log(
              "[Initialize] Renamed column: glass_weight_g -> container_weight_g",
            );
          } else {
            await db.run(
              sql`ALTER TABLE inventory_items ADD COLUMN container_weight_g real`,
            );
            console.log("[Initialize] Added column: container_weight_g");
          }
        }

        // Settings columns
        const setCols = await db.all(sql`PRAGMA table_info(settings)`);
        const setColNames = setCols.map((c: any) => c.name);
        if (!setColNames.includes("variance_warning_threshold")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN variance_warning_threshold real DEFAULT 5.0`,
          );
          console.log("[Initialize] Added column: variance_warning_threshold");
        }
        if (!setColNames.includes("default_alcohol_density")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_alcohol_density real DEFAULT 0.94`,
          );
          console.log("[Initialize] Added column: default_alcohol_density");
        }
        if (!setColNames.includes("default_serving_size_ml")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_serving_size_ml real DEFAULT 44.36`,
          );
          console.log("[Initialize] Added column: default_serving_size_ml");
        }
        if (!setColNames.includes("default_bottle_size_ml")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_bottle_size_ml real DEFAULT 750`,
          );
          console.log("[Initialize] Added column: default_bottle_size_ml");
        }
        if (!setColNames.includes("default_units_per_case")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_units_per_case integer DEFAULT 1`,
          );
          console.log("[Initialize] Added column: default_units_per_case");
        }
        if (!setColNames.includes("default_low_stock_threshold")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_low_stock_threshold real DEFAULT 0`,
          );
          console.log("[Initialize] Added column: default_low_stock_threshold");
        }
        if (!setColNames.includes("default_tracking_mode")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_tracking_mode text DEFAULT 'auto'`,
          );
          console.log("[Initialize] Added column: default_tracking_mode");
        }
        if (!setColNames.includes("default_audit_method")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN default_audit_method text DEFAULT 'auto'`,
          );
          console.log("[Initialize] Added column: default_audit_method");
        }
        // USB backup path column
        if (!setColNames.includes("usb_backup_path")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN usb_backup_path text`,
          );
          console.log("[Initialize] Added column: usb_backup_path");
        }
        // Report export path column
        if (!setColNames.includes("report_export_path")) {
          await db.run(
            sql`ALTER TABLE settings ADD COLUMN report_export_path text`,
          );
          console.log("[Initialize] Added column: report_export_path");
        }

        // Rushes columns
        const rushCols = await db.all(sql`PRAGMA table_info(rushes)`);
        const rushColNames = rushCols.map((c: any) => c.name);
        if (!rushColNames.includes("repeat_event")) {
          await db.run(
            sql`ALTER TABLE rushes ADD COLUMN repeat_event integer DEFAULT 0`,
          );
          console.log("[Initialize] Added column: repeat_event");
        }

        // Tabs columns (closeType, compReason)
        const tabCols = await db.all(sql`PRAGMA table_info(tabs)`);
        const tabColNames = tabCols.map((c: any) => c.name);
        if (!tabColNames.includes("close_type")) {
          await db.run(
            sql`ALTER TABLE tabs ADD COLUMN close_type text DEFAULT 'sale'`,
          );
          console.log("[Initialize] Added column: close_type");
        }
        if (!tabColNames.includes("comp_reason")) {
          await db.run(sql`ALTER TABLE tabs ADD COLUMN comp_reason text`);
          console.log("[Initialize] Added column: comp_reason");
        }

        // Orders columns (void tracking)
        const orderCols = await db.all(sql`PRAGMA table_info(orders)`);
        const orderColNames = orderCols.map((c: any) => c.name);
        if (!orderColNames.includes("voided")) {
          await db.run(
            sql`ALTER TABLE orders ADD COLUMN voided integer DEFAULT 0`,
          );
          console.log("[Initialize] Added column: voided");
        }
        if (!orderColNames.includes("void_reason")) {
          await db.run(sql`ALTER TABLE orders ADD COLUMN void_reason text`);
          console.log("[Initialize] Added column: void_reason");
        }
        if (!orderColNames.includes("voided_by_user_id")) {
          await db.run(
            sql`ALTER TABLE orders ADD COLUMN voided_by_user_id text`,
          );
          console.log("[Initialize] Added column: voided_by_user_id");
        }
        if (!orderColNames.includes("voided_at")) {
          await db.run(sql`ALTER TABLE orders ADD COLUMN voided_at integer`);
          console.log("[Initialize] Added column: voided_at");
        }
        if (!orderColNames.includes("discount_mxn")) {
          await db.run(
            sql`ALTER TABLE orders ADD COLUMN discount_mxn real DEFAULT 0`,
          );
          console.log("[Initialize] Added column: discount_mxn");
        }

        // Specials table
        const specialsTables = await db.all(
          sql`SELECT name FROM sqlite_master WHERE type='table' AND name='specials'`,
        );
        if (specialsTables.length === 0) {
          await db.run(sql`CREATE TABLE specials (
            id text PRIMARY KEY,
            drink_id text REFERENCES drinks(id),
            category text,
            special_type text NOT NULL DEFAULT 'manual',
            discount_type text NOT NULL,
            discount_value real NOT NULL,
            days_of_week text,
            start_hour integer,
            end_hour integer,
            start_date integer,
            end_date integer,
            is_active integer NOT NULL DEFAULT 1,
            name text,
            created_by_user_id text,
            created_at integer NOT NULL DEFAULT (strftime('%s', 'now'))
          )`);
          console.log("[Initialize] Created table: specials");
          // Create indexes
          await db.run(
            sql`CREATE INDEX idx_specials_drink_id ON specials(drink_id)`,
          );
          await db.run(
            sql`CREATE INDEX idx_specials_is_active ON specials(is_active)`,
          );
        } else {
          // Check if category column exists in specials table
          const specialsInfo = await db.all(sql`PRAGMA table_info(specials)`);
          const specialsColNames = specialsInfo.map((c: any) => c.name);
          if (!specialsColNames.includes("category")) {
            await db.run(sql`ALTER TABLE specials ADD COLUMN category text`);
            console.log("[Initialize] Added column: specials.category");
          }
        }

        console.log("[Initialize] ✓ Migration columns verified.");
      } catch (colError: any) {
        console.log("[Initialize] Column check warning:", colError.message);
      }
    }

    // Verification Step: Ensure critical tables are present
    console.log("[Initialize] Verifying database tables...");
    let tablesVerified = false;
    try {
      const tables = await db
        .select({ name: sql<string>`name` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table' AND name = 'inventory_items'`);

      if (tables.length === 0) {
        if (migrationFailed) {
          console.error(
            "[Initialize] ✗ Migrations failed AND tables don't exist. Cannot continue.",
          );
          throw new Error(
            "Database initialization failed: migrations failed and no tables exist.",
          );
        }
        // If we got duplicate column error but tables don't exist, the DB is corrupted
        if (duplicateColumnError) {
          console.error(
            "[Initialize] ✗ Database appears corrupted - got duplicate column error but tables don't exist",
          );
          console.error(
            "[Initialize] ⚠ Suggestion: Delete the database file and restart the application",
          );
          throw new Error(
            "Database is corrupted. Please delete the database file at: " +
              dbPath,
          );
        }
        throw new Error(
          "Critical table 'inventory_items' is missing after migration.",
        );
      }
      tablesVerified = true;
      console.log("[Initialize] ✓ Database schema verified successfully.");
    } catch (error: any) {
      // If we got duplicate column error, be lenient about verification
      if (duplicateColumnError) {
        console.log(
          "[Initialize] ⚠ Table verification failed but duplicate column error was detected - continuing anyway",
        );
        tablesVerified = true; // Be lenient
      } else {
        console.error(
          "[Initialize] ✗ Table verification failed:",
          error.message,
        );
        throw new Error(`Database initialization failed: ${error.message}`);
      }
    }

    console.log("[Initialize] Starting admin user initialization...");
    try {
      await upsertAdmin();
      console.log(
        "[Initialize] ✓ Database initialization completed successfully",
      );
    } catch (error: any) {
      console.error(
        "[Initialize] ✗ CRITICAL: Admin initialization failed:",
        error.message,
      );
      throw error;
    }
  } catch (error: any) {
    console.error(
      "[Initialize] ✗ Database initialization failed:",
      error.message,
    );
    console.error("[Initialize] Full error:", error);
    throw error;
  }
}

export * from "./schema";
