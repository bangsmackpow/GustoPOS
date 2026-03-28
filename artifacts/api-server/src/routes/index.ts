import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import ingredientsRouter from "./ingredients";
import drinksRouter from "./drinks";
import tabsRouter from "./tabs";
import shiftsRouter from "./shifts";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(ingredientsRouter);
router.use(drinksRouter);
router.use(tabsRouter);
router.use(shiftsRouter);
router.use(settingsRouter);

export default router;
