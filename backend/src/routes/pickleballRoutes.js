import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";
import {
  getPickleballStatus,
  checkoutPickleball,
  verifyPickleballPayment,
  lookupPickleballRegistration,
  checkoutPickleballAmend,
  verifyPickleballAmendPayment,
} from "../controllers/pickleballController.js";

const router = Router();

router.get("/status", asyncHandler(getPickleballStatus));
router.post("/checkout", apiWriteLimiter, asyncHandler(checkoutPickleball));
router.post("/verify", apiWriteLimiter, asyncHandler(verifyPickleballPayment));
router.post(
  "/lookup",
  apiWriteLimiter,
  asyncHandler(lookupPickleballRegistration)
);
router.post(
  "/amend/checkout",
  apiWriteLimiter,
  asyncHandler(checkoutPickleballAmend)
);
router.post(
  "/amend/verify",
  apiWriteLimiter,
  asyncHandler(verifyPickleballAmendPayment)
);

export default router;
