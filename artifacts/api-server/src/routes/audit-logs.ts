import { Router, type IRouter, type Request, type Response } from "express";
import { db, eventLogsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const entityType = req.query.entityType as string | undefined;
    const userId = req.query.userId as string | undefined;

    let logs;
    if (entityType && userId) {
      logs = await db
        .select()
        .from(eventLogsTable)
        .where(
          sql`${eventLogsTable.entityType} = ${entityType} AND ${eventLogsTable.userId} = ${userId}`,
        )
        .orderBy(desc(eventLogsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (entityType) {
      logs = await db
        .select()
        .from(eventLogsTable)
        .where(eq(eventLogsTable.entityType, entityType))
        .orderBy(desc(eventLogsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (userId) {
      logs = await db
        .select()
        .from(eventLogsTable)
        .where(eq(eventLogsTable.userId, userId))
        .orderBy(desc(eventLogsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      logs = await db
        .select()
        .from(eventLogsTable)
        .orderBy(desc(eventLogsTable.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users =
      userIds.length > 0
        ? await db
            .select({
              id: usersTable.id,
              firstName: usersTable.firstName,
              lastName: usersTable.lastName,
              email: usersTable.email,
            })
            .from(usersTable)
            .where(
              sql`${usersTable.id} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
        : [];
    const userMap = new Map(
      users.map((u) => [
        u.id,
        `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id,
      ]),
    );

    res.json(
      logs.map((l) => ({
        ...l,
        userName: userMap.get(l.userId) || l.userId,
        oldValue: l.oldValue ? JSON.parse(l.oldValue) : null,
        newValue: l.newValue ? JSON.parse(l.newValue) : null,
        createdAt: l.createdAt?.toISOString(),
      })),
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
