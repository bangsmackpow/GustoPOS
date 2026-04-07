import { db, eventLogsTable } from "@workspace/db";

export async function logEvent(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  reason?: string | null;
}) {
  try {
    await db.insert(eventLogsTable).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      reason: params.reason || null,
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write event log:", err);
  }
}
