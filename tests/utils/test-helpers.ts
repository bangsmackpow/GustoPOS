/**
 * Test Utilities and Helpers
 *
 * Shared utilities for GustoPOS test suite
 * Supports unit, integration, and e2e tests
 */

import { db } from "@workspace/db";
import {
  inventoryItemsTable,
  drinksTable,
  recipeIngredientsTable,
  tabsTable,
  ordersTable,
  usersTable,
  shiftsTable,
  inventoryAuditsTable,
  auditSessionsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create a test inventory item with sensible defaults
 */
export async function createTestInventoryItem(overrides = {}) {
  const defaults = {
    name: `Test Item ${Date.now()}`,
    type: "spirit",
    baseUnit: "ml",
    baseUnitAmount: 750,
    currentBulk: 3,
    currentPartial: 375,
    currentStock: 2625, // (3 * 750) + 375
    reservedStock: 0,
    orderCost: 450,
    servingSize: 44.36,
    density: 0.94,
    lowStockThreshold: 500,
    isDeleted: 0,
  };

  const [item] = await db
    .insert(inventoryItemsTable)
    .values({ ...defaults, ...overrides })
    .returning();

  return item;
}

/**
 * Create a test drink with recipe
 */
export async function createTestDrink(overrides = {}, recipeIngredients = []) {
  const defaults = {
    name: `Test Drink ${Date.now()}`,
    category: "cocktail",
    actualPrice: 120,
    isAvailable: 1,
    isOnMenu: 1,
  };

  const [drink] = await db
    .insert(drinksTable)
    .values({ ...defaults, ...overrides })
    .returning();

  // Add recipe ingredients if provided
  if (recipeIngredients.length > 0) {
    await db.insert(recipeIngredientsTable).values(
      recipeIngredients.map((ri) => ({
        drinkId: drink.id,
        ingredientId: ri.ingredientId,
        amountInBaseUnit: ri.amountInBaseUnit || 44.36,
        amountInMl: ri.amountInMl || ri.amountInBaseUnit || 44.36,
      })),
    );
  }

  return drink;
}

/**
 * Create a test user
 */
export async function createTestUser(overrides = {}) {
  const defaults = {
    email: `test-${Date.now()}@gusto.local`,
    password: "hashedpassword123",
    firstName: "Test",
    lastName: "User",
    role: "bartender",
    pin: "1234",
  };

  const [user] = await db
    .insert(usersTable)
    .values({ ...defaults, ...overrides })
    .returning();

  return user;
}

/**
 * Create a test shift
 */
export async function createTestShift(overrides = {}) {
  const defaults = {
    name: `Test Shift ${Date.now()}`,
    status: "active",
    openedByUserId:
      overrides.openedByUserId || (await createTestUser({ role: "admin" })).id,
    startedAt: Math.floor(Date.now() / 1000),
  };

  const [shift] = await db
    .insert(shiftsTable)
    .values({ ...defaults, ...overrides })
    .returning();

  return shift;
}

/**
 * Create a test tab
 */
export async function createTestTab(overrides = {}) {
  const userId = overrides.staffUserId || (await createTestUser()).id;

  const defaults = {
    nickname: `Test Tab ${Date.now()}`,
    staffUserId: userId,
    status: "open",
    totalMxn: 0,
    currency: "MXN",
    openedAt: Math.floor(Date.now() / 1000),
  };

  const [tab] = await db
    .insert(tabsTable)
    .values({ ...defaults, ...overrides })
    .returning();

  return tab;
}

/**
 * Create a test order
 */
export async function createTestOrder(overrides = {}) {
  const defaults = {
    tabId: overrides.tabId,
    drinkId: overrides.drinkId,
    drinkName: overrides.drinkName || "Test Drink",
    quantity: 1,
    unitPriceMxn: 120,
    voided: 0,
    createdAt: Math.floor(Date.now() / 1000),
  };

  const [order] = await db
    .insert(ordersTable)
    .values({ ...defaults, ...overrides })
    .returning();

  return order;
}

// ============================================================================
// Stock Management Helpers
// ============================================================================

/**
 * Reserve stock for an order
 */
export async function reserveStock(itemId: string, amount: number) {
  await db
    .update(inventoryItemsTable)
    .set({
      reservedStock: sql`COALESCE(${inventoryItemsTable.reservedStock}, 0) + ${amount}`,
    })
    .where(eq(inventoryItemsTable.id, itemId));

  return getInventoryItem(itemId);
}

/**
 * Release reserved stock (for voids)
 */
export async function releaseStock(itemId: string, amount: number) {
  await db
    .update(inventoryItemsTable)
    .set({
      reservedStock: sql`GREATEST(0, COALESCE(${inventoryItemsTable.reservedStock}, 0) - ${amount})`,
    })
    .where(eq(inventoryItemsTable.id, itemId));

  return getInventoryItem(itemId);
}

/**
 * Finalize stock on tab close
 */
export async function finalizeStock(itemId: string, reservedAmount: number) {
  const [item] = await db
    .select()
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.id, itemId));

  const currentStock = item.currentStock || 0;

  await db
    .update(inventoryItemsTable)
    .set({
      currentStock: Math.max(0, currentStock - reservedAmount),
      reservedStock: 0,
    })
    .where(eq(inventoryItemsTable.id, itemId));

  return getInventoryItem(itemId);
}

