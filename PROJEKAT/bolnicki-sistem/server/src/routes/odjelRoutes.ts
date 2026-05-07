import { Router } from "express";
import { getOdjeli } from "../controllers/odjelController.js";

const router = Router();

// GET /api/odjeli
router.get("/", getOdjeli);

export default router;