import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
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
} from "../controllers/reservationController.js";

const router = Router();

router.post("/", autentifikuj, upload.single("pdf"), kreirajRezervaciju);
router.get("/moje", autentifikuj, getRezervacijeZaPacijenta);
router.get("/:id/komentari", autentifikuj, getKomentari);
router.get("/doktor/:doktorId", autentifikuj, getRezervacijeZaDoktora);
router.patch("/:id/otkazi/pacijent", autentifikuj, otkaziRezervacijuPacijent);
router.patch("/:id/otkazi/osoblje", autentifikuj, otkaziRezervacijuOsoblje);
router.patch("/:id/komentar", autentifikuj, dodajKomentar);
router.patch("/:id/trajanje", autentifikuj, promijeniTrajanje);

export default router;