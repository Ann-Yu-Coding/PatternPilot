import { Router, type IRouter } from "express";
import waitlistRouter from "./waitlist";
import healthRouter from "./health";
import patternpilotRouter from "./patternpilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(waitlistRouter);
router.use(patternpilotRouter);

export default router;
