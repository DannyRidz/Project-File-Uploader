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

export { getRegisterForm, registerUser };
