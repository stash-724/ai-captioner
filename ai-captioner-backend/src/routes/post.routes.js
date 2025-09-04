import { Router } from "express";
import multer from "multer";
import { protect } from "../middlewares/auth.middleware.js";
import { createPost, getPosts, getUserPosts, deletePost } from "../controllers/post.controller.js";

const router = Router();
const upload = multer(); // keeps file in memory for base64 conversion

router.post("/", protect, upload.single("image"), createPost);
router.get("/", getPosts);

// New endpoints
router.get("/me", protect, getUserPosts);
router.delete("/:id", protect, deletePost);

export default router;
