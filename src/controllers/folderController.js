import { validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";

async function renderDashboard(res, user, options = {}) {
  const folders = await prisma.folder.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  return res.status(options.status ?? 200).render("dashboard", {
    folders,
    folderErrors: options.folderErrors ?? [],
    folderValues: options.folderValues ?? {
      name: "",
    },
  });
}

async function getDashboard(req, res, next) {
  try {
    return await renderDashboard(res, req.user);
  } catch (error) {
    return next(error);
  }
}

async function createFolder(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    try {
      return await renderDashboard(res, req.user, {
        status: 400,
        folderErrors: errors.array(),
        folderValues: {
          name: req.body.name,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  try {
    await prisma.folder.create({
      data: {
        name: req.body.name,
        ownerId: req.user.id,
      },
    });

    return res.redirect("/dashboard");
  } catch (error) {
    if (error.code === "P2002") {
      return renderDashboard(res, req.user, {
        status: 409,
        folderErrors: [
          {
            msg: "You already have a folder with that name.",
          },
        ],
        folderValues: {
          name: req.body.name,
        },
      });
    }

    return next(error);
  }
}

async function getEditFolderForm(req, res, next) {
  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.folderId,
        ownerId: req.user.id,
      },
    });

    if (!folder) {
      return res.status(404).send("Folder not found.");
    }

    return res.render("edit-folder", {
      folder,
      errors: [],
    });
  } catch (error) {
    return next(error);
  }
}

async function updateFolder(req, res, next) {
  const errors = validationResult(req);

  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.folderId,
        ownerId: req.user.id,
      },
    });

    if (!folder) {
      return res.status(404).send("Folder not found.");
    }

    if (!errors.isEmpty()) {
      return res.status(400).render("edit-folder", {
        folder: {
          ...folder,
          name: req.body.name,
        },
        errors: errors.array(),
      });
    }

    await prisma.folder.update({
      where: {
        id: folder.id,
      },
      data: {
        name: req.body.name,
      },
    });

    return res.redirect("/dashboard");
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).render("edit-folder", {
        folder: {
          id: req.params.folderId,
          name: req.body.name,
        },
        errors: [
          {
            msg: "You already have a folder with that name.",
          },
        ],
      });
    }

    return next(error);
  }
}

async function deleteFolder(req, res, next) {
  try {
    const result = await prisma.folder.deleteMany({
      where: {
        id: req.params.folderId,
        ownerId: req.user.id,
      },
    });

    if (result.count === 0) {
      return res.status(404).send("Folder not found.");
    }

    return res.redirect("/dashboard");
  } catch (error) {
    return next(error);
  }
}

export {
  createFolder,
  deleteFolder,
  getDashboard,
  getEditFolderForm,
  updateFolder,
};
