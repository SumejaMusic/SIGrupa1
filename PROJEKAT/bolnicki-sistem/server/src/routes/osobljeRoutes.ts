// src/routes/osobljeRoutes.ts
//
// Sve rute ovog panela zahtijevaju:
//   1. autentifikuj  — provjerava JWT token, postavlja (req as any).korisnik = { id, uloga }
//   2. autorizacija  — provjerava da uloga smije pristupiti ovim rutama
//
// Pristup imaju: MEDICINSKO_OSOBLJE, DOKTOR, ADMINISTRATOR
// Pacijenti su isključeni — direktno iz ACC kriterija (US-09, Panel osoblja).

import { Router } from "express";
import {
  getDnevniTermini,
  pretragaTermina,
  getDetaljiTermina,
  otkaziTermin,
  kreirajTerminZaPacijenta,
  dodajNalaz,
  getNalaziPacijenta,
  getNalazPDF,
  getOtkazaniTermini,
  getHitniTermini,
  getZavrseniPregledi,
  postaviHitnost,
  getAllPacijenti,   // ← DODAJ
  getAllDoktori,     // ← DODAJ
  getAllOdjeli,      // ← DODAJ
  getAllSobe,        // ← DODAJ
} from "../controllers/OsobljeController.js";
import { getAllTermini } from "../controllers/OsobljeController.js"; // dodaj u import
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija }  from "../middleware/Autorizacija.js";

const router = Router();

const osobljeMW = [
  autentifikuj,
  autorizacija(["MEDICINSKO_OSOBLJE", "DOKTOR", "ADMINISTRATOR"]),
];

// ─── Termini ─────────────────────────────────────────────────────────────────

// GET /api/osoblje/termini?datum=2026-05-17
router.get("/termini", osobljeMW, getDnevniTermini);


// GET /api/osoblje/termini/svi
router.get("/termini/svi", osobljeMW, getAllTermini);
// Statičke GET rute MORAJU biti prije /:id — inače Express tretira segment kao ID parametar

// GET /api/osoblje/termini/pretraga?ime=Amina
router.get("/termini/pretraga", osobljeMW, pretragaTermina);

// GET /api/osoblje/termini/otkazani?datum=2026-05-17
// datum je opcionalan — bez njega vraća sve otkazane (svi datumi)
router.get("/termini/otkazani", osobljeMW, getOtkazaniTermini);

// GET /api/osoblje/termini/hitni
// Vraća sve aktivne hitne rezervacije
router.get("/termini/hitni", osobljeMW, getHitniTermini);

// GET /api/osoblje/termini/zavrseni?idPacijenta=5
// idPacijenta je opcionalan
router.get("/termini/zavrseni", osobljeMW, getZavrseniPregledi);

// GET /api/osoblje/termini/:id
router.get("/termini/:id", osobljeMW, getDetaljiTermina);

// POST /api/osoblje/termini
// Body: { idDoktor, idPacijent, datum, vrijemeMinute, idTipPregleda?, komentar?, hitnost? }
router.post("/termini", osobljeMW, kreirajTerminZaPacijenta);
// ─── Dropdown liste za novi termin modal ─────────────────────────────────────

// GET /api/osoblje/pacijenti
router.get("/pacijenti", osobljeMW, getAllPacijenti);

// GET /api/osoblje/doktori
router.get("/doktori", osobljeMW, getAllDoktori);

// GET /api/osoblje/odjeli
router.get("/odjeli", osobljeMW, getAllOdjeli);

// GET /api/osoblje/sobe
router.get("/sobe", osobljeMW, getAllSobe);
// PATCH /api/osoblje/termini/:id/otkazi
// Body: { potvrda: true } — backend zahtijeva eksplicitnu potvrdu
router.patch("/termini/:id/otkazi", osobljeMW, otkaziTermin);

// PATCH /api/osoblje/termini/:id/hitnost
// Body: { hitnost: true | false } — naknadno postavljanje/uklanjanje hitnosti
router.patch("/termini/:id/hitnost", osobljeMW, postaviHitnost);

// ─── Nalazi ───────────────────────────────────────────────────────────────────

// POST /api/osoblje/nalazi/:idHistorije
// Body: { naziv, opis?, fajl (base64 string), mimeType }
router.post("/nalazi/:idHistorije", osobljeMW, dodajNalaz);

// GET /api/osoblje/nalazi/pacijent/:idPacijenta
// MORA biti prije /:id/pdf
router.get("/nalazi/pacijent/:idPacijenta", osobljeMW, getNalaziPacijenta);

// GET /api/osoblje/nalazi/:id/pdf
router.get("/nalazi/:id/pdf", osobljeMW, getNalazPDF);

export default router;