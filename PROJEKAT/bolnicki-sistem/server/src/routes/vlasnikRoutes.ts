import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import {
  getKorisniciPoUlogama,
  getTerminiStats,
  exportTerminiCSV,
} from "../controllers/vlasnikController.js";

const router = Router();

router.use(autentifikuj, autorizacija(["VLASNIK", "ADMINISTRATOR"]));
router.get("/korisnici-po-ulogama", getKorisniciPoUlogama);
router.get("/termini-stats", getTerminiStats);
router.get("/export-csv", exportTerminiCSV);

export default router;