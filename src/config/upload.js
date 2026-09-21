import path from "node:path";
import multer from "multer";

const allowedFileTypes = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["application/pdf", [".pdf"]],
  ["text/plain", [".txt"]],
]);

function fileFilter(req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = allowedFileTypes.get(file.mimetype);

  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return callback(
      new Error("Only JPEG, PNG, PDF, and plain-text files are allowed."),
    );
  }

  return callback(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export { upload };
