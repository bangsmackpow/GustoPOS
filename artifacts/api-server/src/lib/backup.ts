import fs from "fs";
import path from "path";
import { createClient as createLibSQLClient } from "@libsql/client";
import {
  getDatabasePath,
  getBackupDirectory,
  ensureBackupDirectory,
  client,
} from "@workspace/db";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
import { settingsTable } from "@workspace/db";

export interface BackupInfo {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
  type: "auto" | "daily" | "weekly" | "manual";
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoBackupIntervalMin: number;
  maxAutoBackups: number;
  lastAutoBackup: Date | null;
  lastDailyBackup: Date | null;
  lastWeeklyBackup: Date | null;
}

let backupIntervalId: NodeJS.Timeout | null = null;

function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function getBackupFilename(type: BackupInfo["type"]): string {
  const timestamp = formatTimestamp();
  return `gusto-${type}-${timestamp}.db`;
}

export async function createBackup(
  type: BackupInfo["type"] = "manual",
): Promise<BackupInfo> {
  const dbPath = getDatabasePath();
  const backupDir = ensureBackupDirectory();
  const filename = getBackupFilename(type);
  const backupPath = path.join(backupDir, filename);

  // Copy database file
  fs.copyFileSync(dbPath, backupPath);

  // Also copy WAL file if it exists
  const walPath = dbPath + "-wal";
  const walBackupPath = backupPath + "-wal";
  if (fs.existsSync(walPath)) {
    fs.copyFileSync(walPath, walBackupPath);
  }

  // Also copy SHM file if it exists
  const shmPath = dbPath + "-shm";
  const shmBackupPath = backupPath + "-shm";
  if (fs.existsSync(shmPath)) {
    fs.copyFileSync(shmPath, shmBackupPath);
  }

  const stats = fs.statSync(backupPath);

  // Update last backup timestamp in settings
  const updateField = {
    auto: "lastAutoBackup",
    daily: "lastDailyBackup",
    weekly: "lastWeeklyBackup",
    manual: "lastAutoBackup",
  }[type];

  if (updateField) {
    try {
      await db
        .update(settingsTable)
        .set({ [updateField]: new Date() })
        .where(eq(settingsTable.id, "default"));
    } catch (e) {
      console.warn("Could not update last backup timestamp:", e);
    }
  }

  console.log(
    `[Backup] Created ${type} backup: ${filename} (${stats.size} bytes)`,
  );

  return {
    id: filename,
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: new Date(),
    type,
  };
}

export async function listBackups(): Promise<BackupInfo[]> {
  const backupDir = getBackupDirectory();

  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => {
      const filePath = path.join(backupDir, f);
      const stats = fs.statSync(filePath);
      const typeMatch = f.match(/gusto-(auto|daily|weekly|manual)-/);
      const type = (typeMatch?.[1] || "manual") as BackupInfo["type"];

      return {
        id: f,
        filename: f,
        path: filePath,
        size: stats.size,
        createdAt: stats.mtime,
        type,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return files;
}

export async function restoreFromBackup(
  backupPath: string,
  promptUser: boolean = true,
): Promise<boolean> {
  const dbPath = getDatabasePath();

  // Verify backup file exists
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  if (promptUser) {
    console.log(`[Backup] Ready to restore from: ${backupPath}`);
    console.log(`[Backup] Current database: ${dbPath}`);
    console.log(`[Backup] WARNING: This will replace the current database!`);
  }

  // Create a backup of current state before restoring
  const emergencyBackup = await createBackup("manual");
  console.log(
    `[Backup] Created emergency backup before restore: ${emergencyBackup.filename}`,
  );

  // Close the database connection
  await client.close();

  // Restore the backup
  fs.copyFileSync(backupPath, dbPath);

  // Also restore WAL if it exists
  const backupWal = backupPath + "-wal";
  if (fs.existsSync(backupWal)) {
    fs.copyFileSync(backupWal, dbPath + "-wal");
  }

  // Reconnect to database
  const databaseUrl = process.env["DATABASE_URL"] || "file:./gusto.db";
  const _newClient = createLibSQLClient({ url: databaseUrl });

  console.log(`[Backup] Database restored from: ${path.basename(backupPath)}`);

  return true;
}

export async function deleteBackup(backupId: string): Promise<boolean> {
  const backupDir = getBackupDirectory();
  const backupPath = path.join(backupDir, backupId);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  fs.unlinkSync(backupPath);

  // Also delete WAL if exists
  const walPath = backupPath + "-wal";
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }

  // Also delete SHM if exists
  const shmPath = backupPath + "-shm";
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }

  console.log(`[Backup] Deleted: ${backupId}`);
  return true;
}

