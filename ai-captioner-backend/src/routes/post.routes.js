import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { createPost, getPosts, getUserPosts, deletePost } from "../controllers/post.controller.js";

const router = Router();

router.post("/", protect, upload.single("image"), createPost);
router.get("/", getPosts);

// New endpoints
router.get("/me", protect, getUserPosts);
router.delete("/:id", protect, deletePost);

export default router;
