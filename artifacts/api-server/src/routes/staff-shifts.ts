import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { staffShiftsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import * as zod from "zod";
import { customHeaders } from "../lib/headers";
import {
  GetStaffShiftsResponse,
  ClockInStaffBody,
  ClockInStaffResponse,
  ClockOutStaffBody,
  ClockOutStaffResponse,
} from "@workspace/api-zod";

const router = Router();

/**
 * GET /api/staff-shifts/:shiftId
 * Get all staff shifts for a shift
 */
router.get("/:shiftId", async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId as string;

    // Verify shift exists
    const shift = await db.query.shiftsTable.findFirst({
      where: (table) => eq(table.id, shiftId),
    });

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    // Get all staff shifts with user details
    const staffShifts = await db
      .select({
        id: staffShiftsTable.id,
        shiftId: staffShiftsTable.shiftId,
        staffUserId: staffShiftsTable.staffUserId,
        staffName: sql<string>`${usersTable.firstName} || ' ' || COALESCE(${usersTable.lastName}, '')`,
        staffRole: usersTable.role,
        clockInAt: staffShiftsTable.clockInAt,
        clockOutAt: staffShiftsTable.clockOutAt,
        breakStartAt: staffShiftsTable.breakStartAt,
        breakEndAt: staffShiftsTable.breakEndAt,
        notes: staffShiftsTable.notes,
      })
      .from(staffShiftsTable)
      .innerJoin(usersTable, eq(staffShiftsTable.staffUserId, usersTable.id))
      .where(eq(staffShiftsTable.shiftId, shiftId));

    // Calculate hours worked and break time
    const response: zod.infer<typeof GetStaffShiftsResponse> = staffShifts.map(
      (s) => {
        const clockIn = new Date(s.clockInAt!);
        const clockOut = s.clockOutAt ? new Date(s.clockOutAt) : new Date();
        const hoursWorked =
          (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

        let breakMinutes = 0;
        if (s.breakStartAt && s.breakEndAt) {
          const breakStart = new Date(s.breakStartAt);
          const breakEnd = new Date(s.breakEndAt);
          breakMinutes = Math.round(
            (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60),
          );
        }

        return {
          id: s.id,
          shiftId: s.shiftId,
          staffUserId: s.staffUserId,
          staffName: s.staffName.trim(),
          staffRole: s.staffRole ?? undefined,
          clockInAt: new Date(s.clockInAt!),
          clockOutAt: s.clockOutAt ? new Date(s.clockOutAt) : undefined,
          breakStartAt: s.breakStartAt ? new Date(s.breakStartAt) : undefined,
          breakEndAt: s.breakEndAt ? new Date(s.breakEndAt) : undefined,
          notes: s.notes ?? undefined,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          breakMinutes,
        };
      },
    );

    return res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[staff-shifts] GET/:shiftId error:", error);
    return res.status(500).json({ error: "Failed to fetch staff shifts" });
  }
});

/**
 * POST /api/staff-shifts/clock-in
 * Clock in a staff member for the current shift
 */
router.post("/clock-in", async (req: Request, res: Response) => {
  try {
    const body = ClockInStaffBody.parse(req.body);

    // Verify shift exists and is open
    const shift = await db.query.shiftsTable.findFirst({
      where: (table) => eq(table.id, body.shiftId),
    });

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    if (shift.closedAt) {
      return res.status(400).json({ error: "Shift is closed" });
    }

    // Verify user exists
    const user = await db.query.usersTable.findFirst({
      where: (table) => eq(table.id, body.staffUserId),
    });

    if (!user) {
      return res.status(404).json({ error: "Staff user not found" });
    }

    // Check if already clocked in for this shift
    const existing = await db.query.staffShiftsTable.findFirst({
      where: (table) =>
        and(
          eq(table.shiftId, body.shiftId),
          eq(table.staffUserId, body.staffUserId),
          sql`${table.clockOutAt} IS NULL`,
        ),
    });

    if (existing) {
      return res.status(400).json({ error: "Staff member already clocked in" });
    }

    // Create shift record
    const newId = `shift_${body.staffUserId}_${Date.now()}`;
    await db.insert(staffShiftsTable).values({
      id: newId,
      shiftId: body.shiftId,
      staffUserId: body.staffUserId,
      clockInAt: new Date(),
      notes: body.notes,
    });

    const staffShift = await db.query.staffShiftsTable.findFirst({
      where: (table) => eq(table.id, newId),
    });

    const response: zod.infer<typeof ClockInStaffResponse> = {
      success: true,
      shift: {
        id: staffShift!.id,
        staffName: `${user.firstName} ${user.lastName || ""}`.trim(),
        clockInAt: new Date(staffShift!.clockInAt!),
        notes: staffShift!.notes ?? undefined,
      },
    };

    return res.set(customHeaders).json(response);
  } catch (error) {
    console.error("[staff-shifts] GET/:shiftId error:", error);
    return res.status(500).json({ error: "Failed to fetch staff shifts" });
  }
});

/**
 * POST /api/staff-shifts/clock-out
 * Clock out a staff member
 */
router.post("/clock-out", async (req: Request, res: Response) => {
  try {
    const body = ClockOutStaffBody.parse(req.body);

    // Verify staff shift exists
    const staffShift = await db.query.staffShiftsTable.findFirst({
      where: (table) => eq(table.id, body.staffShiftId),
    });

    if (!staffShift) {
      return res.status(404).json({ error: "Staff shift not found" });
    }

    if (staffShift.clockOutAt) {
      return res
        .status(400)
        .json({ error: "Staff member already clocked out" });
    }

    // Get user info
    const user = await db.query.usersTable.findFirst({
      where: (table) => eq(table.id, staffShift.staffUserId),
    });

    // Update clock out time
    const now = new Date();
    await db
      .update(staffShiftsTable)
      .set({
        clockOutAt: now,
        notes: body.notes || staffShift.notes,
      })
      .where(eq(staffShiftsTable.id, body.staffShiftId));

    const clockInTime = new Date(staffShift.clockInAt!);
    const hoursWorked =
      Math.round(
        ((now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)) * 100,
      ) / 100;

    const response: zod.infer<typeof ClockOutStaffResponse> = {
      success: true,
      shift: {
        staffName: `${user!.firstName} ${user!.lastName || ""}`.trim(),
        clockInAt: new Date(staffShift.clockInAt!),
        clockOutAt: now,
        hoursWorked,
      },
    };

    return res.set(customHeaders).json(response);
  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", issues: error.issues });
    }
    console.error("[staff-shifts] POST /clock-out error:", error);
    return res.status(500).json({ error: "Failed to clock out" });
  }
});

export default router;
