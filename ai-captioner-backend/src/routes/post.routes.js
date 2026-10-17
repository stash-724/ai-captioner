import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import {
  createPost,
  getPosts,
  getUserPosts,
  deletePost,
  regenerateCaption,
  searchPosts,
  getSimilarPosts,
} from "../controllers/post.controller.js";

const router = Router();

router.post("/", protect, upload.single("image"), createPost);
router.get("/", getPosts);

// New endpoints
router.get("/me", protect, getUserPosts);

// Semantic search (CLIP + Atlas Vector Search)
router.get("/search", searchPosts);
router.get("/:id/similar", getSimilarPosts);
router.delete("/:id", protect, deletePost);
router.post("/:id/regenerate", protect, regenerateCaption);

export default router;
