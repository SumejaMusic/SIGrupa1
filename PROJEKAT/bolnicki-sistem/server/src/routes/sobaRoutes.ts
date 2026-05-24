import { Router } from "express";
import { getZauzetostSoba } from "../controllers/sobaController.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";

const router = Router();

router.get(
  "/occupancy",
  autentifikuj,
  autorizacija(["MEDICINSKO_OSOBLJE"]),
  getZauzetostSoba,
);

export default router;
