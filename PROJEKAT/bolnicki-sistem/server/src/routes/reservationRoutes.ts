import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import {
  upload,
  kreirajRezervaciju,
  getRezervacijeZaPacijenta,
  getRezervacijeZaDoktora,
  otkaziRezervacijuPacijent,
  otkaziRezervacijuOsoblje,
  dodajKomentar,
  promijeniTrajanje,
  getKomentari,
  kreirajRezervacijuDoktor
} from "../controllers/reservationController.js";

const router = Router();

router.post("/doktor", autentifikuj, autorizacija(["DOKTOR"]), upload.single("pdf"), kreirajRezervacijuDoktor);
router.post("/", autentifikuj, autorizacija(["PACIJENT", "DOKTOR", "ADMINISTRATOR"]), upload.single("pdf"), kreirajRezervaciju);
router.get("/moje", autentifikuj, autorizacija(["PACIJENT", "ADMINISTRATOR"]), getRezervacijeZaPacijenta);
router.get("/:id/komentari", autentifikuj, autorizacija(["PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"]), getKomentari);
router.get("/doktor/:doktorId", autentifikuj, autorizacija(["DOKTOR", "ADMINISTRATOR"]), getRezervacijeZaDoktora);
router.patch("/:id/otkazi/pacijent", autentifikuj, autorizacija(["PACIJENT", "ADMINISTRATOR"]), otkaziRezervacijuPacijent);
router.patch("/:id/otkazi/osoblje", autentifikuj, autorizacija(["DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"]), otkaziRezervacijuOsoblje);
router.patch("/:id/komentar", autentifikuj, autorizacija(["PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"]), dodajKomentar);
router.patch("/:id/trajanje", autentifikuj, autorizacija(["DOKTOR", "ADMINISTRATOR"]), promijeniTrajanje);

export default router;
