import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
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
  getIzuzeci,
  createIzuzetak,
  deleteIzuzetak,
  osvjeziTermine,
  getSviTermini,
  getAdminOdjeli,
  createAdminOdjel,
  deleteAdminOdjel,
  premjestiDoktoraUOdjel,
  ukloniDoktoraIzOdjela,
  getAnalitika,
  getSviOsobljeListа,
  getRasporediOsoblja,
  createRasporedOsoblja,
  updateRasporedOsoblja,
  deleteRasporedOsoblja,
} from "../controllers/adminController.js";

const router = Router();

router.use(autentifikuj);
router.use(autorizacija(["ADMINISTRATOR"]));

// ── Korisnici ────────────────────────────────────────────────
router.get("/korisnici", getSviKorisnici);
router.get("/korisnici/:id", getKorisnikById);
router.put("/korisnici/:id", updateKorisnik);
router.delete("/korisnici/:id", deleteKorisnik);
router.patch("/korisnici/:id/uloga", promijeniUlogu);
router.patch("/korisnici/:id/blokiraj", blokirajNalog);
router.patch("/korisnici/:id/odblokiraj", odblokirajNalog);

// ── Raspored doktora (tjedni šabloni) ────────────────────────
router.get("/rasporedi", getRasporedi);
router.post("/rasporedi", createRaspored);
router.put("/rasporedi/:id", updateRaspored);
router.delete("/rasporedi/:id", deleteRaspored);

// ── Izuzeci (date-specific overrides) ────────────────────────
router.get("/izuzeci", getIzuzeci);
router.post("/izuzeci", createIzuzetak);
router.delete("/izuzeci/:id", deleteIzuzetak);

// ── Osvježi termine za naredna 2 mjeseca ─────────────────────
router.post("/osvjezi-termine", osvjeziTermine);

// ── Termini ──────────────────────────────────────────────────
router.get("/termini", getSviTermini);

// ── Odjeli ───────────────────────────────────────────────────
router.get("/odjeli", getAdminOdjeli);
router.post("/odjeli", createAdminOdjel);
router.delete("/odjeli/:id", deleteAdminOdjel);
router.patch("/odjeli/:id/doktori/:idDoktora", premjestiDoktoraUOdjel);
router.delete("/odjeli/:id/doktori/:idDoktora", ukloniDoktoraIzOdjela);

// ── Analitika ─────────────────────────────────────────────────
router.get("/analitika", getAnalitika);

// ── Raspored osoblja ──────────────────────────────────────────
router.get("/osoblje-lista", getSviOsobljeListа);
router.get("/rasporedi-osoblja", getRasporediOsoblja);
router.post("/rasporedi-osoblja", createRasporedOsoblja);
router.put("/rasporedi-osoblja/:id", updateRasporedOsoblja);
router.delete("/rasporedi-osoblja/:id", deleteRasporedOsoblja);

export default router;