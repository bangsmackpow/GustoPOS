import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { taxRatesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import * as zod from "zod";
import { customHeaders } from "../lib/headers";
import {
  GetTaxRatesResponse,
  GetTaxConfigResponse,
  UpdateTaxRateBody,
  UpdateTaxRateResponse,
} from "@workspace/api-zod";

const router = Router();

/**
 * GET /api/tax-rates
 * Get all tax rates and configuration
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const rates = await db.query.taxRatesTable.findMany({
      orderBy: (table) => table.rate,
    });

    const response: zod.infer<typeof GetTaxRatesResponse> = {
      rates: rates.map((r) => ({
        id: r.id,
        category: r.category,
        rate: r.rate,
        description: r.description ?? undefined,
        isActive: r.isActive,
      })),
    };

    return res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[tax-rates] GET/:category error:", error);
    return res.status(500).json({ error: "Failed to fetch tax rate" });
  }
});

/**
 * GET /api/tax-rates/config
 * Get tax configuration summary (default rate + rate map)
 */
router.get("/config", async (req: Request, res: Response) => {
  try {
    const rates = await db.query.taxRatesTable.findMany({
      where: (table) => eq(table.isActive, true),
    });

    const defaultRate =
      rates.find((r) => r.category === "standard")?.rate ?? 0.16;

    const rateMap: Record<string, number> = {};
    rates.forEach((r) => {
      rateMap[r.category] = r.rate;
    });

    const response: zod.infer<typeof GetTaxConfigResponse> = {
      defaultRate,
      rates: rateMap,
      lastUpdated: new Date().toISOString(),
    };

    res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[tax-rates] GET /config error:", error);
    res.status(500).json({ error: "Failed to fetch tax configuration" });
  }
});

/**
 * POST /api/tax-rates/:category
 * Update or create a tax rate for a category
 */
router.post("/:category", async (req: Request, res: Response) => {
  try {
    const category = req.params.category as string;
    const body = UpdateTaxRateBody.parse(req.body);

    const existing = await db.query.taxRatesTable.findFirst({
      where: (table) => eq(table.category, category),
    });

    let rate;
    if (existing) {
      await db
        .update(taxRatesTable)
        .set({
          rate: body.rate,
          description: body.description,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(taxRatesTable.category, category));

      rate = await db.query.taxRatesTable.findFirst({
        where: (table) => eq(table.category, category),
      });
    } else {
      const newId = `tax_${category}_${Date.now()}`;
      await db.insert(taxRatesTable).values({
        id: newId,
        category,
        rate: body.rate,
        description: body.description,
        isActive: true,
      });

      rate = await db.query.taxRatesTable.findFirst({
        where: (table) => eq(table.id, newId),
      });
    }

    const response: zod.infer<typeof UpdateTaxRateResponse> = {
      success: true,
      rate: {
        id: rate!.id,
        category: rate!.category,
        rate: rate!.rate,
        description: rate!.description ?? undefined,
        isActive: rate!.isActive,
      },
    };

    return res.set(customHeaders).json(response);
  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", issues: error.issues });
    }
    console.error("[tax-rates] POST error:", error);
    return res.status(500).json({ error: "Failed to update tax rate" });
  }
});

/**
 * GET /api/tax-rates/:category
 * Get a specific tax rate by category
 */
router.get("/:category", async (req: Request, res: Response) => {
  try {
    const category = req.params.category as string;

    const rate = await db.query.taxRatesTable.findFirst({
      where: (table) => eq(table.category, category),
    });

    if (!rate) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    const response = {
      id: rate.id,
      category: rate.category,
      rate: rate.rate,
      description: rate.description,
      isActive: rate.isActive,
    };

    return res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[tax-rates] GET/:category error:", error);
    return res.status(500).json({ error: "Failed to fetch tax rate" });
  }
});

export default router;