/**
 * Get inventory item with calculated fields
 */
export async function getInventoryItem(itemId: string) {
  const [item] = await db
    .select()
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.id, itemId));

  return {
    ...item,
    availableStock: (item.currentStock || 0) + (item.reservedStock || 0),
    calculatedStock:
      (item.currentBulk || 0) * (item.baseUnitAmount || 0) +
      (item.currentPartial || 0),
  };
}

// ============================================================================
// Audit Helpers
// ============================================================================

/**
 * Create a test audit record
 */
export async function createTestAudit(overrides = {}) {
  const defaults = {
    itemId: overrides.itemId,
    auditDate: Math.floor(Date.now() / 1000),
    auditEntryMethod: "bulk_partial",
    reportedBulk: 5,
    reportedPartial: 400,
    reportedTotal: 4150, // (5 * 750) + 400
    expectedTotal: 5000,
    systemStock: 5000,
    physicalCount: 4150,
    variance: -850,
    variancePercent: -17,
    auditReason: "counting_error",
    auditedByUserId: overrides.auditedByUserId || (await createTestUser()).id,
    auditedAt: Math.floor(Date.now() / 1000),
    createdAt: Math.floor(Date.now() / 1000),
  };

  const [audit] = await db
    .insert(inventoryAuditsTable)
    .values({ ...defaults, ...overrides })
    .returning();

  return audit;
}

/**
 * Calculate variance for audit
 */
export function calculateVariance(
  reportedBulk: number,
  reportedPartial: number,
  baseUnitAmount: number,
  expectedTotal: number,
) {
  const reportedTotal = reportedBulk * baseUnitAmount + reportedPartial;
  const variance = reportedTotal - expectedTotal;
  const variancePercent =
    expectedTotal > 0 ? (variance / expectedTotal) * 100 : 0;

  return {
    reportedTotal,
    variance,
    variancePercent: parseFloat(variancePercent.toFixed(2)),
  };
}

/**
 * Classify variance severity per AUDIT_PROTOCOL
 */
