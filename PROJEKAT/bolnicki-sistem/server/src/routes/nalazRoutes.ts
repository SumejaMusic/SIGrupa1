import { Router } from "express";
import { getNalaziZaPacijenta, getNalazPDF, getNalaziZaRezervaciju } from "../controllers/nalazController.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { autentifikuj } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/pacijent/:pacijentId", autentifikuj, autorizacija(["DOKTOR", "ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK", "PACIJENT"]), getNalaziZaPacijenta);
router.get("/rezervacija/:rezervacijaId", autentifikuj, autorizacija(["DOKTOR", "ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK", "PACIJENT"]), getNalaziZaRezervaciju);
router.get("/:id/pdf", autentifikuj, autorizacija(["DOKTOR", "ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK", "PACIJENT"]), getNalazPDF);

export default router;