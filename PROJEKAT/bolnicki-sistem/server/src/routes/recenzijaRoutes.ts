import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { sakrijRecenziju } from "../controllers/recenzijaController.js";

const router = Router();

router.patch("/:id/hide", autentifikuj, autorizacija(["ADMINISTRATOR", "VLASNIK"]), sakrijRecenziju);

export default router;
