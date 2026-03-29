import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const client = createClient({ url: process.env.DATABASE_URL });
export const db = drizzle(client, { schema });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  console.log("Checking database schema...");
  // Migrations are located relative to this file in the built artifact
  // In dev: lib/db/migrations
  // In prod: /app/lib/db/migrations (or wherever they are copied)
  const migrationsPath = path.resolve(__dirname, "../migrations");
  
  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Database schema is up to date.");
  } catch (error) {
    console.error("Migration failed:", error);
    // Continue anyway, maybe it's just dev? Or fail hard?
    // For now, let's just log.
  }
}

export * from "./schema";
