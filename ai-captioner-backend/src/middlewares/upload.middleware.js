// src/middlewares/upload.middleware.js
import multer from "multer";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Keeps the file in memory so it can be sent to Gemini and ImageKit
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error("Only JPEG, PNG and WebP images are allowed");
    error.status = 400;
    cb(error);
  },
});
