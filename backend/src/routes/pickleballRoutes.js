import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";
import {
  getPickleballStatus,
  checkoutPickleball,
  verifyPickleballPayment,
} from "../controllers/pickleballController.js";

const router = Router();

router.get("/status", asyncHandler(getPickleballStatus));
router.post("/checkout", apiWriteLimiter, asyncHandler(checkoutPickleball));
router.post("/verify", apiWriteLimiter, asyncHandler(verifyPickleballPayment));

export default router;
