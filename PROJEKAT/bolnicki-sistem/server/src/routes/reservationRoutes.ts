import { Router } from "express";
import {
  kreirajRezervaciju,
  getRezervacijeZaPacijenta,
  getRezervacijeZaDoktora,
  otkaziRezervacijuPacijent,
  otkaziRezervacijuOsoblje,
  dodajKomentar,
  promijeniTrajanje,
} from "../controllers/reservationController.js";

const router = Router();

// POST /api/rezervacije
// US-06, US-07 — Kreiranje rezervacije
// Body: { terminId, doktorId, pacijentId, komentar?, hitnost?, tipPregledaId }
router.post("/", kreirajRezervaciju);

// GET /api/rezervacije/pacijent/:pacijentId
// US-05 — Sve rezervacije konkretnog pacijenta
router.get("/pacijent/:pacijentId", getRezervacijeZaPacijenta);

// GET /api/rezervacije/doktor/:doktorId
// US-05 — Sve rezervacije konkretnog doktora
router.get("/doktor/:doktorId", getRezervacijeZaDoktora);

// PATCH /api/rezervacije/:id/otkazi/pacijent
// US-10 — Otkazivanje od strane pacijenta (zabrana < 24h)
router.patch("/:id/otkazi/pacijent", otkaziRezervacijuPacijent);

// PATCH /api/rezervacije/:id/otkazi/osoblje
// US-09 — Otkazivanje od strane osoblja (bez vremenskog ograničenja)
router.patch("/:id/otkazi/osoblje", otkaziRezervacijuOsoblje);

// PATCH /api/rezervacije/:id/komentar
// US-22 — Dodavanje komentara
// Body: { komentar: string }
router.patch("/:id/komentar", dodajKomentar);

// PATCH /api/rezervacije/:id/trajanje
// US-15 — Promjena trajanja termina
// Body: { novaTrajanje: number }
router.patch("/:id/trajanje", promijeniTrajanje);

export default router;