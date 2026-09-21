import { validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import { supabase, supabaseBucket } from "../lib/supabase.js";

const appUrl = process.env.APP_URL;

if (!appUrl) {
  throw new Error("APP_URL is not defined");
}

function createShareUrl(shareId) {
  return new URL(`/share/${shareId}`, appUrl).toString();
}

function addUrlsToShares(shareLinks) {
  return shareLinks.map((shareLink) => ({
    ...shareLink,
    url: createShareUrl(shareLink.id),
  }));
}

async function findOwnedFolder(folderId, ownerId) {
  return prisma.folder.findFirst({
    where: {
      id: folderId,
      ownerId,
    },
    include: {
      shareLinks: {
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          expiresAt: "desc",
        },
      },
    },
  });
}

async function getShareFolderForm(req, res, next) {
  try {
    const folder = await findOwnedFolder(req.params.folderId, req.user.id);

    if (!folder) {
      return res.status(404).send("Folder not found.");
    }

    return res.render("share-folder", {
      folder,
      shares: addUrlsToShares(folder.shareLinks),
      createdShare: null,
      errors: [],
      values: {
        durationDays: 1,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createShareLink(req, res, next) {
  const errors = validationResult(req);

  try {
    const folder = await findOwnedFolder(req.params.folderId, req.user.id);

    if (!folder) {
      return res.status(404).send("Folder not found.");
    }

    if (!errors.isEmpty()) {
      return res.status(400).render("share-folder", {
        folder,
        shares: addUrlsToShares(folder.shareLinks),
        createdShare: null,
        errors: errors.array(),
        values: {
          durationDays: req.body.durationDays,
        },
      });
    }

    const durationDays = req.body.durationDays;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationDays * millisecondsPerDay);

    const shareLink = await prisma.shareLink.create({
      data: {
        folderId: folder.id,
        expiresAt,
      },
    });

    const createdShare = {
      ...shareLink,
      url: createShareUrl(shareLink.id),
    };

    return res.status(201).render("share-folder", {
      folder,
      shares: [createdShare, ...addUrlsToShares(folder.shareLinks)],
      createdShare,
      errors: [],
      values: {
        durationDays: 1,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function findActiveShare(shareId) {
  return prisma.shareLink.findFirst({
    where: {
      id: shareId,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      folder: {
        include: {
          files: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      },
    },
  });
}

async function getSharedFolder(req, res, next) {
  try {
    const shareLink = await findActiveShare(req.params.shareId);

    if (!shareLink) {
      return res.status(404).send("Share link not found or expired.");
    }

    return res.render("shared-folder", {
      shareLink,
      folder: shareLink.folder,
      files: shareLink.folder.files,
    });
  } catch (error) {
    return next(error);
  }
}

async function downloadSharedFile(req, res, next) {
  try {
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        id: req.params.shareId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!shareLink) {
      return res.status(404).send("Share link not found or expired.");
    }

    const file = await prisma.file.findFirst({
      where: {
        id: req.params.fileId,
        folderId: shareLink.folderId,
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

export {
  createShareLink,
  downloadSharedFile,
  getSharedFolder,
  getShareFolderForm,
};
