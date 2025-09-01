// src/app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import router from "./routes/user.routes.js";
 
const app = express();

// Middlewares
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS - allow local frontend by default; change in .env for production
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// TODO: later mount routes here:
// app.use("/api/auth", authRoutes);
app.use("/api/users", router);

// app.use("/api/posts", postRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
