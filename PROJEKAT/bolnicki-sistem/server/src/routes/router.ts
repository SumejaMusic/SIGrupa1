import { Router } from "express";
import terminRoutes from "./terminRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
//import patientRoutes from "./patientRoutes.js"; za kasnije
import reservationRoutes from "./reservationRoutes.js";

const router = Router();

//moguce je sve prevesti na engleski
router.use("/termini", terminRoutes);
router.use("/doktori", doctorRoutes);
//router.use("/pacijenti", patientRoutes); za kasnije
router.use("/rezervacije", reservationRoutes);

export default router;