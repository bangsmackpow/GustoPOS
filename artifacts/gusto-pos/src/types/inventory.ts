// Frontend-only type definitions for inventory entities
// These mirror @workspace/db types but are frontend-specific

export interface InventoryItem {
  id: string;
  name: string;

  type: string;
  subtype?: string;
  trackingType?: string;
  trackingMode?: "auto" | "pool" | "collection";
  baseUnit?: string;
  baseUnitAmount?: number;
  partialUnit?: string;
  servingSize?: number;
  servingUnit?: string;
  alcoholDensity?: number;
  density?: number;
  containerWeightG?: number;
  fullBottleWeightG?: number;
  sellSingleServing: boolean;
  singleServingPrice?: number;
  bulkCost?: number;
  orderCost?: number;
  markupFactor: number;
  isOnMenu: boolean;
  isHouseDefault?: boolean;
  menuPricePerServing?: number;
  lowStockMethod?: string;
  lowStockManualThreshold?: number;
  lowStockThreshold?: number;
  lowStockPercent?: number;
  lowStockPercentBase?: number;
  lowStockUsageDays?: number;
  currentBulk: number;
  currentPartial: number;
  currentStock?: number;
  reservedStock?: number;
  lastAuditedAt?: Date | number;
  lastAuditedByUserId?: string;
  createdAt: Date | number;
  updatedAt: Date | number;
  isDeleted?: boolean;
}

export interface InventoryCount {
  id: string;
  itemId: string;
  auditDate: Date;
  auditedByUserId: string;
  auditEntryMethod: string;
  reportedBulk?: number;
  reportedPartial?: number;
  reportedTotal: number;
  previousTotal: number;
  expectedTotal: number;
  variance: number;
  variancePercent?: number;
  varianceReason?: string;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  itemId: string;
  adjustmentBulk: number;
  adjustmentPartial: number;
  reason?: string;
  adjustedByUserId: string;
  createdAt: Date;
}
