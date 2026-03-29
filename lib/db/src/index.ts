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
  
  // In production Docker, we copy to /app/lib/db/migrations
  // In dev, it might be relative.
  const migrationsPath = process.env.NODE_ENV === 'production' 
    ? "/app/lib/db/migrations" 
    : path.resolve(__dirname, "../migrations");
  
  console.log(`Using migrations from: ${migrationsPath}`);
  
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
