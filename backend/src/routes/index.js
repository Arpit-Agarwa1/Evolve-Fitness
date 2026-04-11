import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import contactRoutes from "./contactRoutes.js";
import membershipRoutes from "./membershipRoutes.js";
import memberRoutes from "./memberRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/contact", contactRoutes);
router.use("/membership", membershipRoutes);
router.use("/members", memberRoutes);

export default router;
