import { Router } from "express";
import { zavrsiPregled, getPregled } from "../controllers/Pregledcontroller.js";
import { autentifikuj } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/:rezervacijaId/zavrsi", autentifikuj, zavrsiPregled);
router.get("/:rezervacijaId", autentifikuj, getPregled);

export default router;