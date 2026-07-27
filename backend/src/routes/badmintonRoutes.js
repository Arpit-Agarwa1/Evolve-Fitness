import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";
import {
  getBadmintonStatus,
  registerMemberTournament,
  checkoutOpenTournament,
  verifyOpenTournamentPayment,
} from "../controllers/badmintonController.js";

const router = Router();

router.get("/status", asyncHandler(getBadmintonStatus));
router.post(
  "/members/register",
  apiWriteLimiter,
  asyncHandler(registerMemberTournament)
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
