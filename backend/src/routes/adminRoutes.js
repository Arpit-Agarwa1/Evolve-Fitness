import { Router } from "express";
import { adminLogin } from "../controllers/adminAuthController.js";
import {
  getAdminDashboard,
  listAdminContacts,
  listAdminLeads,
} from "../controllers/adminDataController.js";
import {
  listAdminMembers,
  getAdminMember,
  createAdminMember,
  updateAdminMember,
  deleteAdminMember,
} from "../controllers/adminMemberController.js";
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
router.post("/members", asyncHandler(createAdminMember));
router.get("/members/:id", asyncHandler(getAdminMember));
router.patch("/members/:id", asyncHandler(updateAdminMember));
router.delete("/members/:id", asyncHandler(deleteAdminMember));
router.post("/members/:id/manage", asyncHandler(updateAdminMember));
router.post("/members/:id/active", asyncHandler(updateAdminMember));
router.post("/members/:id/membership", asyncHandler(updateAdminMember));

router.get("/contacts", asyncHandler(listAdminContacts));
router.get("/leads", asyncHandler(listAdminLeads));

router.get("/trainers", asyncHandler(listTrainersAdmin));
router.post("/trainers", trainerImageOptional, asyncHandler(createTrainer));
router.patch("/trainers/:id", trainerImageOptional, asyncHandler(updateTrainer));
router.delete("/trainers/:id", asyncHandler(deleteTrainer));

export default router;
