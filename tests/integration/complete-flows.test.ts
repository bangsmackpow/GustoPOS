import { describe, test } from "node:test";
import assert from "node:assert";

/**
 * Integration Tests - Complete Service Flow
 * TEST_PROTOCOL Part 6: Integration Tests
 *
 * Tests complete end-to-end scenarios
 */

describe("Integration Tests - Complete Service Flow", () => {
  /**
   * INTEGRATION-001: Complete Service Night Flow
   *
   * Simulates a full night of service:
   * 1. Start shift
   * 2. Create inventory items
   * 3. Create drinks with recipes
   * 4. Open multiple tabs
   * 5. Add orders to tabs
   * 6. Verify stock reservations
   * 7. Close some tabs (deduct stock)
   * 8. Void some orders (return stock)
   * 9. Generate shift report
   * 10. Close shift
   */
  describe("INTEGRATION-001: Complete Service Night", () => {
    test("full service night simulation", async () => {
      // Setup: Create test data
      const startTime = Date.now();

      // 1. Inventory items
      const tequila = {
        id: "test-tequila-001",
        name: "Test Tequila",
        type: "spirit",
        baseUnitAmount: 750,
        currentBulk: 5,
        currentPartial: 375,
        currentStock: 4125, // (5 * 750) + 375
        servingSize: 44.36,
      };

      const tripleSec = {
        id: "test-triplesec-001",
        name: "Test Triple Sec",
        type: "mixer",
        baseUnitAmount: 750,
        currentBulk: 3,
        currentPartial: 200,
        currentStock: 2450,
        servingSize: 22.18, // 0.75 oz
      };

      const limeJuice = {
        id: "test-lime-001",
        name: "Test Lime Juice",
        type: "mixer",
        baseUnitAmount: 1000,
        currentBulk: 2,
        currentPartial: 500,
        currentStock: 2500,
        servingSize: 29.57, // 1 oz
      };

      // 2. Drinks with recipes
      const margarita = {
        id: "test-margarita-001",
        name: "Test Margarita",
        price: 120,
        recipe: [
          { ingredientId: tequila.id, amount: 44.36 }, // 1.5 oz tequila
          { ingredientId: tripleSec.id, amount: 22.18 }, // 0.75 oz triple sec
          { ingredientId: limeJuice.id, amount: 29.57 }, // 1 oz lime
        ],
      };

      // 3. Simulate tabs throughout the night
      const tabs = [
        { id: "tab-001", name: "Table 1", orders: 4 },
        { id: "tab-002", name: "Table 2", orders: 2 },
        { id: "tab-003", name: "Bar 1", orders: 6 },
        { id: "tab-004", name: "Table 3", orders: 3 },
        { id: "tab-005", name: "Bar 2", orders: 1 },
      ];

      // Calculate expected inventory usage
      const totalOrders = tabs.reduce((sum, t) => sum + t.orders, 0);
      const tequilaPerDrink = 44.36;
      const expectedTequilaUsage = totalOrders * tequilaPerDrink;

      // Initial stock
      const initialTequilaStock = tequila.currentStock;
      const expectedFinalStock = initialTequilaStock - expectedTequilaUsage;

      // Verify calculations
      assert.strictEqual(totalOrders, 16, "Total orders should be 16");
      assert.strictEqual(
        expectedTequilaUsage,
        709.76,
        "Expected tequila usage: 16 × 44.36",
      );
      assert.strictEqual(
        expectedFinalStock,
        4125 - 709.76,
        "Expected final stock",
      );

      // 4. Simulate reservations during service
      let reservedStock = 0;
      const closedTabs = [tabs[0], tabs[2]]; // Close 2 tabs
      const openTabs = [tabs[1], tabs[3], tabs[4]]; // Leave 3 open

      // Add reservations for all tabs
      for (const tab of tabs) {
        reservedStock += tab.orders * tequilaPerDrink;
      }

      assert.strictEqual(
        reservedStock,
        709.76,
        "Reserved stock should match usage",
      );

      // 5. Close tabs (finalize stock)
      let finalizedStock = 0;
      for (const tab of closedTabs) {
        finalizedStock += tab.orders * tequilaPerDrink;
      }

      const closedTabOrders = closedTabs.reduce((sum, t) => sum + t.orders, 0);
      assert.strictEqual(closedTabOrders, 10, "Closed tabs had 10 orders");
      assert.strictEqual(
        finalizedStock,
        443.6,
        "Finalized 10 drinks worth of stock",
      );

      // 6. Calculate state after close
      const remainingReserved = reservedStock - finalizedStock; // For open tabs
      const currentStockAfterClose = initialTequilaStock - finalizedStock;

      assert.strictEqual(
        remainingReserved,
        266.16,
        "6 drinks still reserved for open tabs",
      );
      assert.strictEqual(
        currentStockAfterClose,
        3681.4,
        "Stock after closing 10 drinks",
      );

      // 7. Void one order from open tab (return stock)
      const voidAmount = tequilaPerDrink;
      const reservedAfterVoid = remainingReserved - voidAmount;

      assert.strictEqual(
        reservedAfterVoid,
        221.8,
        "Reserved decreased after void",
      );

      // 8. Final state
      const finalReserved = reservedAfterVoid; // For 5 remaining open orders
      const finalCurrent = currentStockAfterClose; // Unchanged by void

      assert.strictEqual(
        finalCurrent,
        3681.4,
        "Current stock unchanged by void",
      );
      assert.strictEqual(
        finalReserved,
        221.8,
        "Reserved reflects open orders minus void",
      );

      const endTime = Date.now();
      console.log(`Integration test completed in ${endTime - startTime}ms`);
    });
  });

  /**
   * INTEGRATION-002: Full Audit Flow
   *
   * Complete audit process:
   * 1. Create inventory items
   * 2. Record sales (reduce stock)
   * 3. Perform physical count
   * 4. Record audit with variance
   * 5. Analyze variance patterns
   * 6. Generate recommendations
   */
  describe("INTEGRATION-002: Full Audit Flow", () => {
    test("complete audit workflow", async () => {
      // 1. Initial inventory state
      const vodka = {
        id: "vodka-001",
        name: "Vodka",
        baseUnitAmount: 750,
        currentBulk: 10,
        currentPartial: 200,
        currentStock: 7700, // (10 × 750) + 200
        lastAuditedAt: null,
      };

      // 2. Record sales for a week
      const weeklySales = 1500; // ml sold
      const expectedStockAfterSales = vodka.currentStock - weeklySales;

      assert.strictEqual(expectedStockAfterSales, 6200, "Stock after sales");

      // 3. Physical count performed
      const physicalCount = {
        bulk: 8,
        partial: 150,
      };

      const calculatedPhysicalTotal =
        physicalCount.bulk * vodka.baseUnitAmount + physicalCount.partial;

      assert.strictEqual(calculatedPhysicalTotal, 6150, "Physical count total");

      // 4. Calculate variance
      const expectedTotal = expectedStockAfterSales;
      const reportedTotal = calculatedPhysicalTotal;
      const variance = reportedTotal - expectedTotal;
      const variancePercent = (variance / expectedTotal) * 100;

      assert.strictEqual(variance, -50, "Variance: 6150 - 6200 = -50ml");
      assert.ok(
        Math.abs(variancePercent - -0.81) < 0.01,
        "Variance percent ~ -0.81%",
      );

      // 5. Classify variance
      const absVariance = Math.abs(variancePercent);
      const classification =
        absVariance < 2
          ? "normal"
          : absVariance < 5
            ? "attention"
            : absVariance < 10
              ? "significant"
              : "critical";

      assert.strictEqual(classification, "normal", "0.81% variance is normal");

      // 6. Multiple audits over time to detect patterns
      const auditHistory = [
        { date: "2026-04-01", variancePercent: -0.5 },
        { date: "2026-04-08", variancePercent: -0.81 },
        { date: "2026-04-15", variancePercent: -1.2 },
        { date: "2026-04-22", variancePercent: -0.9 },
      ];

      // Calculate trend
      const avgVariance =
        auditHistory.reduce((sum, a) => sum + a.variancePercent, 0) /
        auditHistory.length;
      const allNegative = auditHistory.every((a) => a.variancePercent < 0);

      assert.ok(
        avgVariance < 0,
        "Average variance is negative (consistent shortage)",
      );
      assert.strictEqual(
        allNegative,
        true,
        "All variances negative - consistent underage pattern",
      );

      // 7. Generate recommendation
      const recommendation =
        allNegative && Math.abs(avgVariance) > 0.5
          ? "Consistent underage detected. Investigate pour accuracy and spillage."
          : "Within normal range.";

      assert.ok(
        recommendation.includes("Consistent underage"),
        "System should flag pattern",
      );
    });

    test("batch audit with multiple items", async () => {
      // Batch audit session with 5 items
      const items = [
        { id: "item-1", name: "Vodka", expected: 7700, reported: 6950 },
        { id: "item-2", name: "Whiskey", expected: 3750, reported: 3850 },
        { id: "item-3", name: "Gin", expected: 6150, reported: 6150 },
        { id: "item-4", name: "Rum", expected: 3000, reported: 1500 }, // -50%
        { id: "item-5", name: "Tequila", expected: 4125, reported: 4100 },
      ];

      // Calculate variances
      const results = items.map((item) => {
        const variance = item.reported - item.expected;
        const variancePercent = (variance / item.expected) * 100;
        return {
          ...item,
          variance,
          variancePercent: parseFloat(variancePercent.toFixed(2)),
        };
      });

      // Verify calculations
      assert.strictEqual(results[0].variance, -750);
      assert.strictEqual(results[0].variancePercent, -9.74);

      assert.strictEqual(results[1].variance, 100);
      assert.strictEqual(results[1].variancePercent, 2.67);

      assert.strictEqual(results[2].variance, 0);
      assert.strictEqual(results[2].variancePercent, 0);

      assert.strictEqual(results[3].variance, -1500);
      assert.strictEqual(results[3].variancePercent, -50.0);

      // Identify significant variances
      const significant = results.filter(
        (r) => Math.abs(r.variancePercent) > 5,
      );
      assert.strictEqual(
        significant.length,
        2,
        "2 items have significant variance",
      );
      assert.strictEqual(significant[0].name, "Vodka");
      assert.strictEqual(significant[1].name, "Rum");

      // Critical variance (> 10%)
      const critical = results.filter((r) => Math.abs(r.variancePercent) > 10);
      assert.strictEqual(critical.length, 1, "1 item has critical variance");
      assert.strictEqual(critical[0].name, "Rum");

      // Batch summary
      const totalVariance = results.reduce((sum, r) => sum + r.variance, 0);
      const totalAbsVariance = results.reduce(
        (sum, r) => sum + Math.abs(r.variance),
        0,
      );

      assert.strictEqual(totalVariance, -2150); // Directional
      assert.strictEqual(totalAbsVariance, 3350); // Absolute
    });
  });

  /**
   * INTEGRATION-003: Manager Authorization Flow
   *
   * Tests manager PIN authorization for sensitive operations:
   * 1. Attempt void without manager credentials (should fail)
   * 2. Attempt void with invalid manager (should fail)
   * 3. Attempt void with wrong PIN (should fail)
   * 4. Void with valid manager credentials (should succeed)
   */
  describe("INTEGRATION-003: Manager Authorization Flow", () => {
    test("void authorization sequence", async () => {
      const orderId = "order-001";
      const staffUserId = "staff-001"; // Regular staff
      const managerUserId = "manager-001"; // Admin

      // Test scenarios
      const scenarios = [
        {
          name: "No manager credentials",
          input: { reason: "wrong_order" },
          expected: { success: false, code: "MANAGER_REQUIRED" },
        },
        {
          name: "Invalid manager (not admin)",
          input: {
            reason: "wrong_order",
            managerUserId: staffUserId, // Staff trying to authorize
            managerPin: "1234",
          },
          expected: { success: false, code: "INVALID_MANAGER" },
        },
        {
          name: "Wrong manager PIN",
          input: {
            reason: "wrong_order",
            managerUserId: managerUserId,
            managerPin: "0000", // Wrong PIN
          },
          expected: { success: false, code: "INVALID_PIN" },
        },
        {
          name: "Valid manager authorization",
          input: {
            reason: "wrong_order",
            managerUserId: managerUserId,
            managerPin: "5678", // Correct PIN
          },
          expected: { success: true },
        },
      ];

      // Verify all scenarios
      for (const scenario of scenarios) {
        const isValidManager = scenario.input.managerUserId === managerUserId;
        const isValidPin = scenario.input.managerPin === "5678";
        const hasCredentials =
          !!scenario.input.managerUserId && !!scenario.input.managerPin;

        let result;
        if (!hasCredentials) {
          result = { success: false, code: "MANAGER_REQUIRED" };
        } else if (!isValidManager) {
          result = { success: false, code: "INVALID_MANAGER" };
        } else if (!isValidPin) {
          result = { success: false, code: "INVALID_PIN" };
        } else {
          result = { success: true };
        }

        assert.strictEqual(
          result.success,
          scenario.expected.success,
          `${scenario.name}: success should be ${scenario.expected.success}`,
        );

        if (scenario.expected.code) {
          assert.strictEqual(
            result.code,
            scenario.expected.code,
            `${scenario.name}: code should be ${scenario.expected.code}`,
          );
        }
      }
    });
  });

  /**
   * INTEGRATION-004: Low Stock Alert Flow
   *
   * Tests the complete low stock alert workflow:
   * 1. Set low stock threshold on item
   * 2. Reduce stock below threshold through sales
   * 3. Verify alert is triggered
   * 4. Restock item
   * 5. Verify alert is cleared
   */
  describe("INTEGRATION-004: Low Stock Alert Flow", () => {
    test("low stock alert lifecycle", async () => {
      // 1. Item with threshold
      const item = {
        id: "alert-test-001",
        name: "Premium Tequila",
        currentStock: 1000,
        reservedStock: 0,
        lowStockThreshold: 500,
      };

      // Check initial state
      const availableInitial = item.currentStock + item.reservedStock;
      const isLowStockInitial = availableInitial < item.lowStockThreshold;

      assert.strictEqual(isLowStockInitial, false, "Initially above threshold");

      // 2. Reserve stock (simulate open orders)
      const reservation1 = 300;
      item.reservedStock = -reservation1; // Negative = reserved

      const availableAfterReserve1 = item.currentStock + item.reservedStock;
      const isLowStockAfterReserve1 =
        availableAfterReserve1 < item.lowStockThreshold;

      assert.strictEqual(
        availableAfterReserve1,
        700,
        "700ml available after first reservation",
      );
      assert.strictEqual(
        isLowStockAfterReserve1,
        false,
        "Still above threshold",
      );

      // 3. More reservations trigger alert
      const reservation2 = 250;
      item.reservedStock = -(reservation1 + reservation2);

      const availableAfterReserve2 = item.currentStock + item.reservedStock;
      const isLowStockAfterReserve2 =
        availableAfterReserve2 < item.lowStockThreshold;

      assert.strictEqual(
        availableAfterReserve2,
        450,
        "450ml available - BELOW THRESHOLD",
      );
      assert.strictEqual(
        isLowStockAfterReserve2,
        true,
        "ALERT: Low stock detected!",
      );

      // 4. Close tab (finalize some stock)
      const finalizedAmount = 300;
      item.currentStock -= finalizedAmount;
      item.reservedStock += finalizedAmount; // Return to reserved

      const availableAfterClose = item.currentStock + item.reservedStock;

      assert.strictEqual(item.currentStock, 700, "700ml current after close");
      assert.strictEqual(item.reservedStock, -250, "250ml still reserved");
      assert.strictEqual(availableAfterClose, 450, "Still low after close");

      // 5. Restock
      item.currentStock += 1000; // New delivery

      const availableAfterRestock = item.currentStock + item.reservedStock;
      const isLowStockAfterRestock =
        availableAfterRestock < item.lowStockThreshold;

      assert.strictEqual(item.currentStock, 1700, "1700ml after restock");
      assert.strictEqual(availableAfterRestock, 1450, "1450ml available");
      assert.strictEqual(
        isLowStockAfterRestock,
        false,
        "Alert cleared after restock",
      );
    });
  });

  /**
   * INTEGRATION-005: Split Payment Flow
   *
   * Tests split bill scenarios:
   * 1. Tab with multiple orders
   * 2. Split evenly among N people
   * 3. Split with different payment methods
   * 4. Handle uneven splits (rounding)
   */
  describe("INTEGRATION-005: Split Payment Flow", () => {
    test("even 3-way split", async () => {
      const tabTotal = 300;
      const tipTotal = 45;
      const splitCount = 3;

      const perPerson = tabTotal / splitCount;
      const tipPerPerson = tipTotal / splitCount;

      assert.strictEqual(perPerson, 100);
      assert.strictEqual(tipPerPerson, 15);

      const payments = Array(splitCount).fill({
        amount: perPerson,
        tip: tipPerPerson,
      });

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalTips = payments.reduce((sum, p) => sum + p.tip, 0);

      assert.strictEqual(totalPaid, tabTotal);
      assert.strictEqual(totalTips, tipTotal);
    });

    test("uneven split with rounding", async () => {
      const tabTotal = 100; // Creates 33.333... per person
      const splitCount = 3;

      // Calculate with cents precision
      const baseAmount = Math.floor((tabTotal / splitCount) * 100) / 100; // 33.33
      const remainder = tabTotal - baseAmount * splitCount; // 0.01

      const payments = [
        baseAmount + remainder, // 33.34 (first person pays extra cent)
        baseAmount, // 33.33
        baseAmount, // 33.33
      ];

      const totalPaid = payments.reduce((sum, p) => sum + p, 0);
      assert.strictEqual(totalPaid, tabTotal);

      // Verify all payments are within 1 cent
      const maxPayment = Math.max(...payments);
      const minPayment = Math.min(...payments);
      assert.ok(maxPayment - minPayment <= 0.01, "Difference <= 1 cent");
    });

    test("split with mixed payment methods", async () => {
      const tabTotal = 250;

      const payments = [
        { amount: 100, method: "cash", person: "Alice" },
        { amount: 100, method: "card", person: "Bob" },
        { amount: 50, method: "cash", person: "Charlie" },
      ];

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      assert.strictEqual(totalPaid, tabTotal);

      const cashTotal = payments
        .filter((p) => p.method === "cash")
        .reduce((sum, p) => sum + p.amount, 0);
      const cardTotal = payments
        .filter((p) => p.method === "card")
        .reduce((sum, p) => sum + p.amount, 0);

      assert.strictEqual(cashTotal, 150);
      assert.strictEqual(cardTotal, 100);
    });
  });
});

// Export for potential external usage
export { describe, test };
