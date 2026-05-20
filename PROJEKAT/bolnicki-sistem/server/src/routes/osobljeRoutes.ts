// src/routes/osobljeRoutes.ts

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
  getAllPacijenti,
  getAllDoktori,
  getAllOdjeli,
  getAllSobe,
  getTipoviPregleda,
  getAllTermini,
  getSlobodniTerminiDoktora,
  getSlobodniDatumiDoktora,   // ← NOVO
} from "../controllers/OsobljeController.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
const router = Router();

const osobljeMW = [
  autentifikuj,
autorizacija(["MEDICINSKO_OSOBLJE", "DOKTOR"])];

// ─── Termini ─────────────────────────────────────────────────────────────────

router.get("/termini",          osobljeMW, getDnevniTermini);
router.get("/termini/svi",      osobljeMW, getAllTermini);
router.get("/termini/pretraga", osobljeMW, pretragaTermina);
router.get("/termini/otkazani", osobljeMW, getOtkazaniTermini);
router.get("/termini/hitni",    osobljeMW, getHitniTermini);
router.get("/termini/zavrseni", osobljeMW, getZavrseniPregledi);

// ⚠️ REDOSLIJED BITAN: slobodni-datumi MORA biti PRIJE slobodni/:idDoktor
// inače Express pročita "datumi" kao vrijednost :idDoktor parametra!
router.get("/termini/slobodni-datumi/:idDoktor", osobljeMW, getSlobodniDatumiDoktora); // ← NOVO
router.get("/termini/slobodni/:idDoktor",        osobljeMW, getSlobodniTerminiDoktora);

router.get("/termini/:id", osobljeMW, getDetaljiTermina);

router.post("/termini",              osobljeMW, kreirajTerminZaPacijenta);
router.patch("/termini/:id/otkazi",  osobljeMW, otkaziTermin);
router.patch("/termini/:id/hitnost", osobljeMW, postaviHitnost);

// ─── Dropdown liste ───────────────────────────────────────────────────────────

router.get("/pacijenti",       osobljeMW, getAllPacijenti);
router.get("/doktori",         osobljeMW, getAllDoktori);
router.get("/odjeli",          osobljeMW, getAllOdjeli);
router.get("/sobe",            osobljeMW, getAllSobe);
router.get("/tipovi-pregleda", osobljeMW, getTipoviPregleda);

// ─── Nalazi ───────────────────────────────────────────────────────────────────

//router.post("/nalazi/:idHistorije",          osobljeMW, dodajNalaz); bilo
// ✅ Specifičnije rute PRVO
router.get("/nalazi/pacijent/:idPacijenta", osobljeMW, getNalaziPacijenta);
router.get("/nalazi/:id/pdf",              osobljeMW, getNalazPDF);
router.post("/nalazi/:idRezervacije",      osobljeMW, dodajNalaz);
export default router;