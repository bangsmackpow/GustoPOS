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
import adminLoginRouter from "./admin-login";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(ingredientsRouter);
router.use(drinksRouter);
router.use(tabsRouter);
router.use(shiftsRouter);
router.use(settingsRouter);
router.use(devLoginRouter());
router.use(adminLoginRouter());
// Optional: load admin-seed route at runtime to avoid bundling pg on CI/build
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
router.use(adminSeedRouter());

export default router;
