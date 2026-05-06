// routes/nalazRoutes.ts

import { Router } from "express";
import { getNalaziZaPacijenta, getNalazPDF } from "../controllers/nalazController.js";

const router = Router();

router.get("/pacijent/:pacijentId", getNalaziZaPacijenta);
router.get("/:id/pdf", getNalazPDF);

export default router;