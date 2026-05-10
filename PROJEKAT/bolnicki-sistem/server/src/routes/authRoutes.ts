import { Router } from "express";
import { body } from "express-validator";
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

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
