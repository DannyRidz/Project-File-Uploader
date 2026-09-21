import "dotenv/config";
import express from "express";
import { authRouter } from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("views", "src/views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));

app.get("/", (req, res) => {
  res.send(
    'File Uploader is running! <a href="/register">Create an account</a>',
  );
});

app.use(authRouter);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("Something went wrong.");
});

app.listen(PORT, () => {
  console.log(`File Uploader is running at http://localhost:${PORT}`);
});
