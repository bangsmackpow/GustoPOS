import { Router, type IRouter, type Request, type Response } from "express";
import fs from "fs";
import { initializeDatabase } from "@workspace/db";
import {
  createBackup,
  listBackups,
  restoreFromBackup,
  deleteBackup,
  getBackupSettings,
  startAutoBackup,
  backupOnShiftClose,
} from "../lib/backup";

const router: IRouter = Router();

router.post(
  "/reset-database",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const dbPath = process.env.DATABASE_URL?.replace(/^file:\/{1,3}/, "");
      if (!dbPath || !fs.existsSync(dbPath)) {
        res.status(400).json({ error: "Database file not found" });
        return;
      }

      fs.unlinkSync(dbPath);
      console.log(`[Reset] Deleted database file: ${dbPath}`);

      await initializeDatabase();
      console.log("[Reset] Database re-initialized successfully");

      res.json({ ok: true, message: "Database reset successfully" });
    } catch (err: any) {
      console.error("[Reset] Error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to reset database" });
    }
  },
);

router.post("/backup", async (req: Request, res: Response): Promise<void> => {
  try {
    const backup = await createBackup("manual");
    res.json({
      success: true,
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        createdAt: backup.createdAt,
        type: backup.type,
      },
    });
  } catch (err: any) {
    console.error("[Backup] Error:", err);
    res.status(500).json({ error: err.message || "Failed to create backup" });
  }
});

router.get("/backups", async (req: Request, res: Response): Promise<void> => {
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (err: any) {
    console.error("[Backup] Error:", err);
    res.status(500).json({ error: err.message || "Failed to list backups" });
  }
});

router.post(
  "/backups/:id/restore",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const backupId = req.params.id as string;
      const backups = await listBackups();
      const backup = backups.find(
        (b) => b.filename === backupId || b.id === backupId,
      );

      if (!backup) {
        res.status(404).json({ error: "Backup not found" });
        return;
      }

      await restoreFromBackup(backup.path, true);
      res.json({ success: true, message: "Database restored successfully" });
    } catch (err: any) {
      console.error("[Backup] Restore error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to restore backup" });
    }
  },
);

router.delete(
  "/backups/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const backupId = req.params.id as string;
      await deleteBackup(backupId);
      res.json({ success: true, message: "Backup deleted" });
    } catch (err: any) {
      console.error("[Backup] Delete error:", err);
      res.status(500).json({ error: err.message || "Failed to delete backup" });
    }
  },
);

router.get(
  "/backup-settings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await getBackupSettings();
      res.json(settings);
    } catch (err: any) {
      console.error("[Backup] Error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to get backup settings" });
    }
  },
);

router.post(
  "/backup/start-auto",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await startAutoBackup();
      res.json({ success: true, message: "Auto-backup started" });
    } catch (err: any) {
      console.error("[Backup] Error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to start auto-backup" });
    }
  },
);

router.post(
  "/backup/shift-close",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await backupOnShiftClose();
      res.json({ success: true, message: "Shift close backup completed" });
    } catch (err: any) {
      console.error("[Backup] Error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to create shift close backup" });
    }
  },
);

export default router;
