import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import {
  createFolder,
  deleteFolder,
  getDashboard,
  getEditFolderForm,
  updateFolder,
} from "../controllers/folderController.js";
import { ensureAuthenticated } from "../middleware/auth.js";

const folderRouter = Router();

const folderIdValidation = [
  param("folderId").isInt({ min: 1 }).withMessage("Invalid folder ID.").toInt(),
];

function rejectInvalidFolderId(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send("Invalid folder ID.");
  }

  return next();
}

const folderNameValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required.")
    .isLength({ max: 80 })
    .withMessage("Folder name cannot exceed 80 characters."),
];

folderRouter.get("/dashboard", ensureAuthenticated, getDashboard);

folderRouter.post(
  "/folders",
  ensureAuthenticated,
  folderNameValidation,
  createFolder,
);

folderRouter.get(
  "/folders/:folderId/edit",
  ensureAuthenticated,
  folderIdValidation,
  rejectInvalidFolderId,
  getEditFolderForm,
);

folderRouter.post(
  "/folders/:folderId/edit",
  ensureAuthenticated,
  folderIdValidation,
  rejectInvalidFolderId,
  folderNameValidation,
  updateFolder,
);

folderRouter.post(
  "/folders/:folderId/delete",
  ensureAuthenticated,
  folderIdValidation,
  rejectInvalidFolderId,
  deleteFolder,
);

export { folderRouter };
