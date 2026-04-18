import express from "express";
import type { Request, Response } from "express";
import { sensitiveLimiter } from "../lib/rateLimiter";
import { db } from "@workspace/db";
import fs from "fs";
import path from "path";

// Development starter data seed endpoint
export default function adminSeedRouter(): express.Router {
  const router = express.Router();

  router.post(
    "/seed-admin",
    sensitiveLimiter,
    async (req: Request, res: Response) => {
      const enabled =
        (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
      if (!enabled)
        return res.status(403).json({ ok: false, error: "seed disabled" });

      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail)
        return res
          .status(500)
          .json({ ok: false, error: "ADMIN_EMAIL not configured" });

      try {
        const { usersTable } = await import("@workspace/db");
        const { eq } = await import("drizzle-orm");
        const adminPin = process.env.ADMIN_PIN || "0000";
        const existing = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, adminEmail));

        if (existing.length === 0) {
          await db.insert(usersTable).values({
            username: adminEmail.split("@")[0],
            email: adminEmail,
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            language: "en",
            pin: adminPin,
            isActive: 1,
          });
          return res.json({
            ok: true,
            message: `Admin user created: ${adminEmail}`,
          });
        } else {
          await db
            .update(usersTable)
            .set({ pin: adminPin, role: "admin", isActive: 1 })
            .where(eq(usersTable.email, adminEmail));
          return res.json({
            ok: true,
            message: `Admin user updated: ${adminEmail}`,
          });
        }
      } catch (e: any) {
        return res
          .status(500)
          .json({ ok: false, error: String(e?.message ?? e) });
      }
    },
  );

  router.post("/seed-starter", async (req: Request, res: Response) => {
    try {
      const sqlPath = process.env.SEEDS_PATH
        ? path.join(process.env.SEEDS_PATH, "puerto-vallarta-starter.sql")
        : process.env.NODE_ENV === "production"
          ? "/app/db/seeds/puerto-vallarta-starter.sql"
          : path.resolve(
              __dirname,
              "../../../../db/seeds/puerto-vallarta-starter.sql",
            );

      console.log(`Loading seed from: ${sqlPath}`);

      if (!fs.existsSync(sqlPath)) {
        return res.status(500).json({
          ok: false,
          error: `Seed file not found: ${sqlPath}`,
        });
      }

      const rawSql = fs.readFileSync(sqlPath, "utf8");

      // Split by semicolon and filter out empty strings to run each statement individually
      const statements = rawSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      console.log(`Executing ${statements.length} SQL statements...`);

      // Get raw client from db to execute SQL directly
      const { client } = await import("@workspace/db");

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await client.execute({ sql: statement, args: [] });
        } catch (stmtError: any) {
          console.error(`Statement ${i + 1} failed:`, stmtError.message);
          // Continue with other statements - some may fail due to duplicates
        }
      }

      console.log("Seed completed successfully");
      return res.json({
        ok: true,
        message: "Starter data seeded successfully",
      });
    } catch (e: any) {
      console.error("Seed error:", e);
      return res
        .status(500)
        .json({ ok: false, error: String(e?.message ?? e) });
    }
  });

  router.post("/seed-cocktails", async (req: Request, res: Response) => {
    try {
      const { drinksTable, recipeIngredientsTable, inventoryItemsTable } =
        await import("@workspace/db");
      const { eq } = await import("drizzle-orm");

      // Get all available ingredients (to build recipes from)
      const ingredients = await db
        .select()
        .from(inventoryItemsTable)
        .limit(100);

      if (ingredients.length === 0) {
        return res.status(400).json({
          ok: false,
          error:
            "No ingredients found. Please add ingredients before seeding cocktails.",
        });
      }

      // Classic cocktail recipes with flexible ingredient mapping
      const cocktails = [
        {
          name: "Margarita",
          category: "cocktail" as const,
          description: "Classic tequila-based cocktail with lime and salt rim",
          markupFactor: 3.0,
          recipe: ["tequila", "lime_juice", "triple_sec"],
          amounts: [1.5, 0.5, 0.5],
        },
        {
          name: "Daiquiri",
          category: "cocktail" as const,
          description: "Refreshing rum and lime cocktail",
          markupFactor: 3.0,
          recipe: ["rum_light", "lime_juice", "simple_syrup"],
          amounts: [2, 1, 0.5],
        },
        {
          name: "Mojito",
          category: "cocktail" as const,
          description: "Fresh mint and rum with soda",
          markupFactor: 3.0,
          recipe: ["rum_light", "lime_juice", "simple_syrup", "soda_water"],
          amounts: [2, 0.75, 0.5, 2],
        },
        {
          name: "Old Fashioned",
          category: "cocktail" as const,
          description: "Classic whiskey cocktail",
          markupFactor: 3.5,
          recipe: ["whiskey", "simple_syrup"],
          amounts: [2, 0.25],
        },
        {
          name: "Cosmopolitan",
          category: "cocktail" as const,
          description: "Vodka, cranberry, and lime",
          markupFactor: 3.0,
          recipe: ["vodka", "cranberry_juice", "lime_juice", "triple_sec"],
          amounts: [1.5, 2, 0.5, 0.5],
        },
        {
          name: "Piña Colada",
          category: "cocktail" as const,
          description: "Rum, coconut cream, and pineapple",
          markupFactor: 3.0,
          recipe: ["rum_light", "coconut_cream", "pineapple_juice"],
          amounts: [2, 1.5, 3],
        },
        {
          name: "Margarita on the Rocks",
          category: "cocktail" as const,
          description: "Tequila margarita served on the rocks",
          markupFactor: 3.0,
          recipe: ["tequila", "lime_juice", "triple_sec"],
          amounts: [2, 0.75, 0.5],
        },
        {
          name: "Paloma",
          category: "cocktail" as const,
          description: "Tequila and grapefruit cocktail",
          markupFactor: 3.0,
          recipe: ["tequila", "grapefruit_juice", "lime_juice"],
          amounts: [2, 4, 0.5],
        },
      ];

      // Helper function to find ingredient by name (fuzzy match)
      const findIngredient = (
        names: string[],
        availableIngredients: typeof ingredients,
      ) => {
        for (const name of names) {
          const found = availableIngredients.find((ing) =>
            ing.name.toLowerCase().includes(name.toLowerCase()),
          );
          if (found) return found;
        }
        // Fallback to any ingredient of appropriate type
        return availableIngredients.find((ing) => ing.type === "mixer") ||
          availableIngredients[0]
          ? availableIngredients[0]
          : null;
      };

      let createdCount = 0;

      for (const cocktail of cocktails) {
        try {
          // Check if drink already exists
          const existing = await db
            .select()
            .from(drinksTable)
            .where(eq(drinksTable.name, cocktail.name));

          if (existing.length > 0) {
            continue; // Skip if already exists
          }

          // Create drink
          const [newDrink] = await db
            .insert(drinksTable)
            .values({
              name: cocktail.name,
              description: cocktail.description,
              category: cocktail.category,
              markupFactor: cocktail.markupFactor,
              isAvailable: 1,
            })
            .returning();

          // Find and link ingredients for recipe
          const recipeEntries = cocktail.recipe
            .map((ingredientName, idx) => {
              const foundIngredient = findIngredient(
                [ingredientName],
                ingredients,
              );
              if (!foundIngredient) return null;
              return {
                drinkId: newDrink.id,
                ingredientId: foundIngredient.id,
                amountInBaseUnit: cocktail.amounts[idx] || 1,
              };
            })
            .filter((r) => r !== null);

          if (recipeEntries.length > 0) {
            await db
              .insert(recipeIngredientsTable)
              .values(recipeEntries as any);
          }

          createdCount++;
        } catch (cocktailError: any) {
          console.warn(
            `Failed to create cocktail ${cocktail.name}:`,
            cocktailError.message,
          );
          // Continue with next cocktail
        }
      }

      return res.json({
        ok: true,
        message: `${createdCount} cocktails seeded successfully`,
        count: createdCount,
      });
    } catch (e: any) {
      console.error("Cocktail seed error:", e);
      return res
        .status(500)
        .json({ ok: false, error: String(e?.message ?? e) });
    }
  });

  return router;
}
