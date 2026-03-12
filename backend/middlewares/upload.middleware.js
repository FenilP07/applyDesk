import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const allowedExtensions = /pdf|docx|doc/;
  const isExtValid = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const isMimeValid = allowedExtensions.test(file.mimetype);

  if (isExtValid && isMimeValid) {
    return callback(null, true);
  }
  callback(new Error("Invalid file type"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
