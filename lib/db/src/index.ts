import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import fs from "fs";

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

export async function initializeDatabase() {
  console.log("Checking database schema...");
  console.log(`Using migrations from: ${migrationsPath}`);

  try {
    // 1. Run standard migrations
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Standard migrations completed successfully.");
  } catch (error: any) {
    console.warn("Standard migration failed, attempting manual safety updates:", error.message);
    
    // 2. Manual Safety SQL (Double-ensure columns exist even if migrator crashes)
    try {
      // Add password to users
      await client.execute("ALTER TABLE users ADD COLUMN password TEXT").catch(() => {});
      // Add backup toggles to settings
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
      
      console.log("Manual safety updates applied.");
    } catch (manualError: any) {
      console.error("Manual safety updates failed:", manualError.message);
    }
  }
}

export * from "./schema";
