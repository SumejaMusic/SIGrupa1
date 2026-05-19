import { Router } from "express";
import { getNalaziZaPacijenta, getNalazPDF, getNalaziZaRezervaciju } from "../controllers/nalazController.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizuj } from "../middleware/autorizacija.js";

const router = Router();

router.get( "/pacijent/:pacijentId",autentifikuj, autorizuj("PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getNalaziZaPacijenta);
router.get("/rezervacija/:rezervacijaId", autentifikuj, autorizuj("PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getNalaziZaRezervaciju); // ← dodaj
router.get("/:id/pdf", autentifikuj, autorizuj("PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getNalazPDF);

export default router;