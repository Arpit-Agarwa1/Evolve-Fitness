import { Router } from "express";
import { adminLogin } from "../controllers/adminAuthController.js";
import {
  getAdminDashboard,
  listAdminMembers,
  listAdminContacts,
  listAdminLeads,
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

const router = Router();

/** JSON trainer payloads skip multer (browser sends base64 — avoids multipart/proxy 502). */
function trainerImageOptional(req, res, next) {
  if (req.is("application/json")) {
    return next();
  }
  return trainerImageUpload.single("image")(req, res, next);
}

router.post("/login", adminLoginLimiter, adminLogin);

router.use(requireAdminAuth);
router.get("/dashboard", getAdminDashboard);
router.get("/members", listAdminMembers);
router.get("/contacts", listAdminContacts);
router.get("/leads", listAdminLeads);

router.get("/trainers", listTrainersAdmin);
router.post("/trainers", trainerImageOptional, createTrainer);
router.patch("/trainers/:id", trainerImageOptional, updateTrainer);
router.delete("/trainers/:id", deleteTrainer);

export default router;
