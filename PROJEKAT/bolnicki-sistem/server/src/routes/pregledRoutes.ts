import { Router } from "express";
import { zavrsiPregled, getPregled } from "../controllers/pregledController.js";

const router = Router();

router.post("/:rezervacijaId/zavrsi", zavrsiPregled);
router.get("/:rezervacijaId", getPregled);

export default router;