import { Router } from "express";
import { registrujSe, prijavi } from "../controllers/authController.js";

const router = Router();

router.post("/registracija", registrujSe);
router.post("/prijava", prijavi);

export default router;