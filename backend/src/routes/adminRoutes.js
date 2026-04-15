import { Router } from "express";
import { adminLogin } from "../controllers/adminAuthController.js";
import {
  getAdminDashboard,
  listAdminMembers,
  listAdminContacts,
  listAdminLeads,
} from "../controllers/adminDataController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { adminLoginLimiter } from "../middleware/rateLimits.js";

const router = Router();

router.post("/login", adminLoginLimiter, adminLogin);

router.use(requireAdminAuth);
router.get("/dashboard", getAdminDashboard);
router.get("/members", listAdminMembers);
router.get("/contacts", listAdminContacts);
router.get("/leads", listAdminLeads);

export default router;
