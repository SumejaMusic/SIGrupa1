import { Router } from "express";
import {
  getSviTipoviPregleda,
  getTipPregledaById,
} from "../controllers/tipPregledaController.js";

const router = Router();

// GET /api/tippregleda
router.get("/", getSviTipoviPregleda);

// GET /api/tippregleda/:id
router.get("/:id", getTipPregledaById);

export default router;
