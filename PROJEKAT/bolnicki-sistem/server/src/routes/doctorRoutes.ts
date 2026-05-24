import { Router } from "express";
import {
  getSviDoktori,
  getDoktorById,
  getRasporedDoktora,
} from "../controllers/doctorController.js";
import { getRecenzijeZaDoktora } from "../controllers/recenzijaController.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { dodajKomentarDoktor } from "../controllers/reservationController.js";

const router = Router();

// GET /api/doktori?specijalizacija=&odjelId=
// US-05 — Pregled svih dostupnih doktora
router.get("/", getSviDoktori);

// GET /api/doktori/:id
// US-05 — Detalji jednog doktora
router.get("/:id", getDoktorById);

// GET /api/doktori/:id/raspored
// US-05, US-06 — Raspored doktora po danima (samo aktivni)
router.get("/:id/raspored", getRasporedDoktora);
router.get("/:id/reviews", autentifikuj, autorizacija(["DOKTOR", "ADMINISTRATOR", "VLASNIK"]), getRecenzijeZaDoktora);
router.post("/rezervacije/:id/komentar", autentifikuj, autorizacija(["DOKTOR"]), dodajKomentarDoktor);

export default router;
