import { Router } from "express";
import { registrujSe } from "../controllers/authController.js";

const router = Router();

router.post("/registracija", registrujSe);

export default router;