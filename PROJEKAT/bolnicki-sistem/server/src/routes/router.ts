import { Router } from "express";
import terminRoutes from "./terminRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import tipPregledaRoutes from "./tipPregledaRoutes.js";
import reservationRoutes from "./reservationRoutes.js";
import odjelRoutes from "./odjelRoutes.js";
import { getNalaziZaPacijenta, getNalazPDF, getNalaziZaRezervaciju } from "../controllers/nalazController.js";
import { getKomentari } from "../controllers/reservationController.js"; // ← dodaj
import { getSviPacijenti, getHistorijaPacijenta } from "../controllers/patientController.js";
import authRoutes from "./authRoutes.js";

const router = Router();

router.use("/termini", terminRoutes);
router.use("/doktori", doctorRoutes);
router.use("/tippregleda", tipPregledaRoutes);
router.use("/rezervacije", reservationRoutes);
router.use("/odjeli", odjelRoutes);

// Nalazi rute — redoslijed je bitan!
router.get("/nalazi/rezervacija/:rezervacijaId", getNalaziZaRezervaciju);
router.get("/nalazi/pacijent/:pacijentId", getNalaziZaPacijenta);
router.get("/nalazi/:id/pdf", getNalazPDF);

// Pacijent rute
router.get("/pacijenti", getSviPacijenti);
router.get("/historija/pacijent/:pacijentId", getHistorijaPacijenta); // ← za historiju dolazaka
export default router;
router.use("/auth", authRoutes);