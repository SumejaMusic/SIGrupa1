import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { getKorisniciPoUlogama, getTerminiStats, exportStatistikaCSV, getSaleOccupancy, sakrijiRecenziju, getRecenzije } from "../controllers/vlasnikController.js";
import { getAnalitika } from "../controllers/adminController.js";
import { getTerminiDetalji } from "../controllers/vlasnikController.js";
const router = Router();

router.use(autentifikuj, autorizacija(["VLASNIK", "ADMINISTRATOR"]));
router.get("/korisnici-po-ulogama", getKorisniciPoUlogama);
router.get("/termini-stats", getTerminiStats);
router.get("/export-csv", exportStatistikaCSV);
router.get("/analitika", getAnalitika);
router.get("/termini-detalji", getTerminiDetalji);
router.get("/sale-occupancy", getSaleOccupancy);
router.get("/recenzije", getRecenzije);
router.patch("/recenzije/:id/sakrij", sakrijiRecenziju);
export default router;