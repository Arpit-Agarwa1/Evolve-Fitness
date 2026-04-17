import { Router } from "express";
import { adminLogin } from "../controllers/adminAuthController.js";
import {
  getAdminDashboard,
  listAdminMembers,
  listAdminContacts,
  listAdminLeads,
  patchAdminMember,
} from "../controllers/adminDataController.js";
import {
  listTrainersAdmin,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "../controllers/trainerController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { adminLoginLimiter } from "../middleware/rateLimits.js";
import { trainerImageUpload } from "../middleware/trainerUpload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

/** JSON trainer payloads skip multer (browser sends base64 — avoids multipart/proxy 502). */
function trainerImageOptional(req, res, next) {
  if (req.is("application/json")) {
    return next();
  }
  return trainerImageUpload.single("image")(req, res, next);
}

router.post("/login", adminLoginLimiter, asyncHandler(adminLogin));

router.use(requireAdminAuth);
router.get("/dashboard", asyncHandler(getAdminDashboard));
router.get("/members", asyncHandler(listAdminMembers));
/** POST alias: some proxies mis-handle PATCH; keep PATCH for API clients. */
router.post("/members/:id/active", asyncHandler(patchAdminMember));
router.patch("/members/:id", asyncHandler(patchAdminMember));
router.get("/contacts", asyncHandler(listAdminContacts));
router.get("/leads", asyncHandler(listAdminLeads));

router.get("/trainers", asyncHandler(listTrainersAdmin));
router.post("/trainers", trainerImageOptional, asyncHandler(createTrainer));
router.patch("/trainers/:id", trainerImageOptional, asyncHandler(updateTrainer));
router.delete("/trainers/:id", asyncHandler(deleteTrainer));

export default router;
