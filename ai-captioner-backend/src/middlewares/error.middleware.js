// src/middlewares/error.middleware.js
import multer from "multer";

export const notFound = (req, res, next) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : err.message;
    return res.status(status).json({ message });
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
};
