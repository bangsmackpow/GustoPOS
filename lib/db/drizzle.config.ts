import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL || "file:./local.db";

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
});
