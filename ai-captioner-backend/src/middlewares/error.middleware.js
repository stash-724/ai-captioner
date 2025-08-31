// src/middlewares/error.middleware.js
export const notFound = (req, res, next) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
};
