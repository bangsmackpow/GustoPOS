import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Ensure the database directory exists (for file: URLs)
if (databaseUrl.startsWith("file:")) {
  const dbPath = databaseUrl.replace(/^file:\/{1,3}/, "");
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  // Don't create an empty file - let SQLite create it
  // An empty file is not a valid SQLite database
  if (!fs.existsSync(dbPath)) {
    console.log(`Database file will be created by SQLite: ${dbPath}`);
  }
}

export const client = createClient({ url: databaseUrl });
export const db = drizzle(client, { schema });

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
    console.error("[Initialize] Error stack:", err.stack);
    throw new Error(`Admin user initialization failed: ${err.message}`);
  }
}

async function migrateAllPinsToBcrypt() {
  try {
    const users = await db.select().from(schema.usersTable);
    for (const user of users) {
      if (user.pin && !user.pin.startsWith("$2")) {
        const hashedPin = await bcrypt.hash(user.pin, 10);
        await db
          .update(schema.usersTable)
          .set({ pin: hashedPin, updatedAt: new Date() })
          .where(eq(schema.usersTable.id, user.id));
        console.log(`[PIN MIGRATION] Upgraded PIN for user: ${user.email}`);
      }
    }
    console.log(`[PIN MIGRATION] All plaintext PINs migrated to bcrypt.`);
  } catch (err) {
    console.error(`[PIN MIGRATION] Error migrating PINs:`, err);
  }
}

export async function initializeDatabase() {
  console.log("Checking database schema...");
  console.log(`Database URL: ${databaseUrl}`);
  console.log(`Using migrations from: ${migrationsPath}`);

  // Verify migrations folder exists
  if (!fs.existsSync(migrationsPath)) {
    console.error(`Migrations folder not found: ${migrationsPath}`);
    throw new Error(`Migrations folder not found: ${migrationsPath}`);
  }

  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Migration tracker updated.");
  } catch (error: any) {
    console.error("Migration tracking error:", error.message);
    // Don't throw - migrations might still have been applied
  }

  // Verify the inventory_items table exists after migration
  // If not, apply migrations manually as libSQL might not execute them
  try {
    const tables = await db
      .select({ name: sql<string>`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name = 'inventory_items'`);

    if (tables.length === 0) {
      console.warn(
        "inventory_items table not found. Applying migrations manually...",
      );

      // Read and execute the migration file directly
      const migrationFile = path.join(
        migrationsPath,
        "0000_create_initial_schema.sql",
      );
      if (fs.existsSync(migrationFile)) {
        const migrationSQL = fs.readFileSync(migrationFile, "utf-8");
        // Execute each SQL statement
        const statements = migrationSQL
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        console.log(
          `Executing ${statements.length} SQL statements from migration...`,
        );
        for (const statement of statements) {
          try {
            await db.run(sql.raw(statement));
          } catch (err: any) {
            // Some statements might fail if tables already exist, that's OK
            console.log(`  SQL statement result: ${err.message}`);
          }
        }
        console.log("Manual migration execution completed.");
      } else {
        throw new Error(`Migration file not found: ${migrationFile}`);
      }
    }

    // Verify again
    const tablesAfter = await db
      .select({ name: sql<string>`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name = 'inventory_items'`);

    if (tablesAfter.length === 0) {
      throw new Error(
        "inventory_items table failed to create even after manual execution",
      );
    }
    console.log("✓ Database schema verified successfully.");
  } catch (error: any) {
    console.error("[Initialize] ✗ Table verification failed:", error.message);
    throw new Error(`Database initialization failed: ${error.message}`);
  }

  try {
    console.log("[Initialize] Starting admin user initialization...");
    await upsertAdmin();
    console.log(
      "[Initialize] ✓ Database initialization completed successfully",
    );
  } catch (error: any) {
    console.error(
      "[Initialize] ✗ CRITICAL: Admin initialization failed:",
      error.message,
    );
    console.error("[Initialize] Stack:", error.stack);
    throw error;
  }
}

export * from "./schema";
