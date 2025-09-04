// src/routes/post.routes.js
import { Router } from "express";
import { createPost, getPosts } from "../controllers/post.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Create post (protected)
router.post("/", protect, createPost);

// Get all posts (public)
router.get("/", getPosts);

export default router;
