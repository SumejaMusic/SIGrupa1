import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { podnosenjeZahtjeva, dohvatiStatusZahtjevaHandler } from "../controllers/deactivationController.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { body, validationResult } from "express-validator";

const router = Router();

const validateProfileUpdate = [
    body("ime").optional().isString().trim().notEmpty().withMessage("Ime ne može biti prazno"),
    body("prezime").optional().isString().trim().notEmpty().withMessage("Prezime ne može biti prazno"),
    body("brojTelefona").optional({ nullable: true }).isString().trim(),
    body("datumRodjenja").optional().isISO8601().withMessage("Nevalidan format datuma"),
    body("alergije").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }).withMessage("Alergije mogu imati najviše 1000 karaktera"),
    body("hronicneBolesti").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }).withMessage("Hronične bolesti mogu imati najviše 1000 karaktera"),
    body("krvnaGrupa").optional({ nullable: true, checkFalsy: true }).isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).withMessage("Nevalidna krvna grupa"),
    body("doniraKrv").optional().isBoolean().withMessage("Polje doniraKrv mora biti boolean"),
    body("imaoOperacije").optional().isBoolean().withMessage("Polje imaoOperacije mora biti boolean"),
    body("operacijeOpis").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }).withMessage("Opis operacija može imati najviše 1000 karaktera"),
    (req: any, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

router.get("/:id/profile", autentifikuj, getProfile);
router.patch("/:id/profile", autentifikuj, validateProfileUpdate, updateProfile);

// ── Deaktivacija naloga ──────────────────────────────────────
router.post("/:id/deactivation-request", autentifikuj, podnosenjeZahtjeva);
router.get("/:id/deactivation-request", autentifikuj, dohvatiStatusZahtjevaHandler);

export default router;
