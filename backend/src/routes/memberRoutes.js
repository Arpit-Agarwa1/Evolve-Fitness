import { Router } from "express";
import { registerMember } from "../controllers/memberController.js";

const router = Router();

router.post("/register", registerMember);

export default router;
