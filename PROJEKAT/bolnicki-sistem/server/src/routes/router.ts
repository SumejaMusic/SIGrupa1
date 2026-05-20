import { Router } from "express";
import terminRoutes from "./terminRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import tipPregledaRoutes from "./tipPregledaRoutes.js";
import reservationRoutes from "./reservationRoutes.js";
import odjelRoutes from "./odjelRoutes.js";
import pregledRoutes from "./pregledRoutes.js";
import { getNalaziZaPacijenta, getNalazPDF, getNalaziZaRezervaciju } from "../controllers/nalazController.js";
import { getKomentari } from "../controllers/reservationController.js"; // ← dodaj
import { getSviPacijenti, getHistorijaPacijenta } from "../controllers/patientController.js";
import authRoutes from "./authRoutes.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizuj } from "../middleware/autorizacija.js";

const router = Router();

router.use("/termini", terminRoutes);
router.use("/doktori", doctorRoutes);
router.use("/tippregleda", tipPregledaRoutes);
router.use("/rezervacije", reservationRoutes);
router.use("/odjeli", odjelRoutes);
router.use("/auth", authRoutes);
router.use("/pregledi", pregledRoutes); 

router.get("/nalazi/pacijent/:pacijentId", autentifikuj, autorizuj("PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getNalaziZaPacijenta);
router.get("/nalazi/rezervacija/:rezervacijaId", autentifikuj, autorizuj("PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getNalaziZaRezervaciju);
router.get("/nalazi/:id/pdf", autentifikuj, autorizuj("PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"), getNalazPDF);

// Pacijent rute
router.get("/pacijenti", autentifikuj, autorizuj("DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"), getSviPacijenti);
router.get("/historija/pacijent/:pacijentId", autentifikuj, autorizuj("DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"), getHistorijaPacijenta); // ← za historiju dolazaka

export default router;
