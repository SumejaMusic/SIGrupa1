import { Router } from "express";
import { getNalaziZaPacijenta, getNalazPDF, getNalaziZaRezervaciju } from "../controllers/nalazController.js";

const router = Router();

router.get("/pacijent/:pacijentId", getNalaziZaPacijenta);
router.get("/rezervacija/:rezervacijaId", getNalaziZaRezervaciju); // ← dodaj
router.get("/:id/pdf", getNalazPDF);

export default router;