import { Router } from "express";
import { zavrsiPregled, getPregled } from "../controllers/Pregledcontroller.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";

const router = Router();

router.post("/:rezervacijaId/zavrsi", autentifikuj, autorizacija(["DOKTOR"]), zavrsiPregled);
router.get("/:rezervacijaId", autentifikuj, autorizacija(["DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"]), getPregled);

export default router;