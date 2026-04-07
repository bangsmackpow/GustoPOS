import { Router, type IRouter, type Request, type Response } from "express";
import fs from "fs";
import { initializeDatabase } from "@workspace/db";

const router: IRouter = Router();

router.post("/reset-database", async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: err.message || "Failed to reset database" });
  }
});

export default router;
