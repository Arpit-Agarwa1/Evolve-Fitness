import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";
import {
  getBadmintonStatus,
  checkoutMemberTournament,
  verifyMemberTournamentPayment,
  checkoutOpenTournament,
  verifyOpenTournamentPayment,
  lookupOpenRegistration,
  checkoutOpenAmend,
  verifyOpenAmendPayment,
  lookupMemberRegistration,
  checkoutMemberAmend,
  verifyMemberAmendPayment,
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
  "/members/lookup",
  apiWriteLimiter,
  asyncHandler(lookupMemberRegistration)
);
router.post(
  "/members/amend/checkout",
  apiWriteLimiter,
  asyncHandler(checkoutMemberAmend)
);
router.post(
  "/members/amend/verify",
  apiWriteLimiter,
  asyncHandler(verifyMemberAmendPayment)
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
