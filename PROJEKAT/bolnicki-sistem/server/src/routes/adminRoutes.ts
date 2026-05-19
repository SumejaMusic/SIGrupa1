import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizuj } from "../middleware/autorizacija.js";
import {
  getSviKorisnici,
  getKorisnikById,
  updateKorisnik,
  deleteKorisnik,
  promijeniUlogu,
  blokirajNalog,
  odblokirajNalog,
  getRasporedi,
  createRaspored,
  updateRaspored,
  deleteRaspored,
  getSviTermini,
} from "../controllers/adminController.js";

const router = Router();

router.use(autentifikuj);
router.use(autorizuj("ADMINISTRATOR"));

// ── Korisnici ────────────────────────────────────────────────
router.get("/korisnici", getSviKorisnici);
router.get("/korisnici/:id", getKorisnikById);
router.put("/korisnici/:id", updateKorisnik);
router.delete("/korisnici/:id", deleteKorisnik);
router.patch("/korisnici/:id/uloga", promijeniUlogu);
router.patch("/korisnici/:id/blokiraj", blokirajNalog);
router.patch("/korisnici/:id/odblokiraj", odblokirajNalog);

// ── Raspored doktora ─────────────────────────────────────────
router.get("/rasporedi", getRasporedi);
router.post("/rasporedi", createRaspored);
router.put("/rasporedi/:id", updateRaspored);
router.delete("/rasporedi/:id", deleteRaspored);

// ── Termini ──────────────────────────────────────────────────
router.get("/termini", getSviTermini);

export default router;