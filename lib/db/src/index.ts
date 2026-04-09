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
  const dbPath = databaseUrl.replace(/^file:/, "");
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
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPin = process.env.ADMIN_PIN || "0000";

  if (!adminEmail || !adminPassword) {
    console.warn(
      "[Initialize] ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin upsert.",
    );
    return;
  }

  try {
    console.log(`[Initialize] Checking for existing admin user: ${adminEmail}`);
    const [existing] = await db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.email, adminEmail));

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
        `[Initialize] ✓ Admin user updated successfully: ${adminEmail}`,
      );
    } else {
      console.log(`[Initialize] No existing user found, creating new admin...`);
      await db.insert(schema.usersTable).values({
        email: adminEmail,
        password: hashedPassword,
        pin: hashedPin,
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        language: "en",
        isActive: true,
      });
      console.log(
        `[Initialize] ✓ Admin user created successfully: ${adminEmail}`,
      );
    }
  } catch (err: any) {
    console.error("[Initialize] ✗ FAILED to upsert admin user:", err.message);
    throw new Error(`Admin user initialization failed: ${err.message}`);
  }
}

export async function initializeDatabase() {
  console.log("Checking database schema...");
  console.log(`Database URL: ${databaseUrl}`);

  // Configure SQLite for optimal local performance
  await configureSQLitePerformance();

  // Ensure app data directory exists (for desktop)
  ensureAppDataDirectory();

  // Ensure backup directory exists
  ensureBackupDirectory();

  // Print full path for debugging
  if (databaseUrl?.startsWith("file:")) {
    const dbPath = databaseUrl.replace(/^file:\/\//, "").replace(/%20/g, " ");
    console.log(`Resolved database path: ${dbPath}`);
  }

  console.log(`Using migrations from: ${migrationsPath}`);

  // Ensure the database directory exists (for file: URLs)
  if (databaseUrl?.startsWith("file:")) {
    let dbPath = databaseUrl.replace(/^file:\/\//, "").replace(/%20/g, " ");
    // Handle relative paths
    if (!path.isAbsolute(dbPath)) {
      dbPath = path.resolve(process.cwd(), dbPath);
    }
    const dbDir = path.dirname(dbPath);
    console.log(`Database directory to ensure: ${dbDir}`);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    } else {
      console.log(`Database directory already exists: ${dbDir}`);
    }
    console.log(`Database full path: ${dbPath}`);
  }

  // Run integrity check
  const integrityOk = await runIntegrityCheck();
  if (!integrityOk) {
    console.error("⚠️ Database integrity check failed - data may be corrupted");
  }

  // Verify migrations folder exists
  if (!fs.existsSync(migrationsPath)) {
    console.error(`Migrations folder not found: ${migrationsPath}`);
    throw new Error(`Migrations folder not found: ${migrationsPath}`);
  }

  console.log("Running database migrations...");
  let migrationFailed = false;
  try {
    // Rely on Drizzle's official migrator
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("✓ Migration check complete.");
  } catch (error: any) {
    migrationFailed = true;
    console.error("Migration execution error:", error.message);
    // Don't throw - check if tables exist anyway
    console.log("Continuing anyway to check if tables exist...");
  }

  // Verification Step: Ensure critical tables are present
  console.log("Verifying database tables...");
  try {
    const tables = await db
      .select({ name: sql<string>`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name = 'inventory_items'`);

    if (tables.length === 0) {
      // Tables don't exist - this is a fresh database that needs migrations
      if (migrationFailed) {
        console.error(
          "Migrations failed AND tables don't exist. Cannot continue.",
        );
        throw new Error(
          "Database initialization failed: migrations failed and no tables exist.",
        );
      }
      throw new Error(
        "Critical table 'inventory_items' is missing after migration.",
      );
    }
    console.log("✓ Database schema verified successfully.");
  } catch (error: any) {
    console.error("[Initialize] ✗ Table verification failed:", error.message);
    throw new Error(`Database initialization failed: ${error.message}`);
  }

  // Verification Step: Ensure critical tables are present
  console.log("Verifying database tables...");
  try {
    const tables = await db
      .select({ name: sql<string>`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name = 'inventory_items'`);

    if (tables.length === 0) {
      throw new Error(
        "Critical table 'inventory_items' is missing after migration.",
      );
    }
    console.log("✓ Database schema verified successfully.");
  } catch (error: any) {
    console.error("[Initialize] ✗ Table verification failed:", error.message);
    throw new Error(`Database initialization failed: ${error.message}`);
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
}

export * from "./schema";
