import { unlink } from "node:fs/promises";
import { prisma } from "../lib/prisma.js";

async function removeUploadedFile(file) {
  if (!file) {
    return;
  }

  try {
    await unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function uploadFile(req, res, next) {
  if (!req.file) {
    return res.status(400).send("Choose a file to upload.");
  }

  const folderId = req.body.folderId ? Number(req.body.folderId) : null;

  if (folderId !== null && !Number.isInteger(folderId)) {
    try {
      await removeUploadedFile(req.file);
      return res.status(400).send("Invalid folder ID.");
    } catch (error) {
      return next(error);
    }
  }

  try {
    if (folderId !== null) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: req.user.id,
        },
      });

      if (!folder) {
        await removeUploadedFile(req.file);
        return res.status(404).send("Folder not found.");
      }
    }

    await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storageKey: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        ownerId: req.user.id,
        folderId,
      },
    });

    return res.redirect("/dashboard");
  } catch (error) {
    try {
      await removeUploadedFile(req.file);
    } catch (cleanupError) {
      return next(cleanupError);
    }

    return next(error);
  }
}

export { uploadFile };
