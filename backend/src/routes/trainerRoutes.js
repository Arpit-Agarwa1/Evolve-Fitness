import { Router } from "express";
import { listTrainersPublic } from "../controllers/trainerController.js";

const router = Router();

router.get("/", listTrainersPublic);

export default router;
