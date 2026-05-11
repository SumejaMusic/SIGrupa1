import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { registrujSe, prijavi, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ poruka: errors.array()[0].msg });
    return;
  }
  next();
};

router.post("/registracija", registrujSe);
router.post("/prijava", prijavi);

router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .withMessage("Unesite validnu email adresu.")
      .normalizeEmail(),
  ],
  validate,
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token je obavezan."),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Lozinka mora imati najmanje 8 karaktera."),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Lozinke se ne podudaraju.");
        }
        return true;
      }),
  ],
  validate,
  resetPassword
);

export default router;
