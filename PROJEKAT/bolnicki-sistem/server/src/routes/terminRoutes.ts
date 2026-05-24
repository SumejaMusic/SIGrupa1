//routes folder definira sljedece
//Koja HTTP metoda (GET, POST, PATCH)
//Koja URL putanja (/api/termini/:id)
//Koji middleware se primjenjuje
//Koji controller funkcija se poziva




import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import {
  getSlobodniTermini,
  getTerminById,
  zaključajTermin,
  oslobodiTermin,
} from "../controllers/terminController.js";
import { autorizacija } from "../middleware/autorizacija.js";


const router = Router();
// GET /api/termini?doktorId=&datum=
// US-05 — Pregled slobodnih termina
router.get("/", getSlobodniTermini);
 
// GET /api/termini/:id
// US-05 — Detalji jednog termina
router.get("/:id", getTerminById);
 
// POST /api/termini/:id/zakljucaj
// US-12, NFR-22 — Buffer zona 2 minute
router.post("/:id/zakljucaj", autentifikuj, autorizacija(["PACIJENT", "DOKTOR", "ADMINISTRATOR"]), zaključajTermin);
 
// POST /api/termini/:id/oslobodi
// US-12 — Ručno oslobađanje termina
router.post("/:id/oslobodi", autentifikuj, autorizacija(["PACIJENT", "DOKTOR", "ADMINISTRATOR"]), oslobodiTermin);
 
export default router;
