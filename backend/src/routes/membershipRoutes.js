import { Router } from "express";
import { createMembershipLead } from "../controllers/membershipController.js";

const router = Router();

router.post("/leads", createMembershipLead);

export default router;
