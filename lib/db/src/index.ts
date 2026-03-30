import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import path from "path";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const client = createClient({ url: databaseUrl });
export const db = drizzle(client, { schema });

// Path to migrations (resolve relative to the workspace root in production)
const migrationsPath = process.env.NODE_ENV === "production" 
  ? "/app/lib/db/migrations"
  : path.resolve(import.meta.dirname, "../migrations");

async function upsertAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPin = process.env.ADMIN_PIN || "0000";

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin upsert.");
    return;
  }

  try {
    const [existing] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, adminEmail));
    
    if (existing) {
      // Update password/pin if environment variables changed
      await db.update(schema.usersTable)
        .set({ 
          password: adminPassword, 
          pin: adminPin,
          role: "admin",
          isActive: true,
          updatedAt: new Date() 
        })
        .where(eq(schema.usersTable.id, existing.id));
      console.log(`[Initialize] Admin user updated: ${adminEmail}`);
    } else {
      // Create fresh admin
      await db.insert(schema.usersTable).values({
        email: adminEmail,
        password: adminPassword,
        pin: adminPin,
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        language: "en",
        isActive: true,
      });
      console.log(`[Initialize] Admin user created: ${adminEmail}`);
    }
  } catch (err: any) {
    console.error("[Initialize] Failed to upsert admin user:", err.message);
  }
}

export async function initializeDatabase() {
  console.log("Checking database schema...");
  console.log(`Using migrations from: ${migrationsPath}`);

  // 1. Run standard migrations
  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Standard migrations completed successfully.");
  } catch (error: any) {
    console.error("Standard migration failed:", error.message);
    // Continue anyway, try to keep the system up
  }

  // 2. Ensure core infrastructure exists even if migration hit issues
  try {
    // Add password to users if missing (handles transition period)
    await client.execute("ALTER TABLE users ADD COLUMN password TEXT").catch(() => {});
    
    // Add backup toggles to settings if missing
    await client.execute("ALTER TABLE settings ADD COLUMN enable_litestream INTEGER DEFAULT 0 NOT NULL").catch(() => {});
    await client.execute("ALTER TABLE settings ADD COLUMN enable_usb_backup INTEGER DEFAULT 0 NOT NULL").catch(() => {});
    
    // Create rushes table if missing
    await client.execute(`
      CREATE TABLE IF NOT EXISTS rushes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        impact TEXT DEFAULT 'medium' NOT NULL,
        type TEXT DEFAULT 'event' NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `).catch(() => {});
  } catch (safetyErr: any) {
    console.warn("Safety check encountered an issue:", safetyErr.message);
  }

  // 3. Ensure Environment Admin is in the database
  await upsertAdmin();
}

export * from "./schema";
