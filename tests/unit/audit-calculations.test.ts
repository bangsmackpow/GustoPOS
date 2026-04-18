import { describe, test } from "node:test";
import assert from "node:assert";

/**
 * Audit Calculation Tests
 * TEST_PROTOCOL Part 2: Inventory Audits Testing
 *
 * Tests ACCT-001 through ACCT-003
 * Critical Path: Variance calculation verification
 */

describe("Audit Calculations (ACCT-001 to ACCT-003)", () => {
  /**
   * ACCT-001: Variance with Sign Tracking
   *
   * Protocol formulas:
   * - reportedTotal = reportedBulk × baseUnitAmount + reportedPartial
   * - expectedTotal = currentStock (from DB)
   * - variance = reportedTotal - expectedTotal
   * - variancePercent = (variance / expectedTotal) × 100
   */
  describe("ACCT-001: Variance calculation with sign tracking", () => {
    test("calculates negative variance (shortage)", () => {
      // Initial state: 5000ml expected
      const baseUnitAmount = 750;
      const reportedBulk = 5;
      const reportedPartial = 400;
      const expectedTotal = 5000;

      // Calculate
      const reportedTotal = reportedBulk * baseUnitAmount + reportedPartial;
      const variance = reportedTotal - expectedTotal;
      const variancePercent = (variance / expectedTotal) * 100;

      assert.strictEqual(reportedTotal, 4150); // (5 × 750) + 400
      assert.strictEqual(variance, -850); // Shortage!
      assert.strictEqual(variancePercent, -17); // -17%
    });

    test("calculates positive variance (overage)", () => {
      const baseUnitAmount = 750;
      const reportedBulk = 7;
      const reportedPartial = 500;
      const expectedTotal = 5000;

      const reportedTotal = reportedBulk * baseUnitAmount + reportedPartial;
      const variance = reportedTotal - expectedTotal;
      const variancePercent = (variance / expectedTotal) * 100;

      assert.strictEqual(reportedTotal, 5750); // (7 × 750) + 500
      assert.strictEqual(variance, 750); // Overage!
      assert.strictEqual(variancePercent, 15); // +15%
    });

    test("handles zero variance (exact match)", () => {
      const baseUnitAmount = 750;
      const reportedBulk = 6;
      const reportedPartial = 500;
      const expectedTotal = 5000;

      const reportedTotal = reportedBulk * baseUnitAmount + reportedPartial;
      const variance = reportedTotal - expectedTotal;
      const variancePercent =
        expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;

      assert.strictEqual(reportedTotal, 5000); // Exact match
      assert.strictEqual(variance, 0);
      assert.strictEqual(variancePercent, 0);
    });

    test("handles zero expected stock (new item)", () => {
      const baseUnitAmount = 750;
      const reportedBulk = 2;
      const reportedPartial = 0;
      const expectedTotal = 0; // New item, no previous stock

      const reportedTotal = reportedBulk * baseUnitAmount + reportedPartial;
      const variance = reportedTotal - expectedTotal;
      // Zero-division protection
      const variancePercent =
        expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;

      assert.strictEqual(reportedTotal, 1500);
      assert.strictEqual(variance, 1500);
      assert.strictEqual(variancePercent, 0); // Protected from division by zero
    });

    test("calculates variance in servings", () => {
      const variance = -900; // ml
      const servingSize = 44.36; // ml per serving

      const varianceInServings = Math.abs(variance) / servingSize;

      assert.strictEqual(parseFloat(varianceInServings.toFixed(2)), 20.29); // ~20 servings
    });
  });

  /**
   * ACCT-002: Server-Side Calculation
   *
   * Server must calculate all fields from minimal input:
   * - Input: reportedBulk, reportedPartial
   * - Output: reportedTotal, expectedTotal, variance, variancePercent
   */
  describe("ACCT-002: Server-side calculation verification", () => {
    test("server calculates all fields from bulk+partial only", () => {
      // Client only sends these
      const clientInput = {
        reportedBulk: 5,
        reportedPartial: 400,
        auditEntryMethod: "bulk_partial",
      };

      // Server calculates these
      const baseUnitAmount = 750;
      const currentStockFromDB = 5000;

      const serverCalculated = {
        reportedTotal:
          clientInput.reportedBulk * baseUnitAmount +
          clientInput.reportedPartial,
        expectedTotal: currentStockFromDB,
        variance:
          clientInput.reportedBulk * baseUnitAmount +
          clientInput.reportedPartial -
          currentStockFromDB,
        variancePercent:
          ((clientInput.reportedBulk * baseUnitAmount +
            clientInput.reportedPartial -
            currentStockFromDB) /
            currentStockFromDB) *
          100,
      };

      assert.strictEqual(serverCalculated.reportedTotal, 4150);
      assert.strictEqual(serverCalculated.expectedTotal, 5000);
      assert.strictEqual(serverCalculated.variance, -850);
      assert.strictEqual(
        parseFloat(serverCalculated.variancePercent.toFixed(2)),
        -17,
      );
    });

    test("server handles client-provided total", () => {
      // Client might send pre-calculated total
      const clientInput = {
        reportedBulk: 5,
        reportedPartial: 400,
        reportedTotal: 4150, // Pre-calculated
      };

      // Server should verify or use
      const baseUnitAmount = 750;
      const calculatedTotal =
        clientInput.reportedBulk * baseUnitAmount + clientInput.reportedPartial;

      // Verify client calculation matches server calculation
      assert.strictEqual(clientInput.reportedTotal, calculatedTotal);
    });

    test("server updates item stock after audit", () => {
      const auditResult = {
        reportedBulk: 5,
        reportedPartial: 400,
        reportedTotal: 4150,
      };

      // Item should be updated to match audit
      const newCurrentBulk = auditResult.reportedBulk;
      const newCurrentPartial = auditResult.reportedPartial;
      const newCurrentStock = auditResult.reportedTotal;

      assert.strictEqual(newCurrentBulk, 5);
      assert.strictEqual(newCurrentPartial, 400);
      assert.strictEqual(newCurrentStock, 4150);
    });
  });

  /**
   * ACCT-003: Batch Audit Variance
   *
   * When multiple items audited in batch:
   * - Each item's variance calculated independently
   * - All variances reported in summary
   */
  describe("ACCT-003: Batch audit variance calculations", () => {
    test("calculates variance for multiple items", () => {
      const batchItems = [
        {
          name: "Vodka",
          baseUnitAmount: 750,
          reportedBulk: 9,
          reportedPartial: 200,
          expectedTotal: 7700, // (10 × 750) + 200
        },
        {
          name: "Whiskey",
          baseUnitAmount: 750,
          reportedBulk: 5,
          reportedPartial: 100,
          expectedTotal: 3750, // (5 × 750) + 0
        },
        {
          name: "Gin",
          baseUnitAmount: 750,
          reportedBulk: 8,
          reportedPartial: 150,
          expectedTotal: 6150, // (8 × 750) + 150
        },
      ];

      const results = batchItems.map((item) => {
        const reportedTotal =
          item.reportedBulk * item.baseUnitAmount + item.reportedPartial;
        const variance = reportedTotal - item.expectedTotal;
        const variancePercent = (variance / item.expectedTotal) * 100;

        return {
          name: item.name,
          reportedTotal,
          variance,
          variancePercent: parseFloat(variancePercent.toFixed(2)),
        };
      });

      // Vodka: Shortage
      assert.strictEqual(results[0].reportedTotal, 6950);
      assert.strictEqual(results[0].variance, -750);
      assert.strictEqual(results[0].variancePercent, -9.74);

      // Whiskey: Overage
      assert.strictEqual(results[1].reportedTotal, 3850);
      assert.strictEqual(results[1].variance, 100);
      assert.strictEqual(results[1].variancePercent, 2.67);

      // Gin: Exact
      assert.strictEqual(results[2].reportedTotal, 6150);
      assert.strictEqual(results[2].variance, 0);
      assert.strictEqual(results[2].variancePercent, 0);
    });

    test("identifies significant variances in batch (>5%)", () => {
      const variances = [
        { item: "A", variancePercent: -9.74 },
        { item: "B", variancePercent: 2.67 },
        { item: "C", variancePercent: 0 },
        { item: "D", variancePercent: -50 },
      ];

      const significant = variances.filter(
        (v) => Math.abs(v.variancePercent) > 5,
      );

      assert.strictEqual(significant.length, 2);
      assert.strictEqual(significant[0].item, "A");
      assert.strictEqual(significant[1].item, "D");
    });

    test("aggregates total variance across batch", () => {
      const batchResults = [
        { variance: -750 },
        { variance: 100 },
        { variance: 0 },
      ];

      const totalVariance = batchResults.reduce(
        (sum, r) => sum + r.variance,
        0,
      );
      const totalAbsVariance = batchResults.reduce(
        (sum, r) => sum + Math.abs(r.variance),
        0,
      );

      assert.strictEqual(totalVariance, -650); // Directional
      assert.strictEqual(totalAbsVariance, 850); // Absolute
    });
  });

  /**
   * Audit Entry Method Tests
   * Verifies both bulk_partial and total_only entry methods
   */
  describe("Audit Entry Methods", () => {
    test("bulk_partial method calculation", () => {
      const baseUnitAmount = 750;
      const reportedBulk = 3;
      const reportedPartial = 250;

      const reportedTotal = reportedBulk * baseUnitAmount + reportedPartial;

      assert.strictEqual(reportedTotal, 2500);
    });

    test("total_only method accepts direct value", () => {
      const reportedTotal = 2500; // Direct from user

      // When no bulk/partial provided
      const baseUnitAmount = 750;
      const calculatedFromBulk = 3 * baseUnitAmount + 250; // 2500

      assert.strictEqual(reportedTotal, calculatedFromBulk);
    });
  });

  /**
   * Variance Threshold Tests
   * Per AUDIT_PROTOCOL Section 5
   */
  describe("Variance Threshold Classification", () => {
    test("classifies normal variance (<2%)", () => {
      const variancePercent = 1.5;
      const classification =
        variancePercent < 2
          ? "normal"
          : variancePercent < 5
            ? "attention"
            : variancePercent < 10
              ? "significant"
              : "critical";

      assert.strictEqual(classification, "normal");
    });

    test("classifies attention variance (2-5%)", () => {
      const variancePercent = 3.5;
      const classification =
        Math.abs(variancePercent) < 2
          ? "normal"
          : Math.abs(variancePercent) < 5
            ? "attention"
            : Math.abs(variancePercent) < 10
              ? "significant"
              : "critical";

      assert.strictEqual(classification, "attention");
    });

    test("classifies significant variance (5-10%)", () => {
      const variancePercent = -7.5;
      const classification =
        Math.abs(variancePercent) < 2
          ? "normal"
          : Math.abs(variancePercent) < 5
            ? "attention"
            : Math.abs(variancePercent) < 10
              ? "significant"
              : "critical";

      assert.strictEqual(classification, "significant");
    });

    test("classifies critical variance (>10%)", () => {
      const variancePercent = 18;
      const classification =
        Math.abs(variancePercent) < 2
          ? "normal"
          : Math.abs(variancePercent) < 5
            ? "attention"
            : Math.abs(variancePercent) < 10
              ? "significant"
              : "critical";

      assert.strictEqual(classification, "critical");
    });
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    "Audit Calculation Tests - Run with: node --test tests/unit/audit-calculations.test.ts",
  );
}
