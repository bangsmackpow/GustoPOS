// Frontend-only type definitions for inventory entities
// These mirror @workspace/db types but are frontend-specific

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  trackingType: string;
  bulkUnit?: string;
  bulkSize: number;
  partialUnit?: string;
  servingSize?: number;
  servingUnit?: string;
  alcoholDensity?: number;
  glassWeightG?: number;
  fullBottleWeightG?: number;
  sellSingleServing: boolean;
  singleServingPrice?: number;
  bulkCost?: number;
  markupFactor: number;
  isOnMenu: boolean;
  lowStockMethod?: string;
  lowStockManualThreshold?: number;
  lowStockPercent?: number;
  lowStockPercentBase?: number;
  lowStockUsageDays?: number;
  currentBulk: number;
  currentPartial: number;
  lastAuditedAt?: Date | number;
  lastAuditedByUserId?: string;
  createdAt: Date | number;
  updatedAt: Date | number;
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
