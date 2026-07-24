import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getBadmintonStatus,
  initiateBadmintonRegistration,
  verifyBadmintonPayment,
} from "../controllers/badmintonController.js";

const router = Router();

router.get("/status", asyncHandler(getBadmintonStatus));
router.post("/register/initiate", asyncHandler(initiateBadmintonRegistration));
router.post("/register/verify", asyncHandler(verifyBadmintonPayment));

export default router;
