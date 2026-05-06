import { Router } from "express";
import terminRoutes from "./terminRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import tipPregledaRoutes from "./tipPregledaRoutes.js";
//import patientRoutes from "./patientRoutes.js"; za kasnije
import reservationRoutes from "./reservationRoutes.js";
import odjelRoutes from "./odjelRoutes.js";
import nalazRoutes from "./nalazRoutes.js"; // ← DODAJ
const router = Router();

//moguce je sve prevesti na engleski
router.use("/termini", terminRoutes);
router.use("/doktori", doctorRoutes);
router.use("/tippregleda", tipPregledaRoutes);
//router.use("/pacijenti", patientRoutes); za kasnije
router.use("/rezervacije", reservationRoutes);
router.use("/odjeli", odjelRoutes);
router.use("/nalazi", nalazRoutes);
export default router;