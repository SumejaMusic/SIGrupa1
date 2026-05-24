import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import {
  getJavniPozivZaRecenziju,
  kreirajJavnuRecenziju,
  kreirajRecenziju,
} from "../controllers/recenzijaController.js";

const router = Router();

router.get("/review/:token", getJavniPozivZaRecenziju);
router.post("/review/:token", kreirajJavnuRecenziju);
router.post("/:id/review", autentifikuj, autorizacija(["PACIJENT"]), kreirajRecenziju);

export default router;
