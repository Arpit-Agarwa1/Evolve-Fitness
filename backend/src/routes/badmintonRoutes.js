import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";
import {
  getBadmintonStatus,
  checkoutMemberTournament,
  verifyMemberTournamentPayment,
  checkoutOpenTournament,
  verifyOpenTournamentPayment,
} from "../controllers/badmintonController.js";

const router = Router();

router.get("/status", asyncHandler(getBadmintonStatus));
router.post(
  "/members/checkout",
  apiWriteLimiter,
  asyncHandler(checkoutMemberTournament)
);
router.post(
  "/members/verify",
  apiWriteLimiter,
  asyncHandler(verifyMemberTournamentPayment)
);
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

export default router;
