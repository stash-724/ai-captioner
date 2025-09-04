import Post from "../models/Post.js";
import { uploadImage } from "../services/imagekit.service.js";
import { generateCaption } from "../services/ai.service.js";

// @desc Create new post
// @route POST /api/posts
// @access Private
export const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const base64 = req.file.buffer.toString("base64");
    const imageUrl = await uploadImage(`data:${req.file.mimetype};base64,${base64}`);

    // Always generate caption using Gemini
    const caption = await generateCaption(req.file.buffer, "Write a short, witty, and catchy caption for this image in 5 words or less.");
    console.log("Generated caption:", caption);

    const newPost = new Post({
      image: imageUrl,
      caption,
      user: req.user.id,
    });

    await newPost.save();
    res.status(201).json(newPost);

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Get all posts
// @route GET /api/posts
// @access Public
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "username email");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Get posts of logged-in user
// @route GET /api/posts/me
// @access Private
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).populate("user", "username email");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Delete a post
// @route DELETE /api/posts/:id
// @access Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    await post.remove();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
