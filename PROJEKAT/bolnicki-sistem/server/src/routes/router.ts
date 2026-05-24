import { Router } from "express";
import terminRoutes from "./terminRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import tipPregledaRoutes from "./tipPregledaRoutes.js";
import reservationRoutes from "./reservationRoutes.js";
import odjelRoutes from "./odjelRoutes.js";
import terminRecenzijaRoutes from "./terminRecenzijaRoutes.js";
import recenzijaRoutes from "./recenzijaRoutes.js";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import pregledRoutes from "./pregledRoutes.js";
import osobljeRoutes from "./osobljeRoutes.js";
import sobaRoutes from "./sobaRoutes.js";
import chatRoutes from "./chat.js";
import listaCekanjaRoutes from "./listaCekanjaRoutes.js";
import userRoutes from "./userRoutes.js";

import {
  getNalaziZaPacijenta,
  getNalazPDF,
  getNalaziZaRezervaciju,
} from "../controllers/nalazController.js";

import { getKomentari } from "../controllers/reservationController.js";
import {
  getSviPacijenti,
  getHistorijaPacijenta,
  getHronicniPacijenti,
  updateHronicniStatusPacijenta,
} from "../controllers/patientController.js";
import { getReminderLogoviZaPacijenta } from "../controllers/reminderController.js";

import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";

const router = Router();

router.use("/termini", terminRoutes);
router.use("/osoblje", osobljeRoutes);
router.use("/doktori", doctorRoutes);
router.use("/tippregleda", tipPregledaRoutes);
router.use("/rezervacije", reservationRoutes);
router.use("/appointments", terminRecenzijaRoutes);
router.use("/reviews", recenzijaRoutes);
router.use("/odjeli", odjelRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/pregledi", pregledRoutes);
router.use("/lista-cekanja", listaCekanjaRoutes);
router.use("/rooms", sobaRoutes);
router.use("/admin", adminRoutes);
router.use("/chat", chatRoutes);

router.get(
  "/nalazi/pacijent/:pacijentId",
  autentifikuj,
  autorizacija(["PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"]),
  getNalaziZaPacijenta
);

router.get(
  "/nalazi/rezervacija/:rezervacijaId",
  autentifikuj,
  autorizacija(["PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"]),
  getNalaziZaRezervaciju
);

router.get(
  "/nalazi/:id/pdf",
  autentifikuj,
  autorizacija(["PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR"]),
  getNalazPDF
);

router.get(
  "/pacijenti",
  autentifikuj,
  autorizacija(["DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"]),
  getSviPacijenti
);

router.get(
  "/pacijenti/hronicni",
  autentifikuj,
  autorizacija(["DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"]),
  getHronicniPacijenti
);

router.get(
  "/historija/pacijent/:pacijentId",
  autentifikuj,
  autorizacija(["DOKTOR", "MEDICINSKO_OSOBLJE", "ADMINISTRATOR", "VLASNIK"]),
  getHistorijaPacijenta
);

router.patch(
  "/pacijenti/:id/hronicni",
  autentifikuj,
  autorizacija(["DOKTOR", "ADMINISTRATOR"]),
  updateHronicniStatusPacijenta
);

router.get(
  "/reminder-logovi/pacijent/:pacijentId",
  autentifikuj,
  autorizacija(["ADMINISTRATOR", "DOKTOR", "VLASNIK"]),
  getReminderLogoviZaPacijenta
);

export default router;