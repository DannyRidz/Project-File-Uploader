import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));

app.get("/", (req, res) => {
  res.send("File Uploader is running!");
});

app.listen(PORT, () => {
  console.log(`File Uploader is running at http://localhost:${PORT}`);
});
