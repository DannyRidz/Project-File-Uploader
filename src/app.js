import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import "./config/passport.js";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/authRoutes.js";
import { folderRouter } from "./routes/folderRoutes.js";
import { fileRouter } from "./routes/fileRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not defined");
}

app.set("views", "src/views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
    }),
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user ?? null;
  next();
});

app.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

app.use(authRouter);
app.use(folderRouter);
app.use(fileRouter);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("Something went wrong.");
});

app.listen(PORT, () => {
  console.log(`File Uploader is running at http://localhost:${PORT}`);
});
