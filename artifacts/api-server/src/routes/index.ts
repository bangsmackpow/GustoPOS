import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import ingredientsRouter from "./ingredients";
import inventoryRouter from "./inventory";
import inventoryAuditsRouter from "./inventory-audits";
import auditSessionsRouter from "./audit-sessions";
import drinksRouter from "./drinks";
import tabsRouter from "./tabs";
import shiftsRouter from "./shifts";
import settingsRouter from "./settings";
import pinLoginRouter from "./pin-login";
import adminLoginRouter from "./admin-login";
import bulkImportRouter from "./bulk-import";
import adminRouter from "./admin";
import rushesRouter from "./rushes";
import auditLogsRouter from "./audit-logs";
import promoCodesRouter from "./promo-codes";
import analyticsRouter from "./analytics";
import taxRatesRouter from "./tax-rates";
import staffShiftsRouter from "./staff-shifts";
import staffPerformanceRouter from "./staff-performance";
import periodsRouter from "./periods";
import exportRouter from "./export";
import specialsRouter from "./specials";
import { requireRole } from "../middlewares/authMiddleware";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
// Public login routes (must be before /admin prefixed routes)
router.use(pinLoginRouter());
router.use(adminLoginRouter());
// Admin-only routes
router.use("/users", requireRole("admin"), usersRouter);
router.use("/admin", requireRole("admin"), bulkImportRouter);
router.use("/admin", requireRole("admin"), adminRouter);
router.use("/settings", settingsRouter); // Read is open, write is guarded in route
// Bartender-accessible routes
router.use(ingredientsRouter);
router.use("/inventory/audit-sessions", auditSessionsRouter);
router.use("/inventory", inventoryRouter);
router.use("/inventory-audits", inventoryAuditsRouter);
router.use(drinksRouter);
router.use(tabsRouter);
router.use(shiftsRouter);
router.use(rushesRouter);
router.use(promoCodesRouter);
router.use(analyticsRouter);
router.use("/tax-rates", taxRatesRouter);
router.use("/staff-shifts", staffShiftsRouter);
router.use("/staff-performance", staffPerformanceRouter);
router.use("/periods", periodsRouter);
router.use("/export", requireRole("admin"), exportRouter);
router.use("/specials", specialsRouter);
router.use("/audit-logs", requireRole("admin"), auditLogsRouter);
(async () => {
  if ((process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true") {
    try {
      const mod = await import("./admin-seed");
      router.use(mod.default());
    } catch (e) {
      console.warn("admin-seed failed to load:", e);
    }
  }
})();

export default router;
