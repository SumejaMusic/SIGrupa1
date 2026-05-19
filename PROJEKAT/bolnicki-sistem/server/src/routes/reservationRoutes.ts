import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizuj } from "../middleware/autorizacija.js";
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

router.post("/", autentifikuj, autorizuj("PACIJENT", "DOKTOR", "ADMINISTRATOR"), upload.single("pdf"), kreirajRezervaciju);
router.post("/doktor", autentifikuj, autorizuj("DOKTOR", "ADMINISTRATOR"), upload.single("pdf"), kreirajRezervacijuDoktor);
router.get("/moje", autentifikuj, autorizuj("PACIJENT", "ADMINISTRATOR"), getRezervacijeZaPacijenta);
router.get("/doktor/:doktorId", autentifikuj, autorizuj("DOKTOR", "ADMINISTRATOR"), getRezervacijeZaDoktora);
router.get("/:id/komentari", autentifikuj, autorizuj("DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getKomentari);
router.patch("/:id/otkazi/pacijent", autentifikuj, autorizuj("PACIJENT", "ADMINISTRATOR"), otkaziRezervacijuPacijent);
router.patch("/:id/otkazi/osoblje", autentifikuj, autorizuj("DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"), otkaziRezervacijuOsoblje);
router.patch("/:id/komentar", autentifikuj, autorizuj("DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), dodajKomentar);
router.patch("/:id/trajanje", autentifikuj, autorizuj("DOKTOR", "ADMINISTRATOR"), promijeniTrajanje);

export default router;