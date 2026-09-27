import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patternpilotRouter from "./patternpilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patternpilotRouter);

export default router;
