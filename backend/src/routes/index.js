import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import contactRoutes from "./contactRoutes.js";
import membershipRoutes from "./membershipRoutes.js";
import memberRoutes from "./memberRoutes.js";
import adminRoutes from "./adminRoutes.js";
import { apiWriteLimiter } from "../middleware/rateLimits.js";

const router = Router();

router.get("/health", getHealth);
router.use("/contact", apiWriteLimiter, contactRoutes);
router.use("/membership", apiWriteLimiter, membershipRoutes);
router.use("/members", apiWriteLimiter, memberRoutes);
router.use("/admin", adminRoutes);

export default router;
