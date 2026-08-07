import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";
import {
  getBadmintonStatus,
  checkoutOpenTournament,
  verifyOpenTournamentPayment,
  lookupOpenRegistration,
  checkoutOpenAmend,
  verifyOpenAmendPayment,
} from "../controllers/badmintonController.js";

const router = Router();

router.get("/status", asyncHandler(getBadmintonStatus));

router.post(
  "/open/checkout",
  apiWriteLimiter,
  asyncHandler(checkoutOpenTournament)
);
router.post(
  "/open/verify",
  apiWriteLimiter,
  asyncHandler(verifyOpenTournamentPayment)
);
router.post(
  "/open/lookup",
  apiWriteLimiter,
  asyncHandler(lookupOpenRegistration)
);
router.post(
  "/open/amend/checkout",
  apiWriteLimiter,
  asyncHandler(checkoutOpenAmend)
);
router.post(
  "/open/amend/verify",
  apiWriteLimiter,
  asyncHandler(verifyOpenAmendPayment)
);

export default router;
