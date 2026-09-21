import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma.js";
import {
  getLoginForm,
  getRegisterForm,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/authController.js";
import { ensureAuthenticated } from "../middleware/auth.js";

const authRouter = Router();

const registrationValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("An account with that email already exists.");
      }

      return true;
    }),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters."),

  body("confirmPassword").custom((confirmPassword, { req }) => {
    if (confirmPassword !== req.body.password) {
      throw new Error("Passwords must match.");
    }

    return true;
  }),
];

authRouter.get("/register", getRegisterForm);
authRouter.post("/register", registrationValidation, registerUser);

authRouter.get("/login", getLoginForm);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);

authRouter.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user });
});

export { authRouter };
