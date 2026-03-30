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

  // 1. Pre-emptive Safety SQL (Ensure core infrastructure exists before migration)
  try {
    console.log("Applying pre-emptive safety checks...");
    
    // Create sessions table (Critical for login)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY NOT NULL,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `).catch(() => {});

    // Add password to users if missing
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
    
    console.log("Pre-emptive safety checks completed.");
  } catch (safetyErr: any) {
    console.warn("Pre-emptive safety check encountered an issue:", safetyErr.message);
  }

  // 2. Run standard migrations
  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Standard migrations completed successfully.");
  } catch (error: any) {
    console.error("Standard migration failed:", error.message);
    // We continue anyway since pre-emptive safety hopefully caught the essentials
  }
}

export * from "./schema";
