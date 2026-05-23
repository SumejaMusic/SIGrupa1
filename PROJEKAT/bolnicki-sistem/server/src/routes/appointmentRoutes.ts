import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import { kreirajReview } from "../controllers/reviewController.js";

const router = Router();

router.post("/:id/review", autentifikuj, autorizacija(["PACIJENT"]), kreirajReview);

export default router;