export function classifyVariance(variancePercent: number) {
  const absVariance = Math.abs(variancePercent);

  if (absVariance < 2) return { level: "normal", color: "green" };
  if (absVariance < 5) return { level: "attention", color: "yellow" };
  if (absVariance < 10) return { level: "significant", color: "orange" };
  return { level: "critical", color: "red" };
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Clean up test data by IDs
 */
export async function cleanupTestData(data: {
  userIds?: string[];
  itemIds?: string[];
  drinkIds?: string[];
  tabIds?: string[];
  orderIds?: string[];
  shiftIds?: string[];
  auditIds?: string[];
  sessionIds?: string[];
}) {
  // Delete in correct order to avoid FK constraints
  if (data.orderIds) {
    for (const id of data.orderIds) {
      await db.delete(ordersTable).where(eq(ordersTable.id, id));
    }
  }

  if (data.tabIds) {
    for (const id of data.tabIds) {
      await db.delete(tabsTable).where(eq(tabsTable.id, id));
    }
  }

  if (data.drinkIds) {
    for (const id of data.drinkIds) {
      await db
        .delete(recipeIngredientsTable)
        .where(eq(recipeIngredientsTable.drinkId, id));
      await db.delete(drinksTable).where(eq(drinksTable.id, id));
    }
  }

  if (data.itemIds) {
    for (const id of data.itemIds) {
      await db
        .delete(inventoryAuditsTable)
        .where(eq(inventoryAuditsTable.itemId, id));
      await db
        .delete(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, id));
    }
  }

  if (data.shiftIds) {
    for (const id of data.shiftIds) {
      await db.delete(shiftsTable).where(eq(shiftsTable.id, id));
    }
  }

  if (data.userIds) {
    for (const id of data.userIds) {
      await db.delete(usersTable).where(eq(usersTable.id, id));
    }
  }

  if (data.auditIds) {
    for (const id of data.auditIds) {
      await db
        .delete(inventoryAuditsTable)
        .where(eq(inventoryAuditsTable.id, id));
    }
  }

  if (data.sessionIds) {
    for (const id of data.sessionIds) {
      await db.delete(auditSessionsTable).where(eq(auditSessionsTable.id, id));
    }
  }
}

/**
 * Clean up all test data with a specific prefix
 */
export async function cleanupTestDataByPrefix(prefix: string) {
  // This is a helper to clean up any test data that might be left behind
  // In production, you'd use a transaction rollback or test database

  const testUsers = await db
    .select()
    .from(usersTable)
    .where(sql`${usersTable.email} LIKE ${prefix + "%"}`);

  for (const user of testUsers) {
    await cleanupTestData({ userIds: [user.id] });
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert stock values match expected
 */
export function assertStockState(
  actual: {
    currentStock: number | null;
    reservedStock: number | null;
  },
  expected: {
    currentStock: number;
    reservedStock: number;
  },
  message?: string,
) {
  const actualCurrent = actual.currentStock || 0;
  const actualReserved = actual.reservedStock || 0;

  if (actualCurrent !== expected.currentStock) {
    throw new Error(
      message
        ? `${message}: currentStock expected ${expected.currentStock}, got ${actualCurrent}`
        : `currentStock expected ${expected.currentStock}, got ${actualCurrent}`,
    );
  }

  if (actualReserved !== expected.reservedStock) {
    throw new Error(
      message
        ? `${message}: reservedStock expected ${expected.reservedStock}, got ${actualReserved}`
        : `reservedStock expected ${expected.reservedStock}, got ${actualReserved}`,
    );
  }
}

/**
 * Assert variance calculation is correct
 */
export function assertVariance(
  variance: number,
  variancePercent: number,
  expected: {
    variance: number;
    variancePercent: number;
  },
  tolerance: number = 0.01,
) {
  if (Math.abs(variance - expected.variance) > tolerance) {
    throw new Error(
      `Variance expected ${expected.variance}, got ${variance} (tolerance: ${tolerance})`,
    );
  }

  if (Math.abs(variancePercent - expected.variancePercent) > tolerance) {
    throw new Error(
      `VariancePercent expected ${expected.variancePercent}, got ${variancePercent} (tolerance: ${tolerance})`,
    );
  }
}

// ============================================================================
// Performance Measurement
// ============================================================================

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Assert performance meets threshold
 */
export function assertPerformance(
  duration: number,
  threshold: number,
  operation: string,
) {
  if (duration > threshold) {
    throw new Error(
      `Performance assertion failed: ${operation} took ${duration.toFixed(2)}ms, ` +
        `threshold: ${threshold}ms`,
    );
  }
}

// ============================================================================
// Export for test usage
// ============================================================================

export const TestHelpers = {
  // Factories
  createTestInventoryItem,
  createTestDrink,
  createTestUser,
  createTestShift,
  createTestTab,
  createTestOrder,

  // Stock management
  reserveStock,
  releaseStock,
  finalizeStock,
  getInventoryItem,

  // Audit
  createTestAudit,
  calculateVariance,
  classifyVariance,

  // Cleanup
  cleanupTestData,
  cleanupTestDataByPrefix,

  // Assertions
  assertStockState,
  assertVariance,

  // Performance
  measurePerformance,
  assertPerformance,
};

export default TestHelpers;
