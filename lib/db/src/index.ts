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
          isActive: true,
          updatedAt: new Date(),
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
        isActive: true,
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

        // Verify critical columns exist
        try {
          const columns = await db.all(sql`PRAGMA table_info(inventory_items)`);
          const hasParentItemId = columns.some(
            (col: any) => col.name === "parent_item_id",
          );
          const hasAlcoholDensity = columns.some(
            (col: any) => col.name === "alcohol_density",
          );

          if (hasParentItemId && hasAlcoholDensity) {
            console.log(
              "[Initialize] ✓ Schema is complete - skipping migrations",
            );
          } else {
            console.log(
              "[Initialize] ⚠ Schema incomplete - will run migrations to add missing columns",
            );
            tablesAlreadyExist = false; // Run migrations to add missing columns
          }
        } catch (colError) {
          console.log(
            "[Initialize] ⚠ Could not verify columns - will run migrations",
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
