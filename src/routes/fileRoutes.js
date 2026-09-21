import { Router } from "express";
import multer from "multer";
import { upload } from "../config/upload.js";
import { uploadFile } from "../controllers/fileController.js";
import { ensureAuthenticated } from "../middleware/auth.js";

const fileRouter = Router();

function handleSingleFileUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).send("Files cannot exceed 5 MB.");
      }

      return res.status(400).send("The file could not be uploaded.");
    }

    return res.status(400).send(error.message);
  });
}

fileRouter.post(
  "/files",
  ensureAuthenticated,
  handleSingleFileUpload,
  uploadFile,
);

export { fileRouter };
