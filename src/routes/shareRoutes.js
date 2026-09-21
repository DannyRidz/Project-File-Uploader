import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import {
  createShareLink,
  downloadSharedFile,
  getSharedFolder,
  getShareFolderForm,
} from "../controllers/shareController.js";
import { ensureAuthenticated } from "../middleware/auth.js";

const shareRouter = Router();

const folderIdValidation = [
  param("folderId").isInt({ min: 1 }).withMessage("Invalid folder ID.").toInt(),
];

const durationValidation = [
  body("durationDays")
    .isInt({ min: 1, max: 30 })
    .withMessage("Duration must be between 1 and 30 days.")
    .toInt(),
];

const shareIdValidation = [
  param("shareId").isUUID().withMessage("Invalid share link."),
];

const fileIdValidation = [
  param("fileId").isInt({ min: 1 }).withMessage("Invalid file ID.").toInt(),
];

function rejectInvalidFolderId(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send("Invalid folder ID.");
  }

  return next();
}

function rejectInvalidShareRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send("Invalid share link.");
  }

  return next();
}

shareRouter.get(
  "/folders/:folderId/share",
  ensureAuthenticated,
  folderIdValidation,
  rejectInvalidFolderId,
  getShareFolderForm,
);

shareRouter.post(
  "/folders/:folderId/share",
  ensureAuthenticated,
  folderIdValidation,
  rejectInvalidFolderId,
  durationValidation,
  createShareLink,
);

shareRouter.get(
  "/share/:shareId",
  shareIdValidation,
  rejectInvalidShareRequest,
  getSharedFolder,
);

shareRouter.get(
  "/share/:shareId/files/:fileId/download",
  shareIdValidation,
  fileIdValidation,
  rejectInvalidShareRequest,
  downloadSharedFile,
);

export { shareRouter };
