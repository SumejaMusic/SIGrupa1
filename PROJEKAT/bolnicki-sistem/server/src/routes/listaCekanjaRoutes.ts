import { Router } from "express";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";
import {
  prijavaNaListu,
  potvrdiTermin,
  odbijTermin,
  otkazivanjeIzListe,
  mojaListaCekanja,
  pregledPotvrde,
} from "../controllers/listaCekanjaController.js";


const router = Router();

router.post("/", autentifikuj, autorizacija(["PACIJENT"]), prijavaNaListu);
router.get("/moja", autentifikuj, autorizacija(["PACIJENT"]), mojaListaCekanja);
router.post("/:id/potvrdi", autentifikuj, autorizacija(["PACIJENT"]), potvrdiTermin);
router.post("/:id/odbij", autentifikuj, autorizacija(["PACIJENT"]), odbijTermin);
router.delete("/:id", autentifikuj, autorizacija(["PACIJENT"]), otkazivanjeIzListe);
router.get("/:id/pregled-potvrde", autentifikuj, autorizacija(["PACIJENT"]), pregledPotvrde);
export default router;