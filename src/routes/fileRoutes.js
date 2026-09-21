import { Router } from "express";
import { param, validationResult } from "express-validator";
import multer from "multer";
import { upload } from "../config/upload.js";
import {
  downloadFile,
  getFileDetails,
  uploadFile,
} from "../controllers/fileController.js";
import { ensureAuthenticated } from "../middleware/auth.js";

const fileRouter = Router();

const fileIdValidation = [
  param("fileId").isInt({ min: 1 }).withMessage("Invalid file ID.").toInt(),
];

function rejectInvalidFileId(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send("Invalid file ID.");
  }

  return next();
}

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

fileRouter.get(
  "/files/:fileId",
  ensureAuthenticated,
  fileIdValidation,
  rejectInvalidFileId,
  getFileDetails,
);

fileRouter.get(
  "/files/:fileId/download",
  ensureAuthenticated,
  fileIdValidation,
  rejectInvalidFileId,
  downloadFile,
);

export { fileRouter };
