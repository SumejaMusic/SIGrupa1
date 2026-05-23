import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { sakrijReview } from "../controllers/reviewController.js";

const router = Router();

router.patch("/:id/hide", autentifikuj, autorizacija(["ADMINISTRATOR", "VLASNIK"]), sakrijReview);

export default router;
