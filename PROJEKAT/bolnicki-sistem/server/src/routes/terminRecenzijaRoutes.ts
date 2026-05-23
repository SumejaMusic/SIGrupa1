import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { kreirajRecenziju } from "../controllers/recenzijaController.js";

const router = Router();

router.post("/:id/review", autentifikuj, autorizacija(["PACIJENT"]), kreirajRecenziju);

export default router;