async function cleanupOldBackups(
  maxBackups: number,
  type?: BackupInfo["type"],
): Promise<void> {
  const backups = await listBackups();
  const filtered = type ? backups.filter((b) => b.type === type) : backups;
  const toDelete = filtered.slice(maxBackups);

  for (const backup of toDelete) {
    await deleteBackup(backup.filename);
  }
}

export async function getBackupSettings(): Promise<BackupSettings | null> {
  try {
    const [settings] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, "default"));

    if (!settings) return null;

    return {
      autoBackupEnabled: Boolean(settings.autoBackupEnabled),
      autoBackupIntervalMin: Number(settings.autoBackupIntervalMin) || 15,
      maxAutoBackups: Number(settings.maxAutoBackups) || 5,
      lastAutoBackup: settings.lastAutoBackup
        ? new Date(settings.lastAutoBackup)
        : null,
      lastDailyBackup: settings.lastDailyBackup
        ? new Date(settings.lastDailyBackup)
        : null,
      lastWeeklyBackup: settings.lastWeeklyBackup
        ? new Date(settings.lastWeeklyBackup)
        : null,
    };
  } catch (e) {
    console.warn("Could not get backup settings:", e);
    return null;
  }
}

export async function startAutoBackup(): Promise<void> {
  const settings = await getBackupSettings();

  if (!settings || !settings.autoBackupEnabled) {
    console.log("[Backup] Auto-backup disabled");
    stopAutoBackup();
    return;
  }

  const intervalMs = settings.autoBackupIntervalMin * 60 * 1000;

  // Clear existing interval
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
  }

  // Start new interval
  backupIntervalId = setInterval(async () => {
    try {
      console.log("[Backup] Running auto-backup...");

      // Create auto backup
      await createBackup("auto");

      // Cleanup old auto backups
      await cleanupOldBackups(settings.maxAutoBackups, "auto");

      // Check for daily backup
      const now = new Date();
      const lastDaily = settings.lastDailyBackup;
      const dayDiff = lastDaily
        ? (now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (dayDiff >= 1) {
        console.log("[Backup] Creating daily backup...");
        await createBackup("daily");
      }

      // Check for weekly backup
      const lastWeekly = settings.lastWeeklyBackup;
      const weekDiff = lastWeekly
        ? (now.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24 * 7)
        : 999;

      if (weekDiff >= 7) {
        console.log("[Backup] Creating weekly backup...");
        await createBackup("weekly");
      }

      console.log("[Backup] Auto-backup completed");
    } catch (e) {
      console.error("[Backup] Auto-backup failed:", e);
    }
  }, intervalMs);

  console.log(
    `[Backup] Auto-backup started (every ${settings.autoBackupIntervalMin} minutes)`,
  );
}

export function stopAutoBackup(): void {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
    backupIntervalId = null;
    console.log("[Backup] Auto-backup stopped");
  }
}

export async function backupOnShiftClose(): Promise<void> {
  const settings = await getBackupSettings();

  if (!settings || !settings.autoBackupEnabled) {
    return;
  }

  const now = new Date();

  // Create manual backup on shift close
  await createBackup("manual");

  // Check if daily backup is needed
  const lastDaily = settings.lastDailyBackup;
  const dayDiff = lastDaily
    ? (now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  if (dayDiff >= 1) {
    await createBackup("daily");
  }

  // Check if weekly backup is needed
  const lastWeekly = settings.lastWeeklyBackup;
  const weekDiff = lastWeekly
    ? (now.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24 * 7)
    : 999;

  if (weekDiff >= 7) {
    await createBackup("weekly");
  }

  // Cleanup old backups
  await cleanupOldBackups(settings.maxAutoBackups);
}
