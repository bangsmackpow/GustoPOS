import { db } from "../lib/db/src/index";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function runSeed() {
  try {
    const sqlPath = path.resolve(__dirname, "../db/seeds/puerto-vallarta-starter.sql");
    console.log(`Loading seed from: ${sqlPath}`);
    const rawSql = fs.readFileSync(sqlPath, "utf8");

    const statements = rawSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} statements...`);
    for (const statement of statements) {
      await db.run(sql.raw(statement));
    }

    console.log("✓ Seeding completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("✗ Seeding failed:", err);
    process.exit(1);
  }
}

runSeed();
