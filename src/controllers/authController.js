import passport from "passport";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";

function getRegisterForm(req, res) {
  res.render("register", {
    errors: [],
    values: {
      email: "",
    },
  });
}

async function registerUser(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).render("register", {
      errors: errors.array(),
      values: {
        email: req.body.email,
      },
    });
  }

  try {
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return res.status(201).render("registered", { user });
  } catch (error) {
    return next(error);
  }
}

function getLoginForm(req, res) {
  res.render("login", {
    error: null,
    values: {
      email: "",
    },
  });
}

function loginUser(req, res, next) {
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).render("login", {
        error: info?.message || "Login failed.",
        values: {
          email: req.body.email,
        },
      });
    }

    return req.logIn(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }

      return res.redirect("/dashboard");
    });
  })(req, res, next);
}

function logoutUser(req, res, next) {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    return res.redirect("/");
  });
}

export { getLoginForm, getRegisterForm, loginUser, logoutUser, registerUser };
