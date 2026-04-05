import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import ingredientsRouter from "./ingredients";
import drinksRouter from "./drinks";
import tabsRouter from "./tabs";
import shiftsRouter from "./shifts";
import settingsRouter from "./settings";
import devLoginRouter from "./dev-login";
import pinLoginRouter from "./pin-login";
import adminLoginRouter from "./admin-login";
import bulkImportRouter from "./bulk-import";
import rushesRouter from "./rushes";
import inventoryRouter from "./inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(ingredientsRouter);
router.use(drinksRouter);
router.use(tabsRouter);
router.use(shiftsRouter);
router.use(settingsRouter);
router.use("/admin", bulkImportRouter);
router.use(rushesRouter);
router.use("/api/inventory", inventoryRouter);
router.use(devLoginRouter());
router.use(pinLoginRouter());
router.use(adminLoginRouter());
(async () => {
  // Optional: load admin-seed route at runtime to avoid bundling pg on CI/build
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
