import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { getKorisniciPoUlogama, getTerminiStats, exportStatistikaCSV } from "../controllers/vlasnikController.js";
import { getAnalitika } from "../controllers/adminController.js";

const router = Router();

router.use(autentifikuj, autorizacija(["VLASNIK", "ADMINISTRATOR"]));
router.get("/korisnici-po-ulogama", getKorisniciPoUlogama);
router.get("/termini-stats", getTerminiStats);
router.get("/export-csv", exportStatistikaCSV);
router.get("/analitika", getAnalitika);

export default router;