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
