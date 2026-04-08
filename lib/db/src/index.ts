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
