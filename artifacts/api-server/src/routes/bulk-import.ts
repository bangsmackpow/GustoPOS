import { Router, type IRouter, type Request, type Response } from "express";
import { db, ingredientsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/bulk-ingredients", async (req: Request, res: Response) => {
  const { ingredients } = req.body;

  if (!Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Invalid input: ingredients must be an array" });
  }

  try {
    const results = [];
    
    // We process sequentially or in a transaction to handle existing items
    await db.transaction(async (tx) => {
      for (const item of ingredients) {
        const result = await tx.insert(ingredientsTable)
          .values({
            name: item.name,
            category: item.category || 'other',
            unit: item.unit || 'ml',
            unitSize: item.unitSize || 750,
            costPerUnit: item.costPerUnit || 0,
            currentStock: item.currentStock || 0,
            minimumStock: item.minimumStock || 0,
          } as typeof ingredientsTable.$inferInsert)
          .onConflictDoUpdate({
            target: ingredientsTable.name,
            set: {
              costPerUnit: item.costPerUnit,
              currentStock: item.currentStock,
              minimumStock: item.minimumStock,
              unit: item.unit,
              unitSize: item.unitSize,
              category: item.category,
              updatedAt: new Date(),
            }
          })
          .returning();
        results.push(result[0]);
      }
    });

    res.json({ success: true, count: results.length });
  } catch (err: any) {
    console.error("Bulk import error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
