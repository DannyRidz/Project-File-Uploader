import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { supabase, supabaseBucket, supabaseUrl } from "../lib/supabase.js";

async function uploadFile(req, res, next) {
  if (!req.file) {
    return res.status(400).send("Choose a file to upload.");
  }

  const folderId = req.body.folderId ? Number(req.body.folderId) : null;

  if (folderId !== null && !Number.isInteger(folderId)) {
    return res.status(400).send("Invalid folder ID.");
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
        return res.status(404).send("Folder not found.");
      }
    }

    const extension = path.extname(req.file.originalname).toLowerCase();
    const storageKey = `${req.user.id}/${randomUUID()}${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(supabaseBucket)
      .upload(storageKey, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const objectUrl = new URL(
      `/storage/v1/object/authenticated/${supabaseBucket}/${storageKey}`,
      supabaseUrl,
    ).toString();

    try {
      await prisma.file.create({
        data: {
          originalName: req.file.originalname,
          storageKey,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: objectUrl,
          ownerId: req.user.id,
          folderId,
        },
      });
    } catch (databaseError) {
      const { error: cleanupError } = await supabase.storage
        .from(supabaseBucket)
        .remove([storageKey]);

      if (cleanupError) {
        console.error("Supabase cleanup failed:", cleanupError);
      }

      throw databaseError;
    }

    return res.redirect("/dashboard");
  } catch (error) {
    return next(error);
  }
}

async function getFileDetails(req, res, next) {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.fileId,
        ownerId: req.user.id,
      },
      include: {
        folder: true,
      },
    });

    if (!file) {
      return res.status(404).send("File not found.");
    }

    return res.render("file-details", { file });
  } catch (error) {
    return next(error);
  }
}

async function downloadFile(req, res, next) {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.fileId,
        ownerId: req.user.id,
      },
    });

    if (!file) {
      return res.status(404).send("File not found.");
    }

    const { data, error: downloadError } = await supabase.storage
      .from(supabaseBucket)
      .download(file.storageKey);

    if (downloadError) {
      throw new Error(`Supabase download failed: ${downloadError.message}`);
    }

    const fileBuffer = Buffer.from(await data.arrayBuffer());

    res.attachment(file.originalName);
    res.type(file.mimeType);

    return res.send(fileBuffer);
  } catch (error) {
    return next(error);
  }
}

export { downloadFile, getFileDetails, uploadFile };
